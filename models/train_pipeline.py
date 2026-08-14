"""
CARVanta – ML Training Pipeline v4
=====================================
Trains Random Forest + XGBoost classifier AND XGBoost regression ranker.
v4: Adds regression ranker that predicts continuous Clinical Success
    Probability (0-1), enabling ML-driven adaptive rankings.

Usage:
    cd CARVanta
    python models/train_pipeline.py
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import StratifiedKFold, cross_val_score, cross_validate
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score,
)

try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

# ─── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "biomarker_database.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "car_t_model.pkl")
RANKER_PATH = os.path.join(BASE_DIR, "models", "car_t_ranker.pkl")
REPORT_PATH = os.path.join(BASE_DIR, "data", "training_report.json")
CV_REPORT_PATH = os.path.join(BASE_DIR, "data", "cross_validation_report.json")

# ─── Feature engineering (v5) ──────────────────────────────────────────────────
# v5: Added cancer_type_encoded so the model learns cancer-specific scoring
# patterns, breaking the deterministic single-antigen-lookup problem.
ENGINEERED_FEATURES = [
    "tumor_specificity",
    "normal_expression_risk",
    "safety_margin",
    "stability_score",
    "literature_support",
    "immunogenicity_score",
    "surface_accessibility",
    "clinical_boost",
    "composite_score",
    "cancer_type_encoded",
]


# Cancer type to numeric encoding for ML features
_CANCER_TYPE_MAP = {}
_NEXT_CANCER_ID = [0]

def _encode_cancer_type(ct: str) -> float:
    """Encode cancer type string to a normalized float [0, 1]."""
    ct = str(ct).lower().strip()
    if ct not in _CANCER_TYPE_MAP:
        _CANCER_TYPE_MAP[ct] = _NEXT_CANCER_ID[0]
        _NEXT_CANCER_ID[0] += 1
    # Normalize to [0, 1] range — will be re-normalized after all types are seen
    return _CANCER_TYPE_MAP[ct]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute derived features from raw expression values (v5).
    
    v5: Added cancer_type_encoded so the model can learn
    cancer-specific scoring patterns. The same antigen in different
    cancer types will have different feature vectors.
    """
    df = df.copy()

    t = df["mean_tumor_expression"]
    n = df["mean_normal_expression"]

    # Core features
    df["tumor_specificity"] = (t / (t + n)).round(3)
    df["normal_expression_risk"] = ((n / 10.0).clip(upper=1.0) ** 1.5).round(3)
    df["safety_margin"] = (1 - df["normal_expression_risk"]).clip(lower=0).round(3)

    # v2: Ensure columns exist
    if "immunogenicity_score" not in df.columns:
        df["immunogenicity_score"] = 0.5
    if "surface_accessibility" not in df.columns:
        df["surface_accessibility"] = 0.5
    if "clinical_trials_count" not in df.columns:
        df["clinical_trials_count"] = 0

    # Clinical boost: log-scaled trial count influence
    df["clinical_boost"] = np.log1p(df["clinical_trials_count"]).round(3)
    # Normalize to [0, 1]
    max_boost = df["clinical_boost"].max()
    if max_boost > 0:
        df["clinical_boost"] = (df["clinical_boost"] / max_boost).round(3)

    # Composite score (v2)
    df["composite_score"] = (
        0.25 * df["tumor_specificity"] +
        0.20 * df["safety_margin"] +
        0.15 * df["stability_score"] +
        0.15 * df["literature_support"] +
        0.10 * df["immunogenicity_score"] +
        0.10 * df["surface_accessibility"] +
        0.05 * df["clinical_boost"]
    ).round(3)

    # v5: Cancer type encoding — gives model cancer-context awareness
    if "cancer_type" in df.columns:
        df["cancer_type_encoded"] = df["cancer_type"].apply(_encode_cancer_type)
        # Normalize to [0, 1] after all types are encoded
        max_ct = df["cancer_type_encoded"].max()
        if max_ct > 0:
            df["cancer_type_encoded"] = (df["cancer_type_encoded"] / max_ct).round(3)
    else:
        df["cancer_type_encoded"] = 0.0

    return df


