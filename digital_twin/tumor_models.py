"""
CARVanta – Cancer-Specific Tumor Models
==========================================
Detailed tumor growth, response, and resistance models
for each major cancer type treated with CAR-T therapy.

Implements:
- Gompertz and logistic growth models with cancer-specific parameters
- Tumor heterogeneity and clonal evolution
- Antigen escape dynamics
- Tumor microenvironment modeling (TME)
- Response evaluation criteria (RECIST, Lugano, IMWG)

References:
    - Norton-Simon hypothesis (1976)
    - Spratt et al., Cancer Research (1996) — tumor doubling times
    - Marusyk & Polyak, Biochimica et Biophysica Acta (2010) — clonal heterogeneity
    - Lee et al., Blood (2019) — CAR-T resistance mechanisms
"""

import math
import random
from typing import Optional, List, Dict
from dataclasses import dataclass, field


# ═══════════════════════════════════════════════════════════════════════════════
# Cancer Type Registry
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class CancerProfile:
    """Complete biological profile for a specific cancer type."""
    name: str
    code: str                          # ICD-10 style code
    category: str                      # hematologic / solid
    
    # Growth parameters
    doubling_time_days: float          # Tumor volume doubling time
    growth_fraction: float             # Fraction of cells actively dividing (0-1)
    gompertz_b: float                  # Gompertz deceleration constant
    max_tumor_cells: float             # Carrying capacity (theoretical max)
    
    # CAR-T sensitivity
    antigen_targets: List[str]         # Known targetable antigens
    typical_expression: float          # Typical target antigen expression (0-1)
    car_t_sensitivity: float           # Base sensitivity to CAR-T (0-1)
    resistance_rate: float             # Daily probability of resistance mutation
    
    # TME (Tumor Microenvironment)
    tme_immunosuppression: float       # How much TME suppresses T-cells (0-1)
    pd_l1_expression: float            # PD-L1 checkpoint level (0-1)
    treg_density: float                # Regulatory T-cell density (0-1)
    myeloid_suppression: float         # MDSC suppression (0-1)
    
    # Clinical characteristics
    typical_stage_at_diagnosis: str
    median_age_at_onset: int
    five_year_survival: float          # Without CAR-T
    car_t_overall_response_rate: float # Published ORR with CAR-T
    car_t_complete_response_rate: float
    
    # CRS risk profile
    crs_risk_multiplier: float         # Relative CRS risk (1.0 = average)
    neurotoxicity_risk: float          # ICANS risk (0-1)
    
    # Metastasis
    primary_met_sites: List[str]
    met_probability_per_month: float   # Monthly probability of new metastasis


# ─── Cancer Profiles Database ──────────────────────────────────────────────────

