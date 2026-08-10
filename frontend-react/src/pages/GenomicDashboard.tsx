import { useState } from 'react';
import React from 'react';
import PageLoader from '../components/PageLoader';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';
type Tab = 'fusions' | 'cnv' | 'immuno' | 'pathways';

const S = {
  tabs: { display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 5 } as React.CSSProperties,
  tab: (a: boolean) => ({ flex: 1, padding: '10px 8px', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: a ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))' : 'transparent', color: a ? '#22d3ee' : 'var(--text-muted, #94a3b8)' }) as React.CSSProperties,
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  title: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.1)' } as React.CSSProperties,
  btn: (c?: string) => ({ background: c || 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }),
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (c: string) => ({ background: `linear-gradient(135deg,${c}10,${c}05)`, border: `1px solid ${c}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }),
  sv: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary,#f1f5f9)', display: 'block' },
  sl: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted,#94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
  badge: (c: string) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30` }),
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
  th: { textAlign: 'left' as const, padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '2px solid var(--border-color, rgba(148,163,184,0.15))' },
  td: { padding: '8px 10px', borderBottom: '1px solid rgba(148,163,184,0.06)', color: 'var(--text-primary, #e2e8f0)', fontSize: 12 },
  bar: { height: 8, borderRadius: 4, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' as const, marginTop: 4 },
  fill: (pct: number, c: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${c}, ${c}cc)`, transition: 'width 0.6s ease' }),
  input: { background: 'var(--bg-input, rgba(15,23,42,0.6))', border: '1px solid rgba(148,163,184,0.15)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' as const },
};

export default function GenomicDashboard() {
  const [tab, setTab] = useState<Tab>('fusions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fusions
  const [fusionRes, setFusionRes] = useState<any>(null);
  const [fusionCancer, setFusionCancer] = useState('DLBCL');
  const [resistRes, setResistRes] = useState<any>(null);

  // CNV
  const [cnvRes, setCnvRes] = useState<any>(null);
  const [cnvCancer, setCnvCancer] = useState('DLBCL');
  const [agCnRes, setAgCnRes] = useState<any>(null);
  const [agTarget, setAgTarget] = useState('CD19');

  // Immuno
  const [tcrRes, setTcrRes] = useState<any>(null);
  const [exhRes, setExhRes] = useState<any>(null);
  const [tmeRes, setTmeRes] = useState<any>(null);

  // Pathways
  const [pwRes, setPwRes] = useState<any>(null);
  const [pwCancer, setPwCancer] = useState('DLBCL');

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
        <h2>🧬 Genomic Intelligence Dashboard</h2>
        <p>Fusion detection, CNV analysis, immunogenomics & pathway mapping</p>
      </div>

      <div style={S.tabs}>
        {([['fusions', '🔗 Fusions'], ['cnv', '📊 CNV'], ['immuno', '🛡️ Immuno'], ['pathways', '🧭 Pathways']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} style={S.tab(tab === k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {error && <div className="card" style={{ borderColor: '#ef444440', color: '#f87171' }}>⚠️ {error}</div>}
      {loading && <PageLoader theme="genomics" text="Analyzing..." />}

      {/* ═══ FUSIONS ═══ */}
      {tab === 'fusions' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>🔗 Gene Fusion Detection</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ ...S.input, maxWidth: 140 }} value={fusionCancer} onChange={e => setFusionCancer(e.target.value)}>
                {['DLBCL', 'ALL', 'MM', 'NSCLC', 'AML', 'CML', 'MCL'].map(c => <option key={c}>{c}</option>)}
              </select>
              <button style={S.btn()} onClick={async () => { const d = await api(`/api/v5/genomics/fusions/detect?cancer_type=${fusionCancer}`); if (d) setFusionRes(d); }}>Detect Fusions</button>
              <button style={S.btn('linear-gradient(135deg, #f59e0b, #ef4444)')} onClick={async () => { const d = await api(`/api/v5/genomics/fusions/resistance?cancer_type=${fusionCancer}`); if (d) setResistRes(d); }}>Resistance</button>
            </div>
          </div>
          {fusionRes && (
            <div style={S.card}>
              <div style={S.statGrid}>
                <div style={S.stat('#06b6d4')}><span style={S.sv}>{fusionRes.fusions_queried}</span><span style={S.sl}>Queried</span></div>
                <div style={S.stat(fusionRes.fusions_detected > 0 ? '#f59e0b' : '#22c55e')}><span style={S.sv}>{fusionRes.fusions_detected}</span><span style={S.sl}>Detected</span></div>
                <div style={S.stat('#a855f7')}><span style={S.sv}>{fusionRes.actionable_fusions}</span><span style={S.sl}>Actionable</span></div>
              </div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Fusion</th><th style={S.th}>Detected</th><th style={S.th}>OncoKB</th><th style={S.th}>Druggable</th><th style={S.th}>Therapies</th><th style={S.th}>CAR-T Relevance</th></tr></thead>
                <tbody>
                  {fusionRes.results?.slice(0, 15).map((f: any) => (
                    <tr key={f.fusion_id}>
                      <td style={{ ...S.td, fontWeight: 700 }}>{f.fusion}</td>
                      <td style={S.td}><span style={S.badge(f.detected ? '#22c55e' : '#94a3b8')}>{f.detected ? '✓ Yes' : '—'}</span></td>
                      <td style={S.td}><span style={S.badge(f.oncokb_level <= '2' ? '#22c55e' : '#f59e0b')}>Level {f.oncokb_level}</span></td>
                      <td style={S.td}><span style={S.badge(f.druggable ? '#06b6d4' : '#94a3b8')}>{f.druggable ? 'Yes' : 'No'}</span></td>
                      <td style={{ ...S.td, fontSize: 10, maxWidth: 180 }}>{f.targeted_therapies?.slice(0, 3).join(', ') || '—'}</td>
                      <td style={{ ...S.td, fontSize: 10, maxWidth: 200, color: '#94a3b8' }}>{f.car_t_relevance?.slice(0, 80)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {resistRes && (
            <div style={S.card}>
              <h3 style={S.title}>⚠️ CAR-T Resistance Fusions — {resistRes.cancer_type}</h3>
              {resistRes.fusions?.map((f: any, i: number) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{f.fusion}</span>
                    <span style={S.badge(f.risk === 'high' ? '#ef4444' : '#f59e0b')}>{f.risk} risk</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{f.mechanism}</div>
                  <div style={{ fontSize: 11, color: '#22d3ee', marginTop: 2 }}>💡 {f.mitigation}</div>
                </div>
              ))}
              <div style={{ marginTop: 12, fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.06)', padding: 10, borderRadius: 8 }}>
                <strong>General Resistance Mechanisms:</strong>
                {resistRes.general_resistance_mechanisms?.map((m: string, i: number) => (
                  <div key={i} style={{ marginTop: 4 }}>• {m}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ CNV ═══ */}
      {tab === 'cnv' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>📊 Copy Number Variation Analysis</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ ...S.input, maxWidth: 140 }} value={cnvCancer} onChange={e => setCnvCancer(e.target.value)}>
                {['DLBCL', 'ALL', 'MM', 'NSCLC', 'BREAST', 'GBM', 'PROSTATE'].map(c => <option key={c}>{c}</option>)}
              </select>
              <button style={S.btn()} onClick={async () => { const d = await api(`/api/v5/genomics/cnv/analyze?cancer_type=${cnvCancer}`); if (d) setCnvRes(d); }}>Analyze CNV</button>
            </div>
          </div>
          <div style={S.card}>
            <h3 style={S.title}>🎯 Antigen Copy Number</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ ...S.input, maxWidth: 120 }} value={agTarget} onChange={e => setAgTarget(e.target.value)}>
                {['CD19', 'BCMA', 'CD22', 'GPRC5D', 'HER2', 'MSLN', 'GPC3', 'PSMA'].map(t => <option key={t}>{t}</option>)}
              </select>
              <button style={S.btn('linear-gradient(135deg, #a855f7, #6366f1)')} onClick={async () => { const d = await api(`/api/v5/genomics/cnv/antigen-cn?target=${agTarget}&cancer_type=${cnvCancer}`); if (d) setAgCnRes(d); }}>Check CN</button>
            </div>
          </div>
          {cnvRes && (
            <div style={S.card}>
              <div style={S.statGrid}>
                <div style={S.stat('#ef4444')}><span style={S.sv}>{cnvRes.summary?.total_amplifications}</span><span style={S.sl}>Amps</span></div>
                <div style={S.stat('#3b82f6')}><span style={S.sv}>{cnvRes.summary?.total_deletions}</span><span style={S.sl}>Hom Del</span></div>
                <div style={S.stat('#f59e0b')}><span style={S.sv}>{cnvRes.cin_score}</span><span style={S.sl}>CIN Score</span></div>
                <div style={S.stat('#a855f7')}><span style={S.sv}>{cnvRes.tumor_ploidy}</span><span style={S.sl}>Ploidy</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.sv}>{cnvRes.tumor_purity}</span><span style={S.sl}>Purity</span></div>
                <div style={S.stat(cnvRes.hrd_score?.hrd_positive ? '#22c55e' : '#94a3b8')}><span style={S.sv}>{cnvRes.hrd_score?.total}</span><span style={S.sl}>HRD</span></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>AMPLIFICATIONS</div>
                  {cnvRes.amplifications?.filter((a: any) => a.amplified).slice(0, 6).map((a: any) => (
                    <div key={a.gene} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.gene}</span>
                      <span style={{ color: '#ef4444' }}>CN {a.copy_number}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>DELETIONS</div>
                  {cnvRes.deletions?.filter((d: any) => d.copy_number < 1.5).slice(0, 6).map((d: any) => (
                    <div key={d.gene} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.gene}</span>
                      <span style={{ color: d.homozygous_deletion ? '#ef4444' : '#f59e0b' }}>{d.homozygous_deletion ? 'HomDel' : `CN ${d.copy_number}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {agCnRes && (
            <div style={S.card}>
              <div style={S.statGrid}>
                <div style={S.stat(agCnRes.status === 'amplified' ? '#22c55e' : agCnRes.status === 'normal' ? '#06b6d4' : '#ef4444')}>
                  <span style={S.sv}>{agCnRes.copy_number}</span><span style={S.sl}>{agCnRes.target_antigen} CN</span>
                </div>
                <div style={S.stat(agCnRes.antigen_escape_risk === 'low' ? '#22c55e' : '#ef4444')}>
                  <span style={S.sv}>{agCnRes.antigen_escape_risk}</span><span style={S.sl}>Escape Risk</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: agCnRes.status === 'loss' ? '#f59e0b' : '#94a3b8', padding: 8, background: 'rgba(148,163,184,0.05)', borderRadius: 8 }}>
                {agCnRes.expression_impact}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ IMMUNOGENOMICS ═══ */}
      {tab === 'immuno' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>🛡️ Immunogenomics Suite</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button style={S.btn()} onClick={async () => { const d = await api('/api/v5/genomics/immuno/tcr-repertoire'); if (d) setTcrRes(d); }}>TCR Repertoire</button>
              <button style={S.btn('linear-gradient(135deg, #f59e0b, #ef4444)')} onClick={async () => { const d = await api('/api/v5/genomics/immuno/exhaustion'); if (d) setExhRes(d); }}>Exhaustion</button>
              <button style={S.btn('linear-gradient(135deg, #a855f7, #6366f1)')} onClick={async () => { const d = await api('/api/v5/genomics/immuno/tme?cancer_type=DLBCL'); if (d) setTmeRes(d); }}>TME</button>
            </div>
          </div>
          {tcrRes && (
            <div style={S.card}>
              <h3 style={S.title}>🧬 TCR Repertoire — {tcrRes.total_clonotypes} Clonotypes</h3>
              <div style={S.statGrid}>
                <div style={S.stat('#06b6d4')}><span style={S.sv}>{tcrRes.diversity_metrics?.shannon_entropy}</span><span style={S.sl}>Shannon</span></div>
                <div style={S.stat('#3b82f6')}><span style={S.sv}>{tcrRes.diversity_metrics?.inverse_simpson}</span><span style={S.sl}>Inv Simpson</span></div>
                <div style={S.stat('#a855f7')}><span style={S.sv}>{tcrRes.diversity_metrics?.clonality}</span><span style={S.sl}>Clonality</span></div>
                <div style={S.stat('#f59e0b')}><span style={S.sv}>{tcrRes.clonal_expansion?.top_clone_pct}%</span><span style={S.sl}>Top Clone</span></div>
              </div>
              <div style={{ fontSize: 12, padding: 10, background: 'rgba(6,182,212,0.06)', borderRadius: 8, border: '1px solid rgba(6,182,212,0.15)', color: '#22d3ee' }}>
                🧫 Manufacturing: {tcrRes.car_t_manufacturing_assessment?.polyclonality} — {tcrRes.car_t_manufacturing_assessment?.recommendation}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>V-GENE USAGE (TOP 10)</div>
                {tcrRes.v_gene_usage?.map((v: any) => (
                  <div key={v.gene} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, width: 80, color: 'var(--text-primary)' }}>{v.gene}</span>
                    <div style={{ ...S.bar, flex: 1 }}><div style={S.fill(v.pct * 3, '#06b6d4')} /></div>
                    <span style={{ fontSize: 10, color: '#94a3b8', width: 40 }}>{v.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {exhRes && (
            <div style={S.card}>
              <h3 style={S.title}>😴 T-Cell Exhaustion — Score: {exhRes.exhaustion_score}/100</h3>
              <div style={S.statGrid}>
                <div style={S.stat(exhRes.car_t_fitness?.grade === 'excellent' ? '#22c55e' : exhRes.car_t_fitness?.grade === 'good' ? '#06b6d4' : '#f59e0b')}>
                  <span style={S.sv}>{exhRes.car_t_fitness?.grade?.toUpperCase()}</span><span style={S.sl}>CAR-T Fitness</span>
                </div>
                <div style={S.stat('#a855f7')}><span style={S.sv}>{exhRes.cd4_cd8?.ratio}</span><span style={S.sl}>CD4:CD8</span></div>
              </div>
              {Object.entries(exhRes.exhaustion_markers || {}).map(([name, m]: [string, any]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, width: 50, color: 'var(--text-primary)' }}>{name}</span>
                  <div style={{ ...S.bar, flex: 1 }}><div style={S.fill(m.pct_positive, m.pct_positive > m.threshold_high ? '#ef4444' : '#22c55e')} /></div>
                  <span style={{ fontSize: 10, color: m.pct_positive > m.threshold_high ? '#ef4444' : '#94a3b8', width: 40 }}>{m.pct_positive}%</span>
                </div>
              ))}
            </div>
          )}
          {tmeRes && (
            <div style={S.card}>
              <h3 style={S.title}>🌡️ Tumor Microenvironment — {tmeRes.tme_classification}</h3>
              <div style={S.statGrid}>
                <div style={S.stat(tmeRes.til_category === 'high' ? '#22c55e' : '#f59e0b')}><span style={S.sv}>{tmeRes.til_score}</span><span style={S.sl}>TIL Score</span></div>
                <div style={S.stat('#3b82f6')}><span style={S.sv}>{tmeRes.checkpoint_expression?.PD_L1_TPS}%</span><span style={S.sl}>PD-L1 TPS</span></div>
                <div style={S.stat('#a855f7')}><span style={S.sv}>{tmeRes.immunoscore?.score}</span><span style={S.sl}>Immunoscore</span></div>
              </div>
              <div style={{ fontSize: 12, color: '#22d3ee', padding: 10, background: 'rgba(6,182,212,0.06)', borderRadius: 8, marginBottom: 10 }}>
                🎯 {tmeRes.car_t_prediction}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(tmeRes.immune_cell_fractions || {}).map(([cell, pct]: [string, any]) => (
                  <div key={cell} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, width: 100, color: 'var(--text-muted)' }}>{cell.replace(/_/g, ' ')}</span>
                    <div style={{ ...S.bar, flex: 1 }}><div style={S.fill(pct * 2, '#3b82f6')} /></div>
                    <span style={{ fontSize: 10, color: '#94a3b8', width: 30 }}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ PATHWAYS ═══ */}
      {tab === 'pathways' && (
        <>
          <div style={S.card}>
            <h3 style={S.title}>🧭 Oncogenic Pathway Analysis</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ ...S.input, maxWidth: 140 }} value={pwCancer} onChange={e => setPwCancer(e.target.value)}>
                {['DLBCL', 'ALL', 'MM', 'NSCLC', 'Melanoma', 'CRC', 'Breast'].map(c => <option key={c}>{c}</option>)}
              </select>
              <button style={S.btn()} onClick={async () => { const d = await api(`/api/v5/genomics/pathways/analyze?cancer_type=${pwCancer}`); if (d) setPwRes(d); }}>Analyze Pathways</button>
            </div>
          </div>
          {pwRes && (
            <>
              <div style={S.card}>
                <div style={S.statGrid}>
                  <div style={S.stat('#06b6d4')}><span style={S.sv}>{pwRes.pathways_analyzed}</span><span style={S.sl}>Pathways</span></div>
                  <div style={S.stat(pwRes.pathways_disrupted > 3 ? '#ef4444' : '#f59e0b')}><span style={S.sv}>{pwRes.pathways_disrupted}</span><span style={S.sl}>Disrupted</span></div>
                  <div style={S.stat('#a855f7')}><span style={S.sv}>{pwRes.mutations_input}</span><span style={S.sl}>Mutations</span></div>
                  <div style={S.stat('#3b82f6')}><span style={S.sv}>{pwRes.genomic_instability_score}</span><span style={S.sl}>Instability</span></div>
                </div>
              </div>
              {pwRes.pathways?.map((p: any) => (
                <div key={p.pathway} style={{ ...S.card, opacity: p.disrupted ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.name}</span>
                    <span style={S.badge(p.disrupted ? '#ef4444' : '#22c55e')}>{p.disruption_score}% disrupted</span>
                  </div>
                  <div style={S.bar}><div style={S.fill(p.disruption_score, p.disrupted ? '#ef4444' : '#22c55e')} /></div>
                  {p.genes_altered?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {p.genes_altered.map((g: any) => (
                        <span key={g.gene} style={S.badge(g.role === 'oncogene' ? '#ef4444' : '#3b82f6')}>
                          {g.gene} ({g.role === 'oncogene' ? 'ONC' : 'TSG'})
                        </span>
                      ))}
                    </div>
                  )}
                  {p.disrupted && p.available_therapies?.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 10, color: '#22d3ee' }}>
                      💊 {p.available_therapies.slice(0, 4).join(' • ')}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{p.car_t_impact}</div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
        CARVanta Genomic Intelligence — 10 engines • 22 endpoints • 75+ pathway genes • 20 fusion pairs
      </div>
    </>
  );
}
