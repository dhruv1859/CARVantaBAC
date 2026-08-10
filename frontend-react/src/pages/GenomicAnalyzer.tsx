import { useState } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

/* ═══════════════════════════════════════════════════════════════════
   Style System (matching GenomicProfiler pattern)
   ═══════════════════════════════════════════════════════════════════ */
const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
  header: { marginBottom: 24, textAlign: 'center' as const },
  h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: 14, color: 'var(--text-muted, #94a3b8)', margin: 0 },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 5 } as React.CSSProperties,
  tab: (active: boolean) => ({
    flex: 1, padding: '12px 10px', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(6,182,212,0.15))' : 'transparent',
    color: active ? '#4ade80' : 'var(--text-muted, #94a3b8)',
    boxShadow: active ? '0 2px 8px rgba(34,197,94,0.15)' : 'none',
  }) as React.CSSProperties,
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sectionTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.1))', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (accent: string) => ({
    background: `linear-gradient(135deg, ${accent}10, ${accent}05)`, border: `1px solid ${accent}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const,
  }) as React.CSSProperties,
  statValue: { fontSize: 22, fontWeight: 800, color: 'var(--text-primary, #f1f5f9)', display: 'block' },
  statLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
  formRow: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' as const, marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6, flex: '1 1 160px' },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input: { background: 'var(--bg-input, rgba(15,23,42,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.15))', color: 'var(--text-primary, #f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 14 },
  btn: { background: 'linear-gradient(135deg, #22c55e, #10b981)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '2px solid var(--border-color, rgba(148,163,184,0.15))' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.06))', color: 'var(--text-primary, #e2e8f0)' },
  badge: (color: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30`, display: 'inline-block' }),
  progressBar: { height: 8, borderRadius: 4, background: 'var(--bg-input, rgba(148,163,184,0.1))', overflow: 'hidden' as const, marginTop: 4 },
  progressFill: (pct: number, color: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: 'width 0.6s ease' }),
};

const sigColor = (sig: string) => {
  if (sig === 'pathogenic' || sig === 'likely_pathogenic') return '#ef4444';
  if (sig === 'benign' || sig === 'likely_benign') return '#10b981';
  return '#f59e0b';
};

/* ═══════════════════════════════════════════════════════════════════
   Circos-style chromosome ring
   ═══════════════════════════════════════════════════════════════════ */