def train():
    """Main training pipeline (v5).
    
    v5 fixes: Adds noise augmentation to prevent the model from perfectly
    memorizing the deterministic CVS formula. Without this, the model
    just learns to replicate the rule-based score, adding zero value.
    """

    print("=" * 60)
    print("  CARVanta ML Training Pipeline v5")
    print("  (Cancer-Context-Aware + Noise-Augmented)")
    print("=" * 60)

    # ── Load data ────────────────────────────────────────────────────────────
    print(f"\n  Loading data from {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"  Rows: {len(df):,}  Columns: {list(df.columns)}")

    # ── Engineer features ────────────────────────────────────────────────────
    print("\n  Engineering features...")
    df = engineer_features(df)

    X = df[ENGINEERED_FEATURES].values
    y = df["viability_label"].values

    # v5: Noise augmentation — add small Gaussian noise to features
    # to prevent the model from perfectly memorizing the deterministic
    # formula. This forces the model to learn robust patterns rather
    # than just replicating the weighted sum.
    rng = np.random.RandomState(42)
    noise_scale = 0.03  # ±3% noise on each feature
    X_noisy = X + rng.normal(0, noise_scale, size=X.shape)
    X_noisy = np.clip(X_noisy, 0, 1)  # Keep features in [0, 1]
    
    # Combine original + noisy data for training robustness
    X_augmented = np.vstack([X, X_noisy])
    y_augmented = np.concatenate([y, y])
    
    viable_count = int(y.sum())
    total = len(y)
    print(f"  Features: {ENGINEERED_FEATURES}")
    print(f"  Original rows: {total:,}")
    print(f"  Augmented rows: {len(y_augmented):,} (2x with noise)")
    print(f"  Viable: {viable_count:,} ({viable_count/total:.1%})")
    print(f"  Non-viable: {total - viable_count:,} ({(total - viable_count)/total:.1%})")

    # ── Define models ────────────────────────────────────────────────────────
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=10,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    if HAS_XGB:
        xgb = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=max((total - viable_count) / max(viable_count, 1), 1),
            random_state=42,
            eval_metric="logloss",
            use_label_encoder=False,
        )
        ensemble = VotingClassifier(
            estimators=[("rf", rf), ("xgb", xgb)],
            voting="soft",
        )
    else:
        print("  [WARN] XGBoost not available, using RandomForest only")
        ensemble = rf

    # ── Cross-validation with per-fold metrics ────────────────────────────────
    print("\n  Running 5-fold stratified cross-validation (on augmented data)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Multi-metric CV on augmented data
    scoring_metrics = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    cv_results = cross_validate(
        ensemble, X_augmented, y_augmented, cv=cv,
        scoring=scoring_metrics,
        return_train_score=False,
    )

    # Per-fold metrics log
    fold_results = []
    for i in range(5):
        fold_data = {
            "fold": i + 1,
            "accuracy": round(float(cv_results["test_accuracy"][i]), 4),
            "precision": round(float(cv_results["test_precision"][i]), 4),
            "recall": round(float(cv_results["test_recall"][i]), 4),
            "f1": round(float(cv_results["test_f1"][i]), 4),
            "roc_auc": round(float(cv_results["test_roc_auc"][i]), 4),
        }
        fold_results.append(fold_data)
        print(f"    Fold {i+1}: Acc={fold_data['accuracy']:.4f}  "
              f"F1={fold_data['f1']:.4f}  AUC={fold_data['roc_auc']:.4f}")

    # Aggregate CV metrics
    cv_aggregate = {}
    for metric in scoring_metrics:
        values = cv_results[f"test_{metric}"]
        cv_aggregate[metric] = {
            "mean": round(float(values.mean()), 4),
            "std": round(float(values.std()), 4),
        }
    print(f"\n  Aggregate CV Metrics:")
    for metric, vals in cv_aggregate.items():
        print(f"    {metric:<12} {vals['mean']:.4f} ± {vals['std']:.4f}")

    # ── Train final model on full data ───────────────────────────────────────
    print("\n  Training final model on augmented dataset...")
    ensemble.fit(X_augmented, y_augmented)

    # Evaluate on original (non-noisy) data to get true metrics
    preds = ensemble.predict(X)
    train_acc = accuracy_score(y, preds)
    train_prec = precision_score(y, preds, zero_division=0)
    train_rec = recall_score(y, preds, zero_division=0)
    train_f1 = f1_score(y, preds, zero_division=0)

    print(f"\n  Training Set Metrics:")
    print(f"    Accuracy:   {train_acc:.4f}")
    print(f"    Precision:  {train_prec:.4f}")
    print(f"    Recall:     {train_rec:.4f}")
    print(f"    F1-Score:   {train_f1:.4f}")
    print(f"\n  Classification Report:")
    print(classification_report(y, preds, target_names=["Non-Viable", "Viable"]))

    cm = confusion_matrix(y, preds)
    print(f"  Confusion Matrix:")
    print(f"    TN={cm[0][0]:,}  FP={cm[0][1]:,}")
    print(f"    FN={cm[1][0]:,}  TP={cm[1][1]:,}")

    # ── Feature importance ───────────────────────────────────────────────────
    importance = {}
    try:
        if hasattr(ensemble, "feature_importances_"):
            imp = ensemble.feature_importances_
        elif hasattr(ensemble, "estimators_"):
            imp_list = [
                est.feature_importances_
                for _, est in ensemble.estimators_
                if hasattr(est, "feature_importances_")
            ]
            imp = np.mean(imp_list, axis=0) if imp_list else None
        else:
            imp = None

        if imp is not None:
            importance = {
                ENGINEERED_FEATURES[i]: round(float(imp[i]), 4)
                for i in range(len(ENGINEERED_FEATURES))
            }
            print("\n  Feature Importance:")
            for feat, val in sorted(importance.items(), key=lambda x: x[1], reverse=True):
                bar = "#" * int(val * 50)
                print(f"    {feat:<25s} {val:.4f}  {bar}")
    except Exception:
        pass

    # ── Save model ───────────────────────────────────────────────────────────
    joblib.dump(ensemble, MODEL_PATH)
    print(f"\n  Model saved: {MODEL_PATH}")

    # ── Save report ──────────────────────────────────────────────────────────
    report = {
        "version": "v5",
        "features": ENGINEERED_FEATURES,
        "dataset_rows": len(df),
        "augmented_rows": len(y_augmented),
        "viable_count": viable_count,
        "cv_metrics": cv_aggregate,
        "cv_fold_results": fold_results,
        "train_accuracy": round(train_acc, 4),
        "train_precision": round(train_prec, 4),
        "train_recall": round(train_rec, 4),
        "train_f1": round(train_f1, 4),
        "feature_importance": importance,
        "cancer_type_encoding": dict(_CANCER_TYPE_MAP),
    }
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)
    print(f"  Report saved: {REPORT_PATH}")

    # Save cross-validation report separately
    cv_report = {
        "k": 5,
        "scoring_metrics": scoring_metrics,
        "fold_results": fold_results,
        "aggregate": cv_aggregate,
    }
    with open(CV_REPORT_PATH, "w") as f:
        json.dump(cv_report, f, indent=2)
    print(f"  CV Report saved: {CV_REPORT_PATH}")
    print("\n" + "=" * 60)

    return report