CANCER_PROFILES: Dict[str, CancerProfile] = {
    
    "DLBCL": CancerProfile(
        name="Diffuse Large B-Cell Lymphoma",
        code="C83.3",
        category="hematologic",
        doubling_time_days=25.0,
        growth_fraction=0.65,
        gompertz_b=0.0015,
        max_tumor_cells=1e13,
        antigen_targets=["CD19", "CD20", "CD22", "CD79b"],
        typical_expression=0.85,
        car_t_sensitivity=0.78,
        resistance_rate=0.004,
        tme_immunosuppression=0.3,
        pd_l1_expression=0.25,
        treg_density=0.15,
        myeloid_suppression=0.2,
        typical_stage_at_diagnosis="III",
        median_age_at_onset=64,
        five_year_survival=0.63,
        car_t_overall_response_rate=0.83,
        car_t_complete_response_rate=0.58,
        crs_risk_multiplier=1.0,
        neurotoxicity_risk=0.21,
        primary_met_sites=["bone_marrow", "spleen", "liver", "cns"],
        met_probability_per_month=0.05,
    ),
    
    "B-ALL": CancerProfile(
        name="B-Cell Acute Lymphoblastic Leukemia",
        code="C91.0",
        category="hematologic",
        doubling_time_days=4.0,
        growth_fraction=0.85,
        gompertz_b=0.002,
        max_tumor_cells=5e12,
        antigen_targets=["CD19", "CD22", "CD20"],
        typical_expression=0.95,
        car_t_sensitivity=0.90,
        resistance_rate=0.008,
        tme_immunosuppression=0.15,
        pd_l1_expression=0.10,
        treg_density=0.10,
        myeloid_suppression=0.12,
        typical_stage_at_diagnosis="N/A",
        median_age_at_onset=15,
        five_year_survival=0.70,
        car_t_overall_response_rate=0.93,
        car_t_complete_response_rate=0.81,
        crs_risk_multiplier=1.3,
        neurotoxicity_risk=0.15,
        primary_met_sites=["bone_marrow", "cns", "testes", "liver"],
        met_probability_per_month=0.12,
    ),
    
    "MCL": CancerProfile(
        name="Mantle Cell Lymphoma",
        code="C83.1",
        category="hematologic",
        doubling_time_days=45.0,
        growth_fraction=0.50,
        gompertz_b=0.001,
        max_tumor_cells=8e12,
        antigen_targets=["CD19", "CD20", "CD5"],
        typical_expression=0.80,
        car_t_sensitivity=0.72,
        resistance_rate=0.006,
        tme_immunosuppression=0.35,
        pd_l1_expression=0.15,
        treg_density=0.20,
        myeloid_suppression=0.25,
        typical_stage_at_diagnosis="IV",
        median_age_at_onset=68,
        five_year_survival=0.50,
        car_t_overall_response_rate=0.93,
        car_t_complete_response_rate=0.67,
        crs_risk_multiplier=0.9,
        neurotoxicity_risk=0.18,
        primary_met_sites=["bone_marrow", "gi_tract", "spleen", "liver"],
        met_probability_per_month=0.08,
    ),
    
    "FL": CancerProfile(
        name="Follicular Lymphoma",
        code="C82",
        category="hematologic",
        doubling_time_days=180.0,
        growth_fraction=0.30,
        gompertz_b=0.0005,
        max_tumor_cells=5e12,
        antigen_targets=["CD19", "CD20", "CD22"],
        typical_expression=0.88,
        car_t_sensitivity=0.80,
        resistance_rate=0.003,
        tme_immunosuppression=0.40,
        pd_l1_expression=0.20,
        treg_density=0.30,
        myeloid_suppression=0.15,
        typical_stage_at_diagnosis="III",
        median_age_at_onset=60,
        five_year_survival=0.90,
        car_t_overall_response_rate=0.86,
        car_t_complete_response_rate=0.69,
        crs_risk_multiplier=0.7,
        neurotoxicity_risk=0.10,
        primary_met_sites=["bone_marrow", "spleen", "liver"],
        met_probability_per_month=0.02,
    ),
    
    "MM": CancerProfile(
        name="Multiple Myeloma",
        code="C90.0",
        category="hematologic",
        doubling_time_days=60.0,
        growth_fraction=0.40,
        gompertz_b=0.001,
        max_tumor_cells=1e13,
        antigen_targets=["BCMA", "CD38", "SLAMF7", "GPRC5D"],
        typical_expression=0.75,
        car_t_sensitivity=0.70,
        resistance_rate=0.007,
        tme_immunosuppression=0.50,
        pd_l1_expression=0.30,
        treg_density=0.25,
        myeloid_suppression=0.35,
        typical_stage_at_diagnosis="III",
        median_age_at_onset=69,
        five_year_survival=0.54,
        car_t_overall_response_rate=0.73,
        car_t_complete_response_rate=0.33,
        crs_risk_multiplier=1.2,
        neurotoxicity_risk=0.08,
        primary_met_sites=["bone", "kidney", "bone_marrow"],
        met_probability_per_month=0.06,
    ),
    
    "CLL": CancerProfile(
        name="Chronic Lymphocytic Leukemia",
        code="C91.1",
        category="hematologic",
        doubling_time_days=365.0,
        growth_fraction=0.15,
        gompertz_b=0.0003,
        max_tumor_cells=1e13,
        antigen_targets=["CD19", "CD20", "ROR1"],
        typical_expression=0.70,
        car_t_sensitivity=0.65,
        resistance_rate=0.005,
        tme_immunosuppression=0.55,
        pd_l1_expression=0.15,
        treg_density=0.35,
        myeloid_suppression=0.30,
        typical_stage_at_diagnosis="II",
        median_age_at_onset=72,
        five_year_survival=0.87,
        car_t_overall_response_rate=0.74,
        car_t_complete_response_rate=0.21,
        crs_risk_multiplier=0.8,
        neurotoxicity_risk=0.12,
        primary_met_sites=["bone_marrow", "spleen", "liver", "lymph_nodes"],
        met_probability_per_month=0.01,
    ),
    
    "HL": CancerProfile(
        name="Hodgkin Lymphoma",
        code="C81",
        category="hematologic",
        doubling_time_days=35.0,
        growth_fraction=0.55,
        gompertz_b=0.001,
        max_tumor_cells=5e12,
        antigen_targets=["CD30", "CD123"],
        typical_expression=0.90,
        car_t_sensitivity=0.75,
        resistance_rate=0.004,
        tme_immunosuppression=0.60,
        pd_l1_expression=0.70,
        treg_density=0.40,
        myeloid_suppression=0.20,
        typical_stage_at_diagnosis="II",
        median_age_at_onset=32,
        five_year_survival=0.87,
        car_t_overall_response_rate=0.72,
        car_t_complete_response_rate=0.59,
        crs_risk_multiplier=0.6,
        neurotoxicity_risk=0.05,
        primary_met_sites=["mediastinum", "spleen", "liver", "bone_marrow"],
        met_probability_per_month=0.03,
    ),
    
    "GBM": CancerProfile(
        name="Glioblastoma Multiforme",
        code="C71",
        category="solid",
        doubling_time_days=50.0,
        growth_fraction=0.60,
        gompertz_b=0.002,
        max_tumor_cells=1e11,
        antigen_targets=["EGFRvIII", "IL13Ra2", "HER2", "GD2"],
        typical_expression=0.55,
        car_t_sensitivity=0.35,
        resistance_rate=0.012,
        tme_immunosuppression=0.80,
        pd_l1_expression=0.45,
        treg_density=0.50,
        myeloid_suppression=0.60,
        typical_stage_at_diagnosis="IV",
        median_age_at_onset=64,
        five_year_survival=0.07,
        car_t_overall_response_rate=0.30,
        car_t_complete_response_rate=0.05,
        crs_risk_multiplier=0.5,
        neurotoxicity_risk=0.45,
        primary_met_sites=["brain_contralateral", "spinal_cord"],
        met_probability_per_month=0.15,
    ),
    
    "PDAC": CancerProfile(
        name="Pancreatic Ductal Adenocarcinoma",
        code="C25",
        category="solid",
        doubling_time_days=40.0,
        growth_fraction=0.45,
        gompertz_b=0.0018,
        max_tumor_cells=5e11,
        antigen_targets=["Mesothelin", "HER2", "CEA", "Claudin18.2"],
        typical_expression=0.50,
        car_t_sensitivity=0.25,
        resistance_rate=0.015,
        tme_immunosuppression=0.85,
        pd_l1_expression=0.30,
        treg_density=0.45,
        myeloid_suppression=0.70,
        typical_stage_at_diagnosis="III",
        median_age_at_onset=70,
        five_year_survival=0.10,
        car_t_overall_response_rate=0.15,
        car_t_complete_response_rate=0.02,
        crs_risk_multiplier=0.4,
        neurotoxicity_risk=0.03,
        primary_met_sites=["liver", "peritoneum", "lung"],
        met_probability_per_month=0.20,
    ),
    
    "NSCLC": CancerProfile(
        name="Non-Small Cell Lung Cancer",
        code="C34",
        category="solid",
        doubling_time_days=130.0,
        growth_fraction=0.35,
        gompertz_b=0.0008,
        max_tumor_cells=1e12,
        antigen_targets=["Mesothelin", "HER2", "EGFR", "MUC1", "PD-L1"],
        typical_expression=0.45,
        car_t_sensitivity=0.30,
        resistance_rate=0.010,
        tme_immunosuppression=0.70,
        pd_l1_expression=0.50,
        treg_density=0.35,
        myeloid_suppression=0.50,
        typical_stage_at_diagnosis="III",
        median_age_at_onset=70,
        five_year_survival=0.25,
        car_t_overall_response_rate=0.20,
        car_t_complete_response_rate=0.03,
        crs_risk_multiplier=0.5,
        neurotoxicity_risk=0.05,
        primary_met_sites=["brain", "bone", "liver", "adrenal"],
        met_probability_per_month=0.10,
    ),
    
    "CRC": CancerProfile(
        name="Colorectal Cancer",
        code="C18",
        category="solid",
        doubling_time_days=90.0,
        growth_fraction=0.40,
        gompertz_b=0.001,
        max_tumor_cells=1e12,
        antigen_targets=["CEA", "HER2", "GUCY2C", "EpCAM"],
        typical_expression=0.60,
        car_t_sensitivity=0.28,
        resistance_rate=0.011,
        tme_immunosuppression=0.65,
        pd_l1_expression=0.20,
        treg_density=0.30,
        myeloid_suppression=0.45,
        typical_stage_at_diagnosis="III",
        median_age_at_onset=68,
        five_year_survival=0.65,
        car_t_overall_response_rate=0.18,
        car_t_complete_response_rate=0.03,
        crs_risk_multiplier=0.5,
        neurotoxicity_risk=0.04,
        primary_met_sites=["liver", "lung", "peritoneum"],
        met_probability_per_month=0.08,
    ),
    
    "HCC": CancerProfile(
        name="Hepatocellular Carcinoma",
        code="C22",
        category="solid",
        doubling_time_days=110.0,
        growth_fraction=0.35,
        gompertz_b=0.0009,
        max_tumor_cells=1e12,
        antigen_targets=["GPC3", "AFP", "MUC1", "EpCAM"],
        typical_expression=0.55,
        car_t_sensitivity=0.30,
        resistance_rate=0.013,
        tme_immunosuppression=0.75,
        pd_l1_expression=0.35,
        treg_density=0.40,
        myeloid_suppression=0.55,
        typical_stage_at_diagnosis="III",
        median_age_at_onset=63,
        five_year_survival=0.20,
        car_t_overall_response_rate=0.17,
        car_t_complete_response_rate=0.04,
        crs_risk_multiplier=0.6,
        neurotoxicity_risk=0.03,
        primary_met_sites=["lung", "bone", "adrenal", "peritoneum"],
        met_probability_per_month=0.09,
    ),
}


