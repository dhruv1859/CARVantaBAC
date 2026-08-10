import { useState } from 'react';
import React from 'react';
import PageLoader from '../components/PageLoader';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';
type Tab = 'clonal' | 'signatures' | 'resistance' | 'pgx' | 'sv';

const S = {
  tabs: { display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 5, flexWrap: 'wrap' as const } as React.CSSProperties,
  tab: (a: boolean) => ({ padding: '10px 14px', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: a ? 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))' : 'transparent', color: a ? '#a78bfa' : 'var(--text-muted, #94a3b8)' }) as React.CSSProperties,
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  title: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.1)' } as React.CSSProperties,
  btn: (c?: string) => ({ background: c || 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }),
  sg: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(125px,1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  st: (c: string) => ({ background: `linear-gradient(135deg,${c}10,${c}05)`, border: `1px solid ${c}25`, borderRadius: 12, padding: '14px 10px', textAlign: 'center' as const }),
  sv: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary,#f1f5f9)', display: 'block' },
  sl: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted,#94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
  badge: (c: string) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30` }),
  bar: { height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' as const, marginTop: 4 },
  fill: (pct: number, c: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${c}, ${c}cc)`, transition: 'width 0.6s ease' }),
  input: { background: 'var(--bg-input, rgba(15,23,42,0.6))', border: '1px solid rgba(148,163,184,0.15)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
  th: { textAlign: 'left' as const, padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, borderBottom: '2px solid rgba(148,163,184,0.15)' },
  td: { padding: '8px 10px', borderBottom: '1px solid rgba(148,163,184,0.06)', color: 'var(--text-primary)', fontSize: 12 },
};