def train_ranker():
    """
    CARVanta v4: Train a regression ranker that predicts continuous
    Clinical Success Probability (0.0 – 1.0).

    Ground truth is derived from:
    - clinical_trials_count (more trials → higher validation)
    - viability_label (binary expert annotation)
    - Feature quality signals (stability, specificity, etc.)

    The ranker output is blended with CVS for adaptive ranking.
    """
    print("\n" + "=" * 60)
    print("  CARVanta ML Ranker Training (v4)")
    print("=" * 60)

    if not HAS_XGB:
        print("  [WARN] XGBoost not available, skipping ranker training.")
        return None

    # Load and engineer features
    df = pd.read_csv(DATA_PATH)
    df = engineer_features(df)

    X = df[ENGINEERED_FEATURES].values

    # v5: Add noise augmentation for ranker too
    rng = np.random.RandomState(42)
    X_noisy = X + rng.normal(0, 0.03, size=X.shape)
    X_noisy = np.clip(X_noisy, 0, 1)

    # ── Compute continuous success target ──────────────────────────────────
    # This is the key innovation: instead of binary 0/1, we create a
    # continuous target (0.0 - 1.0) that represents clinical success
    # probability based on multiple evidence signals.
    trials = df["clinical_trials_count"].values.astype(float)
    label = df["viability_label"].values.astype(float)
    ts = df["tumor_specificity"].values
    sm = df["safety_margin"].values
    stab = df["stability_score"].values
    lit = df["literature_support"].values

    # Normalized trial score: log-scaled, capped at 1.0
    max_trials = max(trials.max(), 1)
    trial_score = np.log1p(trials) / np.log1p(max_trials)

    # Evidence-weighted success probability:
    #   40% clinical trial evidence (real-world validation)
    #   25% expert viability label
    #   15% tumor specificity (biological basis)
    #   10% safety margin (therapeutic window)
    #   10% literature + stability (data quality)
    y_continuous = (
        0.40 * trial_score +
        0.25 * label +
        0.15 * ts +
        0.10 * sm +
        0.10 * ((lit + stab) / 2)
    ).clip(0, 1)

    # Augment target with noise for noisy features
    y_noisy = y_continuous + rng.normal(0, 0.02, size=y_continuous.shape)
    y_noisy = np.clip(y_noisy, 0, 1)
    X_aug = np.vstack([X, X_noisy])
    y_aug = np.concatenate([y_continuous, y_noisy])

    print(f"  Training data: {len(df):,} rows (augmented: {len(y_aug):,})")
    print(f"  Target range: [{y_continuous.min():.3f}, {y_continuous.max():.3f}]")
    print(f"  Target mean:  {y_continuous.mean():.3f}")

    # ── Train XGBRegressor ─────────────────────────────────────────────────
    ranker = XGBRegressor(
        n_estimators=150,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
    )

    # 3-fold cross-validation (faster than 5-fold with augmented data)
    from sklearn.model_selection import KFold, cross_val_score
    kf = KFold(n_splits=3, shuffle=True, random_state=42)
    cv_r2 = cross_val_score(ranker, X_aug, y_aug, cv=kf, scoring="r2")
    cv_mae = -cross_val_score(ranker, X_aug, y_aug, cv=kf, scoring="neg_mean_absolute_error")

    print(f"\n  Cross-Validation (3-fold):")
    print(f"    R²:  {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")
    print(f"    MAE: {cv_mae.mean():.4f} ± {cv_mae.std():.4f}")

    # Train on full data
    ranker.fit(X_aug, y_aug)

    # Training set predictions
    y_pred = ranker.predict(X)
    train_r2 = 1 - np.sum((y_continuous - y_pred) ** 2) / np.sum((y_continuous - y_continuous.mean()) ** 2)
    train_mae = np.mean(np.abs(y_continuous - y_pred))

    print(f"\n  Training Set Metrics:")
    print(f"    R²:  {train_r2:.4f}")
    print(f"    MAE: {train_mae:.4f}")

    # Feature importance for ranker
    importance = {}
    if hasattr(ranker, "feature_importances_"):
        imp = ranker.feature_importances_
        importance = {
            ENGINEERED_FEATURES[i]: round(float(imp[i]), 4)
            for i in range(len(ENGINEERED_FEATURES))
        }
        print("\n  Ranker Feature Importance:")
        for feat, val in sorted(importance.items(), key=lambda x: x[1], reverse=True):
            bar = "#" * int(val * 50)
            print(f"    {feat:<25s} {val:.4f}  {bar}")

    # Save ranker
    joblib.dump(ranker, RANKER_PATH)
    print(f"\n  Ranker saved: {RANKER_PATH}")

    # Verify: show top-5 predictions for known targets
    known = df[df["antigen_name"].isin(["CD19", "BCMA", "CD22", "HER2", "EGFR", "MESOTHELIN"])]
    if len(known) > 0:
        known_X = engineer_features(known)[ENGINEERED_FEATURES].values
        known_preds = ranker.predict(known_X)
        print("\n  Verification — Predicted Clinical Success Probability:")
        for i, (_, row) in enumerate(known.iterrows()):
            print(f"    {row['antigen_name']:>12s} ({row['cancer_type']:<20s}) -> {known_preds[i]:.3f}")

    print("\n" + "=" * 60)
    return {"cv_r2_mean": round(cv_r2.mean(), 4), "cv_mae_mean": round(cv_mae.mean(), 4)}


if __name__ == "__main__":
    train()
    train_ranker()