# ═══════════════════════════════════════════════════════════════════════════════
# Advanced Tumor Growth Models
# ═══════════════════════════════════════════════════════════════════════════════

def gompertz_growth(
    tumor_cells: float,
    cancer: CancerProfile,
    dt: float = 1.0,
    noise: float = 1.0,
) -> float:
    """
    Gompertz growth model — captures tumor deceleration at large sizes.
    
    dN/dt = -b * N * ln(N/K)
    
    where:
        N = current tumor cell count
        b = growth deceleration constant
        K = carrying capacity
    """
    if tumor_cells <= 0:
        return 0.0
    
    K = cancer.max_tumor_cells
    b = cancer.gompertz_b
    growth_rate = -b * tumor_cells * math.log(tumor_cells / K) * noise
    
    return max(0, tumor_cells + growth_rate * dt)


def logistic_growth(
    tumor_cells: float,
    cancer: CancerProfile,
    dt: float = 1.0,
    noise: float = 1.0,
) -> float:
    """
    Logistic growth model — S-curve growth with carrying capacity.
    
    dN/dt = r * N * (1 - N/K)
    """
    if tumor_cells <= 0:
        return 0.0
    
    K = cancer.max_tumor_cells
    r = math.log(2) / cancer.doubling_time_days * noise
    growth = r * tumor_cells * (1 - tumor_cells / K)
    
    return max(0, tumor_cells + growth * dt)