function CircosPlot({ variants }: { variants: any[] }) {
  if (!variants || variants.length === 0) return null;
  const size = 320, cx = size / 2, cy = size / 2, outerR = 140, innerR = 100;
  const chroms = Array.from({ length: 22 }, (_, i) => `chr${i + 1}`).concat(['chrX', 'chrY']);
  const arcAngle = (2 * Math.PI) / chroms.length;
  const gap = 0.03;
  const chromColors = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9','#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#ef4444','#3b82f6','#10b981'];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 340, margin: '0 auto', display: 'block' }}>
      {chroms.map((chr, i) => {
        const startAngle = i * arcAngle + gap - Math.PI / 2;
        const endAngle = (i + 1) * arcAngle - gap - Math.PI / 2;
        const x1o = cx + outerR * Math.cos(startAngle);
        const y1o = cy + outerR * Math.sin(startAngle);
        const x2o = cx + outerR * Math.cos(endAngle);
        const y2o = cy + outerR * Math.sin(endAngle);
        const x1i = cx + innerR * Math.cos(endAngle);
        const y1i = cy + innerR * Math.sin(endAngle);
        const x2i = cx + innerR * Math.cos(startAngle);
        const y2i = cy + innerR * Math.sin(startAngle);
        const d = `M${x1o},${y1o} A${outerR},${outerR} 0 0,1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 0,0 ${x2i},${y2i} Z`;
        const labelAngle = (startAngle + endAngle) / 2;
        const labelR = outerR + 12;
        const lx = cx + labelR * Math.cos(labelAngle);
        const ly = cy + labelR * Math.sin(labelAngle);
        const chrVariants = variants.filter(v => v.chromosome === chr);
        return (
          <g key={chr}>
            <path d={d} fill={chromColors[i % chromColors.length] + '30'} stroke={chromColors[i % chromColors.length]} strokeWidth={1.5} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted, #94a3b8)" fontSize={7} fontWeight={600}>{chr.replace('chr', '')}</text>
            {chrVariants.map((v: any, j: number) => {
              const frac = (v.position || 0) / 250000000;
              const vAngle = startAngle + frac * (endAngle - startAngle);
              const vr = innerR + (outerR - innerR) * 0.5;
              return <circle key={j} cx={cx + vr * Math.cos(vAngle)} cy={cy + vr * Math.sin(vAngle)} r={3} fill={sigColor(v.clinical_significance || '')} opacity={0.9} />;
            })}
          </g>
        );
      })}
      <text x={cx} y={cx - 6} textAnchor="middle" fill="var(--text-primary, #e2e8f0)" fontSize={18} fontWeight={800}>{variants.length}</text>
      <text x={cx} y={cx + 10} textAnchor="middle" fill="var(--text-muted, #94a3b8)" fontSize={9}>Variants</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */
export default function GenomicAnalyzer() {
  const [activeTab, setActiveTab] = useState<'variants' | 'neoantigen' | 'hla' | 'tmb'>('variants');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Variant analysis
  const [variantGene, setVariantGene] = useState('');
  const [cancerType, setCancerType] = useState('BRCA');
  const [variants, setVariants] = useState<any>(null);

  // Neoantigen
  const [neoGene, setNeoGene] = useState('');
  const [neoantigens, setNeoantigens] = useState<any>(null);

  // HLA
  const [hlaResult, setHlaResult] = useState<any>(null);

  // TMB/MSI
  const [tmbCancer, setTmbCancer] = useState('BRCA');
  const [tmbResult, setTmbResult] = useState<any>(null);

  const fetchVariants = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/genomics/demo-variants?gene=${variantGene.trim().toUpperCase()}&cancer_type=${cancerType}&count=15`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setVariants(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const fetchNeoantigens = async () => {
    setLoading(true); setError('');
    try {
      const body = { variants: [
        { gene: neoGene.trim().toUpperCase() || 'TP53', chromosome: 'chr17', position: 7578406, ref: 'G', alt: 'A', variant_type: 'missense', annotation: { hgvs_p: 'p.R248W' } }
      ]};
      const res = await fetch(`${API}/api/v5/genomics/predict-neoantigens`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNeoantigens(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const fetchHLA = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/genomics/hla-type`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHlaResult(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const fetchTMB = async () => {
    setLoading(true); setError('');
    try {
      const body = { total_mutations: 150, exome_size_mb: 33.4, cancer_type: tmbCancer, msi_markers: { BAT25: true, BAT26: true, NR21: false, NR24: false, MONO27: false } };
      const res = await fetch(`${API}/api/v5/genomics/tmb-msi`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTmbResult(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>🧬 Genomic Analyzer</h1>
        <p style={S.subtitle}>Real-time variant calling • Neoantigen prediction • HLA typing • TMB/MSI analysis</p>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {(['variants', 'neoantigen', 'hla', 'tmb'] as const).map(tab => (
          <button key={tab} style={S.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'variants' ? '🔬 Variant Browser' : tab === 'neoantigen' ? '🎯 Neoantigens' : tab === 'hla' ? '🧬 HLA Typing' : '📊 TMB / MSI'}
          </button>
        ))}
      </div>

      {error && <div style={S.error}>⚠️ {error}</div>}

      {/* ═══ TAB: VARIANT BROWSER ═══════════════════════════════════════ */}
      {activeTab === 'variants' && (
        <>
          <div style={S.card}>
            <div style={S.formRow}>
              <div style={S.field}>
                <label style={S.label}>Gene Symbol</label>
                <input style={S.input} placeholder="e.g. TP53, BRCA1, EGFR" value={variantGene}
                  onChange={e => setVariantGene(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchVariants()} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Cancer Type</label>
                <select style={S.input} value={cancerType} onChange={e => setCancerType(e.target.value)}>
                  {['BRCA','LUAD','COAD','SKCM','GBM','DLBCL','AML','PRAD','OV','BLCA'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={fetchVariants} disabled={loading}>
                {loading ? '⏳ Calling...' : '🔬 Call Variants'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['TP53','BRCA1','EGFR','KRAS','PIK3CA','BRAF','MYC','PTEN'].map(g => (
                <button key={g} onClick={() => setVariantGene(g)}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.06)', color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}>{g}</button>
              ))}
            </div>
          </div>

          {variants && (
            <>
              {/* Summary stats */}
              <div style={S.statGrid}>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{variants.total_variants}</span><span style={S.statLabel}>Total Variants</span></div>
                <div style={S.stat('#ef4444')}><span style={S.statValue}>{variants.pathogenic_count ?? variants.variants?.filter((v: any) => v.clinical_significance === 'pathogenic').length ?? 0}</span><span style={S.statLabel}>Pathogenic</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{variants.gene || variantGene.toUpperCase()}</span><span style={S.statLabel}>Gene</span></div>
                <div style={S.stat('#f59e0b')}><span style={S.statValue}>{variants.cancer_type || cancerType}</span><span style={S.statLabel}>Cancer Type</span></div>
              </div>

              {/* Circos plot */}
              {variants.variants?.length > 0 && (
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>🧬 Genome-Wide Variant Map (Circos)</h3>
                  <CircosPlot variants={variants.variants} />
                </div>
              )}

              {/* Variant table */}
              <div style={S.card}>
                <h3 style={S.sectionTitle}>🔬 Variant Details ({variants.variants?.length || 0})</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>Gene</th><th style={S.th}>Position</th><th style={S.th}>Type</th>
                      <th style={S.th}>Ref/Alt</th><th style={S.th}>Significance</th><th style={S.th}>Impact</th><th style={S.th}>COSMIC</th>
                    </tr></thead>
                    <tbody>
                      {variants.variants?.map((v: any, i: number) => (
                        <tr key={i} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ ...S.td, fontWeight: 700 }}>{v.gene}</td>
                          <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{v.chromosome}:{v.position?.toLocaleString()}</td>
                          <td style={S.td}><span style={S.badge('#06b6d4')}>{v.variant_type}</span></td>
                          <td style={{ ...S.td, fontFamily: 'monospace' }}>{v.ref} → {v.alt}</td>
                          <td style={S.td}><span style={S.badge(sigColor(v.clinical_significance))}>{v.clinical_significance?.replace(/_/g, ' ')}</span></td>
                          <td style={S.td}><span style={{ color: v.impact_score > 0.7 ? '#ef4444' : v.impact_score > 0.4 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{(v.impact_score * 100).toFixed(0)}%</span></td>
                          <td style={S.td}>{v.annotation?.cosmic_id || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ TAB: NEOANTIGEN PREDICTION ═══════════════════════════════════ */}
      {activeTab === 'neoantigen' && (
        <>
          <div style={S.card}>
            <div style={S.formRow}>
              <div style={S.field}>
                <label style={S.label}>Gene / Mutation</label>
                <input style={S.input} placeholder="e.g. TP53" value={neoGene}
                  onChange={e => setNeoGene(e.target.value)} />
              </div>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={fetchNeoantigens} disabled={loading}>
                {loading ? '⏳ Predicting...' : '🎯 Predict Neoantigens'}
              </button>
            </div>
          </div>

          {neoantigens && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{neoantigens.total_neoantigens ?? neoantigens.neoantigens?.length ?? 0}</span><span style={S.statLabel}>Total Neoantigens</span></div>
                <div style={S.stat('#ef4444')}><span style={S.statValue}>{neoantigens.strong_binders ?? 0}</span><span style={S.statLabel}>Strong Binders</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{neoantigens.immunogenic_candidates ?? 0}</span><span style={S.statLabel}>Immunogenic</span></div>
              </div>

              {neoantigens.neoantigens?.length > 0 && (
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>🎯 Neoantigen Candidates</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                      <thead><tr>
                        <th style={S.th}>Peptide</th><th style={S.th}>HLA Allele</th><th style={S.th}>MHC Class</th>
                        <th style={S.th}>Binding Affinity</th><th style={S.th}>%Rank</th><th style={S.th}>Immunogenicity</th>
                      </tr></thead>
                      <tbody>
                        {neoantigens.neoantigens.map((n: any, i: number) => (
                          <tr key={i} style={{ transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.05)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>{n.peptide}</td>
                            <td style={S.td}>{n.hla_allele}</td>
                            <td style={S.td}><span style={S.badge(n.mhc_class === 'I' ? '#6366f1' : '#ec4899')}>{n.mhc_class === 'I' ? 'MHC-I' : 'MHC-II'}</span></td>
                            <td style={S.td}>{n.binding_affinity_nm?.toFixed(1)} nM</td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ ...S.progressBar, width: 60, height: 5 }}>
                                  <div style={S.progressFill(Math.min(n.percent_rank * 200, 100), n.percent_rank < 0.5 ? '#22c55e' : n.percent_rank < 2 ? '#f59e0b' : '#ef4444')} />
                                </div>
                                {n.percent_rank?.toFixed(2)}%
                              </div>
                            </td>
                            <td style={S.td}><span style={{ color: n.immunogenicity_score > 0.7 ? '#22c55e' : n.immunogenicity_score > 0.4 ? '#f59e0b' : '#94a3b8', fontWeight: 700 }}>{(n.immunogenicity_score * 100).toFixed(0)}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ TAB: HLA TYPING ═══════════════════════════════════════════ */}
      {activeTab === 'hla' && (
        <>
          <div style={S.card}>
            <div style={S.formRow}>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={fetchHLA} disabled={loading}>
                {loading ? '⏳ Typing...' : '🧬 Run HLA Typing'}
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Simulates HLA typing across 6 loci (HLA-A, B, C, DRB1, DQB1, DPB1) using population-weighted allele frequencies.</p>
          </div>

          {hlaResult && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat('#6366f1')}><span style={S.statValue}>{hlaResult.total_alleles ?? Object.keys(hlaResult.hla_alleles || {}).length * 2}</span><span style={S.statLabel}>Typed Alleles</span></div>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{hlaResult.total_loci ?? Object.keys(hlaResult.hla_alleles || {}).length}</span><span style={S.statLabel}>Loci</span></div>
              </div>

              <div style={S.card}>
                <h3 style={S.sectionTitle}>🧬 HLA Genotype</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {Object.entries(hlaResult.hla_alleles || {}).map(([locus, alleles]: [string, any]) => (
                    <div key={locus} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#818cf8', marginBottom: 8 }}>{locus}</div>
                      {(Array.isArray(alleles) ? alleles : [alleles]).map((a: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{typeof a === 'string' ? a : a?.allele || a}</span>
                          {typeof a === 'object' && a?.frequency && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(a.frequency * 100).toFixed(1)}%</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {hlaResult.haplotype_analysis && (
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>🔗 Haplotype Analysis</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {hlaResult.haplotype_analysis.map((h: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{h.haplotype}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Freq: {(h.frequency * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ TAB: TMB / MSI ═══════════════════════════════════════════ */}
      {activeTab === 'tmb' && (
        <>
          <div style={S.card}>
            <div style={S.formRow}>
              <div style={S.field}>
                <label style={S.label}>Cancer Type</label>
                <select style={S.input} value={tmbCancer} onChange={e => setTmbCancer(e.target.value)}>
                  {['BRCA','LUAD','COAD','SKCM','GBM','BLCA','UCEC','STAD','HNSC','LUSC','KIRC','LIHC','PRAD','OV','PAAD','THCA','AML','DLBCL'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={fetchTMB} disabled={loading}>
                {loading ? '⏳ Computing...' : '📊 Analyze TMB & MSI'}
              </button>
            </div>
          </div>

          {tmbResult && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{tmbResult.tmb_value?.toFixed(1)}</span><span style={S.statLabel}>TMB (mut/Mb)</span></div>
                <div style={S.stat(tmbResult.tmb_category === 'TMB-High' ? '#ef4444' : tmbResult.tmb_category === 'TMB-Intermediate' ? '#f59e0b' : '#10b981')}>
                  <span style={{ ...S.statValue, color: tmbResult.tmb_category === 'TMB-High' ? '#ef4444' : '#10b981' }}>{tmbResult.tmb_category}</span>
                  <span style={S.statLabel}>Category</span>
                </div>
                <div style={S.stat(tmbResult.msi_status === 'MSI-H' ? '#ef4444' : '#10b981')}>
                  <span style={{ ...S.statValue, color: tmbResult.msi_status === 'MSI-H' ? '#ef4444' : '#10b981' }}>{tmbResult.msi_status}</span>
                  <span style={S.statLabel}>MSI Status</span>
                </div>
                <div style={S.stat('#6366f1')}><span style={S.statValue}>{tmbResult.msi_score?.toFixed(2)}</span><span style={S.statLabel}>MSI Score</span></div>
                <div style={S.stat('#06b6d4')}>
                  <span style={{ ...S.statValue, fontSize: 16 }}>{tmbResult.tmb_percentile?.toFixed(0)}th</span>
                  <span style={S.statLabel}>Percentile ({tmbResult.cancer_type})</span>
                </div>
              </div>

              {/* TMB Gauge */}
              <div style={S.card}>
                <h3 style={S.sectionTitle}>📊 TMB Distribution vs {tmbResult.cancer_type}</h3>
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <div style={{ ...S.progressBar, height: 20, borderRadius: 10 }}>
                    <div style={{ ...S.progressFill(Math.min((tmbResult.tmb_percentile || 50), 100), tmbResult.tmb_category === 'TMB-High' ? '#ef4444' : tmbResult.tmb_category === 'TMB-Intermediate' ? '#f59e0b' : '#22c55e'), borderRadius: 10 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>TMB-Low (&lt;5)</span>
                    <span>TMB-Intermediate (5-20)</span>
                    <span>TMB-High (&gt;20)</span>
                  </div>
                </div>
              </div>

              {/* MSI Markers */}
              {tmbResult.msi_markers && (
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>🧩 MSI Markers (Bethesda Panel)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                    {Object.entries(tmbResult.msi_markers || {}).map(([marker, unstable]: [string, any]) => (
                      <div key={marker} style={{ padding: '12px 10px', borderRadius: 10, textAlign: 'center', background: unstable ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.06)', border: `1px solid ${unstable ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)'}` }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{marker}</div>
                        <div style={{ fontSize: 18, marginTop: 4 }}>{unstable ? '🔴' : '🟢'}</div>
                        <div style={{ fontSize: 10, color: unstable ? '#ef4444' : '#10b981', fontWeight: 600 }}>{unstable ? 'Unstable' : 'Stable'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immunotherapy eligibility */}
              {tmbResult.immunotherapy_eligibility && (
                <div style={{ ...S.card, borderColor: tmbResult.immunotherapy_eligibility.eligible ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)' }}>
                  <h3 style={S.sectionTitle}>💊 Immunotherapy Eligibility</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 32 }}>{tmbResult.immunotherapy_eligibility.eligible ? '✅' : '❌'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: tmbResult.immunotherapy_eligibility.eligible ? '#22c55e' : '#ef4444' }}>
                        {tmbResult.immunotherapy_eligibility.eligible ? 'Eligible for Checkpoint Inhibitor Therapy' : 'Not Currently Eligible'}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.6 }}>{tmbResult.immunotherapy_eligibility.rationale}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