export default function GenomicReport() {
  const [tab, setTab] = useState<Tab>('clonal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancer, setCancer] = useState('DLBCL');

  // Clonal
  const [clonalRes, setClonalRes] = useState<any>(null);
  // Signatures
  const [sigRes, setSigRes] = useState<any>(null);
  // Resistance
  const [resistRes, setResistRes] = useState<any>(null);
  const [rTarget, setRTarget] = useState('CD19');
  // PGx
  const [pgxRes, setPgxRes] = useState<any>(null);
  const [condRes, setCondRes] = useState<any>(null);
  // SV
  const [svRes, setSvRes] = useState<any>(null);

  const api = async (url: string) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}${url}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e: any) { setError(e.message); return null; }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-header">
        <h2>🧪 Genomic Intelligence Report</h2>
        <p>Clonal evolution, mutational signatures, pharmacogenomics & structural variants</p>
      </div>

      <div style={S.tabs}>
        {([['clonal', '🧬 Clonal'], ['signatures', '📝 Signatures'], ['resistance', '🛡️ Resistance'], ['pgx', '💊 PGx'], ['sv', '🔬 SVs']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} style={S.tab(tab === k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select style={{ ...S.input, maxWidth: 140 }} value={cancer} onChange={e => setCancer(e.target.value)}>
          {['DLBCL', 'ALL', 'MM', 'NSCLC', 'Melanoma', 'CRC', 'AML', 'CML', 'MCL'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <div className="card" style={{ borderColor: '#ef444440', color: '#f87171' }}>⚠️ {error}</div>}
      {loading && <PageLoader theme="genomics" text="Analyzing..." />}

      {/* ═══ CLONAL ARCHITECTURE ═══ */}
      {tab === 'clonal' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>🧬 Clonal Architecture Analysis</h3>
            <button style={S.btn()} onClick={async () => { const d = await api(`/api/v5/genomics/clonal/architecture?cancer_type=${cancer}`); if (d) setClonalRes(d); }}>Analyze Clones</button>
          </div>
          {clonalRes && (
            <>
              <div style={S.card}>
                <div style={S.sg}>
                  <div style={S.st('#8b5cf6')}><span style={S.sv}>{clonalRes.n_clones}</span><span style={S.sl}>Clones</span></div>
                  <div style={S.st('#06b6d4')}><span style={S.sv}>{clonalRes.n_variants}</span><span style={S.sl}>Variants</span></div>
                  <div style={S.st('#f59e0b')}><span style={S.sv}>{clonalRes.diversity?.clonal_fraction}</span><span style={S.sl}>Clonal Frac</span></div>
                  <div style={S.st('#22c55e')}><span style={S.sv}>{clonalRes.diversity?.shannon_index}</span><span style={S.sl}>Shannon</span></div>
                  <div style={S.st('#3b82f6')}><span style={S.sv}>{clonalRes.tumor_purity}</span><span style={S.sl}>Purity</span></div>
                </div>
                <div style={{ fontSize: 12, padding: 10, background: 'rgba(139,92,246,0.06)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa', marginBottom: 12 }}>
                  🎯 {clonalRes.car_t_implications?.recommendation}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>CLONE HIERARCHY</div>
                {clonalRes.clones?.map((c: any) => (
                  <div key={c.clone_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, width: 70, color: c.is_founding ? '#a78bfa' : 'var(--text-primary)' }}>
                      Clone {c.clone_id} {c.is_founding ? '★' : ''}
                    </span>
                    <div style={S.bar}><div style={S.fill(c.proportion * 100, c.is_founding ? '#8b5cf6' : '#3b82f6')} /></div>
                    <span style={{ fontSize: 10, color: '#94a3b8', width: 80 }}>{c.n_variants} vars • {c.median_vaf}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ MUTATIONAL SIGNATURES ═══ */}
      {tab === 'signatures' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>📝 COSMIC Mutational Signatures</h3>
            <button style={S.btn()} onClick={async () => { const d = await api(`/api/v5/genomics/clonal/signatures?cancer_type=${cancer}`); if (d) setSigRes(d); }}>Decompose Signatures</button>
          </div>
          {sigRes && (
            <div style={S.card}>
              <div style={S.sg}>
                <div style={S.st('#8b5cf6')}><span style={S.sv}>{sigRes.n_signatures}</span><span style={S.sl}>Signatures</span></div>
                <div style={S.st('#f59e0b')}><span style={S.sv}>{sigRes.dominant_signature}</span><span style={S.sl}>Dominant</span></div>
                <div style={S.st(sigRes.therapy_related_detected ? '#ef4444' : '#22c55e')}>
                  <span style={S.sv}>{sigRes.therapy_related_detected ? 'Yes' : 'No'}</span><span style={S.sl}>Therapy-Related</span>
                </div>
              </div>
              {sigRes.signatures?.map((s: any) => (
                <div key={s.signature} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {s.signature} {s.therapy_related ? '⚠️' : ''} {s.age_related ? '🕐' : ''}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.contribution_pct}%</span>
                  </div>
                  <div style={S.bar}><div style={S.fill(s.contribution_pct * 2, s.therapy_related ? '#ef4444' : '#8b5cf6')} /></div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.etiology}</div>
                </div>
              ))}
              <div style={{ fontSize: 11, padding: 10, background: 'rgba(6,182,212,0.06)', borderRadius: 8, color: '#22d3ee', marginTop: 10 }}>
                🧬 {sigRes.car_t_relevance?.interpretation}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ RESISTANCE EVOLUTION ═══ */}
      {tab === 'resistance' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>🛡️ CAR-T Resistance Evolution</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ ...S.input, maxWidth: 120 }} value={rTarget} onChange={e => setRTarget(e.target.value)}>
                {['CD19', 'BCMA'].map(t => <option key={t}>{t}</option>)}
              </select>
              <button style={S.btn('linear-gradient(135deg, #ef4444, #f59e0b)')} onClick={async () => { const d = await api(`/api/v5/genomics/clonal/resistance?cancer_type=${cancer}&target=${rTarget}&months=18`); if (d) setResistRes(d); }}>Predict Evolution</button>
            </div>
          </div>
          {resistRes && (
            <>
              <div style={S.card}>
                <div style={S.sg}>
                  <div style={S.st('#ef4444')}><span style={S.sv}>{(resistRes.prediction_summary?.relapse_probability_12mo * 100).toFixed(0)}%</span><span style={S.sl}>Relapse Risk</span></div>
                  <div style={S.st('#f59e0b')}><span style={S.sv}>{resistRes.resistance_mechanisms?.length}</span><span style={S.sl}>Mechanisms</span></div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>RESISTANCE MECHANISMS</div>
                {resistRes.resistance_mechanisms?.map((m: any, i: number) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', maxWidth: '60%' }}>{m.mechanism}</span>
                      <span style={S.badge(m.probability > 0.2 ? '#ef4444' : '#f59e0b')}>{(m.probability * 100).toFixed(0)}% risk</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>⏱️ {m.timeframe_months}mo • 🔍 {m.detection}</div>
                    <div style={{ fontSize: 10, color: '#22d3ee', marginTop: 2 }}>💡 {m.countermeasure}</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <h3 style={S.title}>📅 MRD Monitoring Schedule</h3>
                {resistRes.mrd_monitoring_schedule?.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.06)', alignItems: 'center' }}>
                    <span style={{ width: 80, fontSize: 11, fontWeight: 700, color: m.critical ? '#f59e0b' : '#94a3b8' }}>{m.timepoint}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1 }}>{m.test}</span>
                    {m.critical && <span style={S.badge('#f59e0b')}>Critical</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ PHARMACOGENOMICS ═══ */}
      {tab === 'pgx' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>💊 Pharmacogenomic Profile</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={S.btn()} onClick={async () => { const d = await api('/api/v5/genomics/pgx/profile'); if (d) setPgxRes(d); }}>Run PGx Panel</button>
              <button style={S.btn('linear-gradient(135deg, #22c55e, #06b6d4)')} onClick={async () => { const d = await api(`/api/v5/genomics/pgx/conditioning?target=${rTarget}&cancer_type=${cancer}`); if (d) setCondRes(d); }}>Conditioning</button>
            </div>
          </div>
          {pgxRes && (
            <div style={S.card}>
              <div style={S.sg}>
                <div style={S.st('#8b5cf6')}><span style={S.sv}>{pgxRes.total_genes_tested}</span><span style={S.sl}>Genes Tested</span></div>
                <div style={S.st(pgxRes.actionable_results > 0 ? '#f59e0b' : '#22c55e')}><span style={S.sv}>{pgxRes.actionable_results}</span><span style={S.sl}>Actionable</span></div>
              </div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Gene</th><th style={S.th}>Diplotype</th><th style={S.th}>Phenotype</th><th style={S.th}>Activity</th><th style={S.th}>Action</th></tr></thead>
                <tbody>
                  {Object.values(pgxRes.pharmacogenes || {}).map((g: any) => (
                    <tr key={g.gene}>
                      <td style={{ ...S.td, fontWeight: 700 }}>{g.gene}</td>
                      <td style={{ ...S.td, fontSize: 10, fontFamily: 'monospace' }}>{g.diplotype}</td>
                      <td style={S.td}><span style={S.badge(g.phenotype.includes('Poor') ? '#ef4444' : g.phenotype.includes('Intermediate') ? '#f59e0b' : '#22c55e')}>{g.phenotype}</span></td>
                      <td style={S.td}>{g.activity_score}</td>
                      <td style={S.td}>{g.clinical_action_required ? '⚠️ Yes' : '✓'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pgxRes.car_t_conditioning_implications && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(139,92,246,0.06)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 6 }}>CAR-T Conditioning Implications</div>
                  {Object.entries(pgxRes.car_t_conditioning_implications).map(([key, val]: [string, any]) => (
                    <div key={key} style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{key}:</strong> {val.recommendation}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {condRes && (
            <div style={S.card}>
              <h3 style={S.title}>⚗️ Conditioning Regimen — {condRes.target} CAR-T</h3>
              <div style={S.sg}>
                <div style={S.st('#06b6d4')}><span style={S.sv}>{condRes.personalized_adjustments?.bsa}</span><span style={S.sl}>BSA (m²)</span></div>
                <div style={S.st('#3b82f6')}><span style={S.sv}>{condRes.personalized_adjustments?.creatinine_clearance}</span><span style={S.sl}>CrCl</span></div>
                <div style={S.st('#22c55e')}><span style={S.sv}>{condRes.personalized_adjustments?.adjusted_fludarabine}</span><span style={S.sl}>Flu Dose</span></div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>TIMELINE</div>
              {Object.entries(condRes.timing || {}).map(([k, v]: [string, any]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                  <span style={{ color: '#94a3b8' }}>{k.replace(/_/g, ' ')}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ STRUCTURAL VARIANTS ═══ */}
      {tab === 'sv' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>🔬 Structural Variant Detection</h3>
            <button style={S.btn()} onClick={async () => { const d = await api(`/api/v5/genomics/sv/detect?cancer_type=${cancer}`); if (d) setSvRes(d); }}>Detect SVs</button>
          </div>
          {svRes && (
            <>
              <div style={S.card}>
                <div style={S.sg}>
                  <div style={S.st('#ef4444')}><span style={S.sv}>{svRes.summary?.total_svs}</span><span style={S.sl}>Total SVs</span></div>
                  <div style={S.st('#f59e0b')}><span style={S.sv}>{svRes.summary?.known_cancer_svs_detected}</span><span style={S.sl}>Known Cancer</span></div>
                  <div style={S.st('#3b82f6')}><span style={S.sv}>{svRes.summary?.sv_burden}</span><span style={S.sl}>Burden</span></div>
                  <div style={S.st(svRes.chromothripsis?.suspected ? '#ef4444' : '#22c55e')}>
                    <span style={S.sv}>{svRes.chromothripsis?.suspected ? '⚠️' : '✓'}</span><span style={S.sl}>Chromothripsis</span>
                  </div>
                </div>
                {Object.entries(svRes.summary?.type_distribution || {}).map(([t, c]: [string, any]) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, width: 40 }}>{t}</span>
                    <div style={S.bar}><div style={S.fill(c * 8, t === 'TRA' ? '#ef4444' : t === 'DEL' ? '#3b82f6' : '#22c55e')} /></div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{c}</span>
                  </div>
                ))}
              </div>
              {svRes.known_cancer_svs?.length > 0 && (
                <div style={S.card}>
                  <h3 style={S.title}>⚠️ Known Cancer SVs</h3>
                  {svRes.known_cancer_svs.map((sv: any) => (
                    <div key={sv.sv_id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{sv.gene1}::{sv.gene2}</span>
                        <span style={S.badge('#ef4444')}>{sv.type} · conf {sv.confidence}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sv.significance}</div>
                      <div style={{ fontSize: 10, color: '#22d3ee', marginTop: 2 }}>🎯 {sv.car_t}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={S.card}>
                <h3 style={S.title}>🎯 CAR-T Target Locus Integrity</h3>
                {Object.entries(svRes.car_t_target_integrity || {}).map(([k, v]: [string, any]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{k.replace('_locus', '').toUpperCase()} ({v.chromosome})</span>
                    <span style={S.badge(v.integrity === 'intact' ? '#22c55e' : '#ef4444')}>{v.integrity}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
        CARVanta Genomic Intelligence — 13 engines • 33 endpoints • COSMIC SBS v3.3 • CPIC/DPWG
      </div>
    </>
  );
}