def exponential_growth(
    tumor_cells: float,
    cancer: CancerProfile,
    dt: float = 1.0,
    noise: float = 1.0,
) -> float:
    """Exponential growth — early-stage tumors before deceleration."""
    if tumor_cells <= 0:
        return 0.0
    
    r = math.log(2) / cancer.doubling_time_days * cancer.growth_fraction * noise
    return tumor_cells * math.exp(r * dt)


# ═══════════════════════════════════════════════════════════════════════════════
# Tumor Microenvironment (TME) Simulation
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class TMEState:
    """Current state of tumor microenvironment."""
    pd_l1_level: float = 0.0            # Checkpoint ligand expression
    treg_count: float = 0.0             # Regulatory T-cells in TME
    mdsc_count: float = 0.0             # Myeloid-derived suppressor cells
    hypoxia_level: float = 0.0          # Tumor hypoxia (0-1)
    tgf_beta: float = 0.0              # TGF-β (immunosuppressive cytokine)
    il10: float = 0.0                   # IL-10 (immunosuppressive cytokine)
    ifn_gamma: float = 0.0             # IFN-γ (immunostimulatory)
    vegf: float = 0.0                   # VEGF (angiogenesis)
    total_suppression: float = 0.0      # Combined suppression score


def simulate_tme(
    cancer: CancerProfile,
    tumor_cells: float,
    t_cells: float,
    day: int,
    noise_factor: float = 1.0,
) -> TMEState:
    """
    Simulate tumor microenvironment dynamics.
    
    TME becomes more immunosuppressive as tumor grows,
    but CAR-T infiltration can partially overcome it.
    """
    
    tme = TMEState()
    
    # Tumor size factor (larger tumors = more suppressive TME)
    tumor_factor = min(1.0, tumor_cells / (cancer.max_tumor_cells * 0.1))
    
    # PD-L1 expression increases adaptively when T-cells infiltrate
    adaptive_pdl1 = 0.3 * min(1.0, t_cells / 1e10)  # IFN-γ driven upregulation
    tme.pd_l1_level = min(1.0, cancer.pd_l1_expression + adaptive_pdl1) * noise_factor
    
    # Treg recruitment (increases with tumor burden and time)
    treg_base = cancer.treg_density * tumor_factor
    treg_recruitment = 0.1 * (day / 100) * tumor_factor
    tme.treg_count = min(1.0, treg_base + treg_recruitment) * noise_factor
    
    # MDSC accumulation
    tme.mdsc_count = min(1.0, cancer.myeloid_suppression * tumor_factor * (1 + day / 200)) * noise_factor
    
    # Hypoxia (proportional to tumor size)
    tme.hypoxia_level = min(1.0, 0.1 + 0.7 * tumor_factor) * noise_factor
    
    # Cytokine milieu
    tme.tgf_beta = 0.3 * tumor_factor + 0.2 * tme.treg_count
    tme.il10 = 0.2 * tumor_factor + 0.3 * tme.treg_count
    tme.ifn_gamma = 0.5 * min(1.0, t_cells / 1e10) * (1 - tme.pd_l1_level * 0.5)
    tme.vegf = 0.2 + 0.6 * tme.hypoxia_level  # Hypoxia-driven angiogenesis
    
    # Total immunosuppression score
    tme.total_suppression = (
        0.25 * tme.pd_l1_level +
        0.25 * tme.treg_count +
        0.20 * tme.mdsc_count +
        0.15 * tme.hypoxia_level +
        0.15 * (tme.tgf_beta + tme.il10) / 2
    )
    
    return tme


# ═══════════════════════════════════════════════════════════════════════════════
# Clonal Evolution & Resistance
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class TumorClone:
    """A subpopulation of tumor cells with distinct characteristics."""
    id: int
    cell_count: float
    antigen_positive: bool         # Expresses target antigen
    antigen_expression: float      # Expression level if positive
    growth_rate_modifier: float    # Relative growth advantage
    resistance_mechanism: str      # "none", "antigen_loss", "tme_remodeling", "checkpoint"
    emergence_day: int


