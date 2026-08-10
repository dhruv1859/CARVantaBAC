import { useState } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
  header: { marginBottom: 24, textAlign: 'center' as const },
  h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: 14, color: 'var(--text-muted, #94a3b8)', margin: 0 },
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.1))', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  btn: { background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' },
  btnSec: { background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', color: 'var(--text-primary, #e2e8f0)', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  badge: (c: string) => ({ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, display: 'inline-block' }),
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 } as React.CSSProperties,
  stat: (a: string) => ({ background: `linear-gradient(135deg, ${a}10, ${a}05)`, border: `1px solid ${a}25`, borderRadius: 12, padding: '16px 14px', textAlign: 'center' as const }) as React.CSSProperties,
  sv: { fontSize: 22, fontWeight: 800, color: 'var(--text-primary, #f1f5f9)', display: 'block' },
  sl: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  progressBar: { height: 10, borderRadius: 6, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' as const },
  progressFill: (pct: number, c: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 6, background: `linear-gradient(90deg, ${c}, ${c}cc)`, transition: 'width 0.8s ease' }),
};

const gradeColors: Record<string, string> = { A: '#10b981', B: '#06b6d4', C: '#f59e0b', D: '#ef4444' };

export default function ModelValidation() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'full' | 'quick'>('full');

  const run = async (endpoint: string) => {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch(`${API}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const cert = data?.certification;
  const clf = data?.classifier;
  const ranker = data?.ranker;
  const fda = data?.fda_validation;
  const robust = data?.robustness;
  const stats = data?.statistical_significance;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>🏆 Model Validation & Certification</h1>
        <p style={S.subtitle}>Cross-validation • FDA ground-truth • Robustness • Statistical significance • ISO/IEC 25010</p>
      </div>

      {/* Run buttons */}
      <div style={{ ...S.card, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={() => { setMode('full'); run('/api/v5/validation/run'); }} disabled={loading}>
          {loading && mode === 'full' ? '⏳ Running Full Validation...' : '🔬 Run Full Validation Suite'}
        </button>
        <button style={{ ...S.btnSec, opacity: loading ? 0.7 : 1 }} onClick={() => { setMode('quick'); run('/api/v5/validation/quick'); }} disabled={loading}>
          {loading && mode === 'quick' ? '⏳ Quick Check...' : '⚡ Quick Validation'}
        </button>
      </div>

      {error && <div style={S.error}>⚠️ {error}</div>}

      {loading && (
        <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {mode === 'full' ? 'Running Full Validation Suite...' : 'Quick Validation...'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {mode === 'full' ? 'Cross-validation • FDA targets • Robustness • Statistics (30-60 sec)' : 'Classifier + FDA targets (10-20 sec)'}
          </div>
        </div>
      )}

      {/* ═══ CERTIFICATION CARD ═══ */}
      {cert && (
        <div style={{ ...S.card, borderLeft: `4px solid ${gradeColors[cert.overall_grade] || '#94a3b8'}` }}>
          <h3 style={S.sTitle}>
            <span>🏆 Certification Report</span>
            <span style={S.badge(gradeColors[cert.overall_grade] || '#94a3b8')}>{cert.certification_status}</span>
          </h3>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 64, fontWeight: 900, color: gradeColors[cert.overall_grade] || '#94a3b8', lineHeight: 1 }}>
              {cert.overall_grade}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
              {cert.overall_score}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              ID: {cert.certification_id}
            </div>
          </div>

          {/* Criteria breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(cert.criteria || {}).map(([name, info]: [string, any]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 180, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
                  {name.replace(/_/g, ' ')}
                </span>
                <div style={{ flex: 1, ...S.progressBar }}>
                  <div style={S.progressFill(typeof info.value === 'number' ? info.value : 0, gradeColors[info.grade] || '#94a3b8')} />
                </div>
                <span style={S.badge(gradeColors[info.grade] || '#94a3b8')}>{info.grade}</span>
                <span style={{ width: 50, textAlign: 'right', fontSize: 12, fontWeight: 700, color: gradeColors[info.grade] || '#94a3b8' }}>
                  {typeof info.value === 'number' ? (info.value > 1 ? info.value.toFixed(1) : (info.value * 100).toFixed(1)) : info.value}
                </span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {cert.recommendations?.length > 0 && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(148,163,184,0.06)', fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {cert.recommendations.map((r: string, i: number) => <div key={i}>{r}</div>)}
            </div>
          )}

          {/* Standards */}
          <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cert.standards_reference?.map((s: string, i: number) => (
              <span key={i} style={S.badge('#64748b')}>{s.split(' — ')[0]}</span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ AI INSIGHT ═══ */}
      {data?.ai_insight && (
        <div style={{ ...S.card, borderLeft: `4px solid ${data.ai_insight_source === 'llm' ? '#10b981' : '#8b5cf6'}` }}>
          <h3 style={{ ...S.sTitle, justifyContent: 'space-between' }}>
            <span>🤖 AI Interpretation</span>
            <span style={S.badge(data.ai_insight_source === 'llm' ? '#10b981' : '#8b5cf6')}>
              {data.ai_insight_source === 'llm' ? '🤖 LLM' : '📐 Rule-Based'}
            </span>
          </h3>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}
            dangerouslySetInnerHTML={{ __html: data.ai_insight.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>').replace(/\n/g, '<br/>') }}
          />
        </div>
      )}

      {/* ═══ CLASSIFIER METRICS ═══ */}
      {clf && (
        <div style={S.card}>
          <h3 style={S.sTitle}>📊 Classifier Cross-Validation ({clf.k_folds}-Fold)</h3>
          <div style={S.statGrid}>
            <div style={S.stat('#10b981')}><span style={S.sv}>{clf.aggregate?.accuracy?.mean}</span><span style={S.sl}>Accuracy</span></div>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{clf.aggregate?.roc_auc?.mean}</span><span style={S.sl}>AUC-ROC</span></div>
            <div style={S.stat('#8b5cf6')}><span style={S.sv}>{clf.aggregate?.f1?.mean}</span><span style={S.sl}>F1 Score</span></div>
            <div style={S.stat('#f59e0b')}><span style={S.sv}>{clf.aggregate?.precision?.mean}</span><span style={S.sl}>Precision</span></div>
            <div style={S.stat('#ef4444')}><span style={S.sv}>{clf.aggregate?.recall?.mean}</span><span style={S.sl}>Recall</span></div>
            <div style={S.stat(clf.overfit_status === 'OK' ? '#10b981' : '#ef4444')}>
              <span style={S.sv}>{clf.overfit_gap}</span><span style={S.sl}>Overfit Gap</span>
            </div>
            <div style={S.stat(clf.brier_score < 0.1 ? '#10b981' : '#f59e0b')}>
              <span style={S.sv}>{clf.brier_score}</span><span style={S.sl}>Brier Score</span>
            </div>
            <div style={S.stat('#3b82f6')}><span style={S.sv}>{clf.dataset_size?.toLocaleString()}</span><span style={S.sl}>Dataset Size</span></div>
          </div>

          {/* Per-fold table */}
          {clf.fold_results && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 12 }}>
              <thead><tr style={{ borderBottom: '2px solid rgba(148,163,184,0.15)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fold</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accuracy</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precision</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recall</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>F1</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AUC-ROC</th>
              </tr></thead>
              <tbody>
                {clf.fold_results.map((f: any) => (
                  <tr key={f.fold} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>Fold {f.fold}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: f.accuracy > 0.95 ? '#10b981' : '#f1f5f9' }}>{f.accuracy}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{f.precision}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{f.recall}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{f.f1}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: f.roc_auc > 0.95 ? '#10b981' : '#f1f5f9' }}>{f.roc_auc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Confusion Matrix */}
          {clf.confusion_matrix && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Confusion Matrix</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 320 }}>
                <div style={{ ...S.stat('#10b981'), padding: '12px 8px' }}><span style={{ ...S.sv, fontSize: 18 }}>{clf.confusion_matrix.true_negatives}</span><span style={S.sl}>True Neg</span></div>
                <div style={{ ...S.stat('#ef4444'), padding: '12px 8px' }}><span style={{ ...S.sv, fontSize: 18 }}>{clf.confusion_matrix.false_positives}</span><span style={S.sl}>False Pos</span></div>
                <div style={{ ...S.stat('#f59e0b'), padding: '12px 8px' }}><span style={{ ...S.sv, fontSize: 18 }}>{clf.confusion_matrix.false_negatives}</span><span style={S.sl}>False Neg</span></div>
                <div style={{ ...S.stat('#06b6d4'), padding: '12px 8px' }}><span style={{ ...S.sv, fontSize: 18 }}>{clf.confusion_matrix.true_positives}</span><span style={S.sl}>True Pos</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ FDA VALIDATION ═══ */}
      {fda && (
        <div style={{ ...S.card, borderLeft: `4px solid ${fda.all_fda_pass ? '#10b981' : '#ef4444'}` }}>
          <h3 style={S.sTitle}>
            <span>🏥 FDA Ground-Truth Validation</span>
            <span style={S.badge(fda.all_fda_pass ? '#10b981' : '#ef4444')}>
              {fda.fda_pass_rate}% Pass Rate
            </span>
          </h3>
          <div style={S.statGrid}>
            <div style={S.stat('#10b981')}><span style={S.sv}>{fda.fda_passed}/{fda.fda_total}</span><span style={S.sl}>FDA Targets Passed</span></div>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{fda.negative_correct}/{fda.negative_total}</span><span style={S.sl}>Negative Controls</span></div>
            <div style={S.stat('#8b5cf6')}><span style={S.sv}>{fda.negative_specificity}%</span><span style={S.sl}>Specificity</span></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(fda.fda_targets || {}).map(([target, info]: [string, any]) => (
              <div key={target} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: info.pass ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${info.pass ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                <span style={{ fontSize: 18, fontWeight: 800, width: 80, color: info.pass ? '#10b981' : '#ef4444' }}>{target}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{info.CVS?.toFixed(3)}</span>
                <span style={S.badge(info.pass ? '#10b981' : '#ef4444')}>{info.tier}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{info.indication}</span>
                <span style={{ fontSize: 16 }}>{info.pass ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RANKER ═══ */}
      {ranker && ranker.status !== 'skipped' && (
        <div style={S.card}>
          <h3 style={S.sTitle}>📈 Regression Ranker Validation</h3>
          <div style={S.statGrid}>
            <div style={S.stat('#10b981')}><span style={S.sv}>{ranker.cv_r2?.mean}</span><span style={S.sl}>CV R²</span></div>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{ranker.cv_mae?.mean}</span><span style={S.sl}>CV MAE</span></div>
            <div style={S.stat('#8b5cf6')}><span style={S.sv}>{ranker.spearman_rho}</span><span style={S.sl}>Spearman ρ</span></div>
            <div style={S.stat('#f59e0b')}><span style={S.sv}>{ranker.pearson_r}</span><span style={S.sl}>Pearson r</span></div>
            <div style={S.stat('#3b82f6')}><span style={S.sv}>{ranker.cv_rmse?.mean}</span><span style={S.sl}>CV RMSE</span></div>
            <div style={S.stat(ranker.ranking_quality === 'Excellent' ? '#10b981' : '#f59e0b')}>
              <span style={S.sv}>{ranker.ranking_quality}</span><span style={S.sl}>Quality</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ROBUSTNESS ═══ */}
      {robust && (
        <div style={S.card}>
          <h3 style={S.sTitle}>
            <span>🛡️ Robustness Analysis</span>
            <span style={S.badge(gradeColors[robust.robustness_grade] || '#94a3b8')}>
              Grade {robust.robustness_grade} — {robust.robustness_score}/100
            </span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(robust.feature_sensitivity || {}).map(([feat, info]: [string, any]) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 180, fontSize: 12, color: 'var(--text-secondary)' }}>{feat.replace(/_/g, ' ')}</span>
                <div style={{ flex: 1, ...S.progressBar }}>
                  <div style={S.progressFill(Math.min(info.flip_rate_pct * 10, 100), info.stability === 'Robust' ? '#10b981' : info.stability === 'Moderate' ? '#f59e0b' : '#ef4444')} />
                </div>
                <span style={S.badge(info.stability === 'Robust' ? '#10b981' : info.stability === 'Moderate' ? '#f59e0b' : '#ef4444')}>{info.stability}</span>
                <span style={{ width: 60, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{info.flip_rate_pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STATISTICAL SIGNIFICANCE ═══ */}
      {stats && (
        <div style={S.card}>
          <h3 style={S.sTitle}>📐 Statistical Significance Tests</h3>
          <div style={{ fontSize: 13, fontWeight: 600, color: stats.conclusion?.includes('significantly') ? '#10b981' : '#f59e0b', marginBottom: 12 }}>
            {stats.conclusion}
          </div>
          <div style={S.statGrid}>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{stats.model_f1_mean}</span><span style={S.sl}>Model F1 (10-Fold)</span></div>
            <div style={S.stat('#94a3b8')}><span style={S.sv}>±{stats.model_f1_std}</span><span style={S.sl}>Std Dev</span></div>
          </div>
          {Object.entries(stats.baselines || {}).map(([strategy, info]: [string, any]) => (
            <div key={strategy} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.06)', fontSize: 12 }}>
              <span style={{ width: 120, fontWeight: 600 }}>vs {strategy.replace(/_/g, ' ')}</span>
              <span style={{ color: 'var(--text-muted)' }}>Baseline F1: {info.baseline_f1_mean}</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>+{info.improvement} improvement</span>
              <span style={S.badge(info.significant_at_001 ? '#10b981' : info.significant_at_005 ? '#f59e0b' : '#ef4444')}>
                p={info.t_p_value < 0.001 ? '<0.001' : info.t_p_value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ QUICK MODE: Simplified view ═══ */}
      {data && !cert && data.classifier && (
        <div style={S.card}>
          <h3 style={S.sTitle}>⚡ Quick Validation Results</h3>
          <div style={S.statGrid}>
            <div style={S.stat('#10b981')}><span style={S.sv}>{data.classifier.accuracy?.mean}</span><span style={S.sl}>Accuracy</span></div>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{data.classifier.roc_auc?.mean}</span><span style={S.sl}>AUC-ROC</span></div>
            <div style={S.stat('#8b5cf6')}><span style={S.sv}>{data.classifier.f1?.mean}</span><span style={S.sl}>F1</span></div>
            <div style={S.stat(data.classifier.overfit_status === 'OK' ? '#10b981' : '#ef4444')}>
              <span style={S.sv}>{data.classifier.overfit_status}</span><span style={S.sl}>Overfit Check</span>
            </div>
          </div>
          {data.fda && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>FDA Targets: {data.fda.all_pass ? '✅ All Pass' : '⚠️ Some Failed'}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(data.fda.targets || {}).map(([target, info]: [string, any]) => (
                  <span key={target} style={S.badge(info.pass ? '#10b981' : '#ef4444')}>
                    {target}: {info.CVS?.toFixed(3)} {info.pass ? '✅' : '❌'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 12, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
        CARVanta Model Validation Suite — ISO/IEC 25010 aligned • {data?.elapsed_seconds ? `${data.elapsed_seconds}s` : '—'}
      </div>
    </div>
  );
}