def simulate_clonal_evolution(
    initial_cells: float,
    cancer: CancerProfile,
    antigen_expression: float,
    days: int = 365,
    t_cell_pressure: bool = True,
    seed: int = 42,
) -> Dict:
    """
    Simulate clonal evolution under CAR-T selective pressure.
    
    Key biological principles:
    1. Tumor cells are heterogeneous (different clones)
    2. CAR-T creates selective pressure against antigen-positive clones
    3. Antigen-negative clones can escape and become dominant
    4. New resistance mutations accumulate over time
    """
    
    random.seed(seed)
    
    # Initialize with primary clone (antigen-positive)
    clones = [
        TumorClone(
            id=0,
            cell_count=initial_cells * antigen_expression,
            antigen_positive=True,
            antigen_expression=antigen_expression,
            growth_rate_modifier=1.0,
            resistance_mechanism="none",
            emergence_day=0,
        ),
    ]
    
    # Small pre-existing antigen-negative subclone
    if antigen_expression < 1.0:
        clones.append(
            TumorClone(
                id=1,
                cell_count=initial_cells * (1 - antigen_expression),
                antigen_positive=False,
                antigen_expression=0.0,
                growth_rate_modifier=1.0,
                resistance_mechanism="antigen_loss",
                emergence_day=0,
            )
        )
    
    timeline = {
        "days": [],
        "total_cells": [],
        "antigen_positive_fraction": [],
        "num_clones": [],
        "dominant_clone_id": [],
        "resistance_events": [],
    }
    
    next_clone_id = len(clones)
    resistance_events = []
    
    for day in range(days):
        noise = 1.0 + random.gauss(0, 0.03)
        
        # ── Grow each clone ──────────────────────────────────────────
        for clone in clones:
            if clone.cell_count <= 0:
                continue
            
            # Growth
            growth_rate = (math.log(2) / cancer.doubling_time_days) * clone.growth_rate_modifier * noise
            clone.cell_count *= math.exp(growth_rate)
            
            # CAR-T killing (only antigen-positive clones)
            if t_cell_pressure and clone.antigen_positive and day < 90:
                # CAR-T is most active in first 90 days
                kill_efficiency = cancer.car_t_sensitivity * clone.antigen_expression
                kill_rate = kill_efficiency * max(0, 1 - day / 90) * 0.3
                clone.cell_count *= (1 - kill_rate)
            
            clone.cell_count = max(0, clone.cell_count)
        
        # ── Generate new resistance clones ───────────────────────────
        if t_cell_pressure and day > 14:
            for clone in list(clones):
                if clone.antigen_positive and clone.cell_count > 1000:
                    mutation_prob = cancer.resistance_rate * noise
                    
                    if random.random() < mutation_prob:
                        # Choose resistance mechanism
                        mechanism = random.choice([
                            "antigen_loss",      # CD19 loss → escape
                            "tme_remodeling",    # Upregulate checkpoints
                            "checkpoint",        # PD-L1 overexpression
                            "lineage_switch",    # B → myeloid lineage switch
                        ])
                        
                        new_cells = clone.cell_count * 0.001  # 0.1% of parent
                        clone.cell_count -= new_cells
                        
                        new_clone = TumorClone(
                            id=next_clone_id,
                            cell_count=new_cells,
                            antigen_positive=(mechanism != "antigen_loss"),
                            antigen_expression=0.0 if mechanism == "antigen_loss" else clone.antigen_expression * 0.3,
                            growth_rate_modifier=1.1,  # Slight growth advantage
                            resistance_mechanism=mechanism,
                            emergence_day=day,
                        )
                        clones.append(new_clone)
                        next_clone_id += 1
                        
                        resistance_events.append({
                            "day": day,
                            "mechanism": mechanism,
                            "clone_id": new_clone.id,
                            "parent_clone_id": clone.id,
                        })
        
        # Remove dead clones
        clones = [c for c in clones if c.cell_count > 1]
        
        # ── Record ───────────────────────────────────────────────────
        total = sum(c.cell_count for c in clones)
        ag_pos = sum(c.cell_count for c in clones if c.antigen_positive)
        
        dominant = max(clones, key=lambda c: c.cell_count) if clones else None
        
        timeline["days"].append(day)
        timeline["total_cells"].append(round(total))
        timeline["antigen_positive_fraction"].append(round(ag_pos / max(total, 1), 4))
        timeline["num_clones"].append(len(clones))
        timeline["dominant_clone_id"].append(dominant.id if dominant else -1)
        timeline["resistance_events"].append(len(resistance_events))
    
    # Build clone summary
    clone_summary = []
    for c in sorted(clones, key=lambda x: x.cell_count, reverse=True)[:10]:
        clone_summary.append({
            "clone_id": c.id,
            "cell_count": round(c.cell_count),
            "fraction": round(c.cell_count / max(sum(x.cell_count for x in clones), 1), 4),
            "antigen_positive": c.antigen_positive,
            "antigen_expression": c.antigen_expression,
            "resistance_mechanism": c.resistance_mechanism,
            "emergence_day": c.emergence_day,
        })
    
    return {
        "timeline": timeline,
        "resistance_events": resistance_events,
        "final_clones": clone_summary,
        "total_resistance_events": len(resistance_events),
        "antigen_loss_fraction": round(1 - timeline["antigen_positive_fraction"][-1], 4),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Response Criteria (RECIST / Lugano / IMWG)
# ═══════════════════════════════════════════════════════════════════════════════

def assess_response_recist(
    baseline_mm: float,
    current_mm: float,
    nadir_mm: float,
) -> Dict:
    """
    RECIST 1.1 criteria for solid tumors.
    
    CR: Disappearance of all target lesions
    PR: ≥30% decrease from baseline
    PD: ≥20% increase from nadir + ≥5mm absolute increase
    SD: Neither PR nor PD
    """
    reduction_pct = (baseline_mm - current_mm) / max(baseline_mm, 0.1) * 100
    increase_from_nadir = current_mm - nadir_mm
    increase_pct_from_nadir = increase_from_nadir / max(nadir_mm, 0.1) * 100
    
    if current_mm < 0.5:
        response = "CR"
        description = "Complete Response — no measurable disease"
    elif reduction_pct >= 30:
        response = "PR"
        description = f"Partial Response — {reduction_pct:.1f}% decrease"
    elif increase_pct_from_nadir >= 20 and increase_from_nadir >= 5:
        response = "PD"
        description = f"Progressive Disease — {increase_pct_from_nadir:.1f}% increase from nadir"
    else:
        response = "SD"
        description = "Stable Disease"
    
    return {
        "criteria": "RECIST 1.1",
        "response": response,
        "description": description,
        "reduction_from_baseline_pct": round(reduction_pct, 1),
        "increase_from_nadir_mm": round(increase_from_nadir, 1),
    }


def assess_response_lugano(
    baseline_mm: float,
    current_mm: float,
    nadir_mm: float,
    pet_positive: bool = True,
) -> Dict:
    """
    Lugano criteria for lymphoma (replaces Cheson/IWG).
    Incorporates PET-CT (Deauville score concept).
    """
    reduction_pct = (baseline_mm - current_mm) / max(baseline_mm, 0.1) * 100
    increase_from_nadir = current_mm - nadir_mm
    
    if current_mm < 1.5 and not pet_positive:
        response = "CMR"  # Complete Metabolic Response
        description = "Complete Metabolic Response — PET negative, no residual nodes >1.5cm"
    elif reduction_pct >= 50:
        response = "PMR"  # Partial Metabolic Response
        description = f"Partial Metabolic Response — {reduction_pct:.1f}% decrease"
    elif increase_from_nadir >= 15 or (increase_from_nadir / max(nadir_mm, 0.1) * 100 >= 50):
        response = "PMD"  # Progressive Metabolic Disease
        description = "Progressive Metabolic Disease — significant increase or new lesions"
    else:
        response = "NMR"  # No Metabolic Response
        description = "No Metabolic Response — stable uptake"
    
    return {
        "criteria": "Lugano 2014",
        "response": response,
        "description": description,
        "reduction_from_baseline_pct": round(reduction_pct, 1),
    }


def assess_response_imwg(
    baseline_mprotein: float,
    current_mprotein: float,
    baseline_plasma_cells_pct: float = 30.0,
    current_plasma_cells_pct: float = 10.0,
    serum_free_light_chain_ratio_normal: bool = False,
) -> Dict:
    """
    IMWG criteria for multiple myeloma.
    Uses M-protein (serum + urine), bone marrow plasma cells, FLC ratio.
    """
    mprotein_reduction_pct = (baseline_mprotein - current_mprotein) / max(baseline_mprotein, 0.01) * 100
    
    if current_mprotein <= 0 and current_plasma_cells_pct < 5 and serum_free_light_chain_ratio_normal:
        response = "sCR"
        description = "Stringent Complete Response — negative immunofixation, normal FLC ratio"
    elif current_mprotein <= 0 and current_plasma_cells_pct < 5:
        response = "CR"
        description = "Complete Response — negative immunofixation, <5% plasma cells"
    elif mprotein_reduction_pct >= 90:
        response = "VGPR"
        description = f"Very Good Partial Response — M-protein detectable but {mprotein_reduction_pct:.0f}% reduced"
    elif mprotein_reduction_pct >= 50:
        response = "PR"
        description = f"Partial Response — {mprotein_reduction_pct:.0f}% M-protein reduction"
    elif mprotein_reduction_pct >= 25:
        response = "MR"
        description = "Minimal Response — 25-49% M-protein reduction"
    elif mprotein_reduction_pct < -25:
        response = "PD"
        description = "Progressive Disease — >25% increase in M-protein"
    else:
        response = "SD"
        description = "Stable Disease"
    
    return {
        "criteria": "IMWG",
        "response": response,
        "description": description,
        "m_protein_reduction_pct": round(mprotein_reduction_pct, 1),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Comprehensive Simulation (Using Cancer Profile)
# ═══════════════════════════════════════════════════════════════════════════════

def simulate_with_cancer_profile(
    cancer_type: str,
    days: int = 365,
    tumor_burden_mm: float = 50.0,
    patient_age: int = 55,
    antigen_target: Optional[str] = None,
    custom_expression: Optional[float] = None,
    prior_lines: int = 2,
    ecog_status: int = 1,
    seed: int = 42,
) -> Dict:
    """
    Run a comprehensive simulation using a specific cancer profile.
    
    Returns detailed results including:
    - Tumor dynamics with cancer-specific growth model
    - TME evolution
    - Clonal evolution & resistance
    - Response assessment using appropriate criteria
    - Prognostic factors
    """
    
    # Flexible profile lookup: key, name, code, or case-insensitive
    cancer = CANCER_PROFILES.get(cancer_type)
    if not cancer:
        query = (cancer_type or '').strip().lower()
        for k, p in CANCER_PROFILES.items():
            if k.lower() == query or p.name.lower() == query or p.code.lower() == query or query in p.name.lower():
                cancer = p
                break

    if not cancer:
        return {"error": f"Unknown cancer type: {cancer_type}. Available: {list(CANCER_PROFILES.keys())}"}
    
    random.seed(seed)
    
    # Use cancer-specific defaults
    antigen_expr = custom_expression or cancer.typical_expression
    target = antigen_target or (cancer.antigen_targets[0] if cancer.antigen_targets else "Unknown")
    
    # Patient fitness modifiers
    age_factor = max(0.4, 1.0 - max(0, patient_age - cancer.median_age_at_onset) * 0.01)
    ecog_factor = max(0.3, 1.0 - ecog_status * 0.15)
    prior_lines_factor = max(0.3, 1.0 - (prior_lines - 1) * 0.1)
    
    overall_efficacy = (
        cancer.car_t_sensitivity *
        antigen_expr *
        age_factor *
        ecog_factor *
        prior_lines_factor *
        (1 - cancer.tme_immunosuppression * 0.5)
    )
    
    # Initialize
    stage_mult = {"I": 0.2, "II": 0.5, "III": 1.0, "IV": 2.5, "N/A": 1.0}.get(
        cancer.typical_stage_at_diagnosis, 1.0
    )
    initial_tumor_cells = (tumor_burden_mm ** 3) * 1e6 * stage_mult
    t_cells = 1e8
    tumor_cells = initial_tumor_cells
    tumor_mm = tumor_burden_mm
    nadir_mm = tumor_burden_mm
    
    timeline = {
        "days": [], "t_cells": [], "tumor_mm": [], "tumor_cells": [],
        "tme_suppression": [], "ag_pos_fraction": [], "response": [],
        "il6": [], "crp": [],
    }
    
    # Clonal tracking (simplified inline)
    ag_pos_cells = tumor_cells * antigen_expr
    ag_neg_cells = tumor_cells * (1 - antigen_expr)
    
    for day in range(days):
        noise = 1.0 + random.gauss(0, 0.025)
        
        # ── T-cell dynamics ──────────────────────────────────
        if day < 14:
            t_cells *= math.exp(math.log(2) / 1.5 * noise)
        elif day < 28:
            t_cells *= (1 - 0.07 * noise)
        else:
            memory = 1e8 * 0.1 * age_factor
            t_cells = max(memory, t_cells * (1 - 0.025 * noise))
        t_cells = min(t_cells, 1e11)
        t_cells = max(t_cells, 1e4)
        
        # ── TME ──────────────────────────────────────────────
        tme = simulate_tme(cancer, tumor_cells, t_cells, day, noise)
        
        # ── Tumor growth (Gompertz for realistic deceleration) ─
        growth_rate = (math.log(2) / cancer.doubling_time_days) * cancer.growth_fraction * noise
        
        # Ag+ cells: grow + get killed
        ag_pos_growth = ag_pos_cells * growth_rate * (1 - (ag_pos_cells + ag_neg_cells) / cancer.max_tumor_cells)
        kill_rate = overall_efficacy * (1 - tme.total_suppression * 0.7) * t_cells / (t_cells + 1e9) * noise
        ag_pos_cells = max(0, ag_pos_cells + ag_pos_growth - kill_rate * ag_pos_cells / (ag_pos_cells + 1e6))
        
        # Ag- cells: grow (no killing) + gain from resistance
        ag_neg_growth = ag_neg_cells * growth_rate * 1.05 * (1 - (ag_pos_cells + ag_neg_cells) / cancer.max_tumor_cells)
        resistance_transfer = ag_pos_cells * cancer.resistance_rate * (day / 365) * noise
        ag_neg_cells = max(0, ag_neg_cells + ag_neg_growth + resistance_transfer)
        ag_pos_cells = max(0, ag_pos_cells - resistance_transfer)
        
        tumor_cells = ag_pos_cells + ag_neg_cells
        tumor_mm = max(0, (tumor_cells / (1e6 * stage_mult)) ** (1/3)) if tumor_cells > 0 else 0
        nadir_mm = min(nadir_mm, tumor_mm)
        
        # ── Cytokines ────────────────────────────────────────
        crs_activity = 0
        if day < 21:
            crs_activity = math.exp(-0.5 * ((day - 5) / 3) ** 2)
            crs_activity *= min(1.0, initial_tumor_cells / 1e10) * cancer.crs_risk_multiplier * noise
        il6 = 5.0 + 5.0 * 200 * crs_activity
        crp = 3.0 * (1 + 50 * crs_activity)
        
        # ── Response ─────────────────────────────────────────
        ag_pos_frac = ag_pos_cells / max(tumor_cells, 1)
        
        if cancer.category == "hematologic":
            resp_data = assess_response_lugano(tumor_burden_mm, tumor_mm, nadir_mm)
            response = resp_data["response"]
        else:
            resp_data = assess_response_recist(tumor_burden_mm, tumor_mm, nadir_mm)
            response = resp_data["response"]
        
        timeline["days"].append(day)
        timeline["t_cells"].append(round(t_cells))
        timeline["tumor_mm"].append(round(tumor_mm, 2))
        timeline["tumor_cells"].append(round(tumor_cells))
        timeline["tme_suppression"].append(round(tme.total_suppression, 3))
        timeline["ag_pos_fraction"].append(round(ag_pos_frac, 4))
        timeline["response"].append(response)
        timeline["il6"].append(round(il6, 1))
        timeline["crp"].append(round(crp, 1))
    
    # Summary
    peak_t = max(timeline["t_cells"])
    final_resp = timeline["response"][-1]
    tumor_reduction = round((1 - tumor_mm / max(tumor_burden_mm, 0.1)) * 100, 1)
    
    # PFS
    pfs = days
    for i, r in enumerate(timeline["response"]):
        if i > 30 and r in ("PD", "PMD"):
            pfs = i
            break
    
    return {
        "cancer_type": cancer.name,
        "cancer_profile": {
            "name": cancer.name,
            "code": cancer.code,
            "category": cancer.category,
            "target_used": target,
            "published_orr": f"{cancer.car_t_overall_response_rate * 100:.0f}%",
            "published_cr_rate": f"{cancer.car_t_complete_response_rate * 100:.0f}%",
        },
        "timeline": timeline,
        "summary": {
            "best_response": final_resp,
            "tumor_reduction_pct": tumor_reduction,
            "nadir_tumor_mm": round(nadir_mm, 2),
            "final_tumor_mm": round(tumor_mm, 2),
            "peak_t_cells": peak_t,
            "max_il6": round(max(timeline["il6"]), 1),
            "final_ag_pos_fraction": round(timeline["ag_pos_fraction"][-1], 4),
            "antigen_loss_pct": round((1 - timeline["ag_pos_fraction"][-1]) * 100, 1),
            "pfs_days": pfs,
            "efficacy_score": round(overall_efficacy, 3),
        },
        "tme": {
            "tme_immunosuppression": round(cancer.tme_immunosuppression, 3),
            "pd_l1_expression": round(cancer.pd_l1_expression, 3),
            "treg_density": round(cancer.treg_density, 3),
            "myeloid_suppression": round(cancer.myeloid_suppression, 3),
        },
        "prognostic_factors": {
            "age_factor": round(age_factor, 3),
            "ecog_factor": round(ecog_factor, 3),
            "prior_lines_factor": round(prior_lines_factor, 3),
            "tme_impact": round(cancer.tme_immunosuppression, 3),
            "overall_efficacy": round(overall_efficacy, 3),
        },
    }


def get_cancer_profiles_summary() -> List[Dict]:
    """Return a summary of all available cancer profiles."""
    return [
        {
            "key": key,
            "cancer_type": key,
            "code": cancer.code,
            "name": cancer.name,
            "category": cancer.category,
            "doubling_time_days": cancer.doubling_time_days,
            "antigen_targets": cancer.antigen_targets,
            "primary_target": cancer.antigen_targets[0] if cancer.antigen_targets else "CD19",
            "car_t_orr": f"{cancer.car_t_overall_response_rate * 100:.0f}%",
            "car_t_cr": f"{cancer.car_t_complete_response_rate * 100:.0f}%",
            "typical_response_rate": round(cancer.car_t_overall_response_rate * 100, 1),
            "median_pfs_months": round(cancer.doubling_time_days / 30 * 2.5, 1),
            "crs_risk": "high" if cancer.crs_risk_multiplier > 1.0 else "moderate" if cancer.crs_risk_multiplier > 0.7 else "low",
            "five_year_survival": f"{cancer.five_year_survival * 100:.0f}%",
        }
        for key, cancer in CANCER_PROFILES.items()
    ]
