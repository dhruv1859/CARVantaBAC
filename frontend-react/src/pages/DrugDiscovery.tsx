import { useState } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Style System
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
  header: { marginBottom: 24, textAlign: 'center' as const },
  h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: 14, color: 'var(--text-muted, #94a3b8)', margin: 0 },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 5, flexWrap: 'wrap' as const } as React.CSSProperties,
  tab: (active: boolean) => ({
    flex: '1 1 auto', padding: '10px 8px', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.15))' : 'transparent',
    color: active ? '#c084fc' : 'var(--text-muted, #94a3b8)',
    boxShadow: active ? '0 2px 8px rgba(168,85,247,0.15)' : 'none',
  }) as React.CSSProperties,
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sectionTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.1))', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (accent: string) => ({ background: `linear-gradient(135deg, ${accent}10, ${accent}05)`, border: `1px solid ${accent}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }) as React.CSSProperties,
  statValue: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary, #f1f5f9)', display: 'block' },
  statLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
  formRow: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' as const, marginBottom: 16 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6, flex: '1 1 160px' },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input: { background: 'var(--bg-input, rgba(15,23,42,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.15))', color: 'var(--text-primary, #f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 14 },
  btn: { background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(168,85,247,0.3)' },
  btnSm: { background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { textAlign: 'left' as const, padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '2px solid var(--border-color, rgba(148,163,184,0.15))' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.06))', color: 'var(--text-primary, #e2e8f0)' },
  badge: (color: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30`, display: 'inline-block' }),
  progressBar: { height: 8, borderRadius: 4, background: 'var(--bg-input, rgba(148,163,184,0.1))', overflow: 'hidden' as const, marginTop: 4 },
  progressFill: (pct: number, color: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: 'width 0.6s ease' }),
};

type TabKey = 'proteome' | 'novelty' | 'toxicity' | 'scfv' | 'car' | 'optimize' | 'switches' | 'landscape' | 'mfg';
const TAB_LABELS: Record<TabKey, string> = {
  proteome: 'ðŸ”¬ Proteome', novelty: 'ðŸŒŸ Novelty', toxicity: 'âš ï¸ Toxicity', scfv: 'ðŸ§¬ scFv',
  car: 'ðŸ—ï¸ CAR', optimize: 'ðŸŽ¯ Optimizer', switches: 'ðŸ›¡ï¸ Switches', landscape: 'ðŸ“Š Landscape', mfg: 'ðŸ­ Mfg',
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Spider/Radar Chart for CAR Fitness
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function FitnessRadar({ fitness, color }: { fitness: any; color: string }) {
  if (!fitness) return null;
  const axes = [
    { key: 'activation', label: 'Activation' }, { key: 'persistence', label: 'Persist' },
    { key: 'exhaustion_resistance', label: 'Anti-Exhaust' }, { key: 'tumor_killing', label: 'Killing' },
    { key: 'safety', label: 'Safety' }, { key: 'manufacturing', label: 'Mfg' },
  ];
  const size = 220, cx = size / 2, cy = size / 2, maxR = 85;
  const n = axes.length, step = (2 * Math.PI) / n;
  const pt = (i: number, v: number) => ({ x: cx + maxR * v * Math.cos(i * step - Math.PI / 2), y: cy + maxR * v * Math.sin(i * step - Math.PI / 2) });
  const poly = axes.map((a, i) => { const p = pt(i, fitness[a.key] || 0); return `${p.x},${p.y}`; }).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 240 }}>
      {[0.25, 0.5, 0.75, 1].map(l => (
        <polygon key={l} points={axes.map((_, i) => { const p = pt(i, l); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="rgba(168,85,247,0.12)" strokeWidth={0.8} />
      ))}
      {axes.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(168,85,247,0.08)" strokeWidth={0.5} />; })}
      <polygon points={poly} fill={`${color}25`} stroke={color} strokeWidth={2} />
      {axes.map((a, i) => { const lp = pt(i, 1.22); return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted, #94a3b8)" fontSize={8} fontWeight={600}>{a.label}</text>; })}
      <text x={cx} y={cx - 4} textAnchor="middle" fill="var(--text-primary, #e2e8f0)" fontSize={18} fontWeight={800}>{((fitness.overall || 0) * 100).toFixed(0)}</text>
      <text x={cx} y={cx + 10} textAnchor="middle" fill="var(--text-muted, #94a3b8)" fontSize={8}>Fitness</text>
    </svg>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Pareto Chart for Optimizer
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ParetoChart({ candidates, pareto }: { candidates: any[]; pareto: any[] }) {
  if (!candidates?.length) return null;
  const w = 400, h = 250, pad = 40;
  const paretoIds = new Set(pareto?.map((p: any) => p.candidate_id) || []);
  const xMax = Math.max(...candidates.map((c: any) => c.scores?.efficacy || 0)) * 1.1;
  const yMax = Math.max(...candidates.map((c: any) => c.scores?.safety || 0)) * 1.1;
  const sx = (v: number) => pad + (v / xMax) * (w - pad * 2);
  const sy = (v: number) => h - pad - (v / yMax) * (h - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 450 }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
      <text x={w / 2} y={h - 5} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>Efficacy â†’</text>
      <text x={10} y={h / 2} textAnchor="middle" fill="var(--text-muted)" fontSize={10} transform={`rotate(-90,10,${h / 2})`}>Safety â†’</text>
      {candidates.map((c: any, i: number) => {
        const isPareto = paretoIds.has(c.candidate_id);
        return (
          <g key={i}>
            <circle cx={sx(c.scores?.efficacy || 0)} cy={sy(c.scores?.safety || 0)} r={isPareto ? 6 : 3.5}
              fill={isPareto ? '#a855f7' : 'rgba(148,163,184,0.3)'} stroke={isPareto ? '#c084fc' : 'transparent'} strokeWidth={isPareto ? 2 : 0} />
            {isPareto && c.rank <= 3 && (
              <text x={sx(c.scores?.efficacy || 0) + 8} y={sy(c.scores?.safety || 0) - 4} fill="#c084fc" fontSize={8} fontWeight={700}>#{c.rank}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Switch Kinetics Chart
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function KineticsChart({ timepoints }: { timepoints: any[] }) {
  if (!timepoints?.length) return null;
  const w = 500, h = 200, pad = 45;
  const maxT = Math.max(...timepoints.map((t: any) => t.hour));
  const sx = (v: number) => pad + (v / maxT) * (w - pad * 2);
  const sy = (v: number) => h - pad - (v / 100) * (h - pad * 2);
  const activeLine = timepoints.map((t: any) => `${sx(t.hour)},${sy(t.car_t_active_pct)}`).join(' ');
  const cytLine = timepoints.map((t: any) => `${sx(t.hour)},${sy(Math.min(100, t.cytokine_level_au / 3))}`).join(' ');
  const activationHour = timepoints.find((t: any) => t.switch_activated)?.hour || 0;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 550 }}>
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
      {activationHour > 0 && <line x1={sx(activationHour)} y1={pad} x2={sx(activationHour)} y2={h - pad} stroke="rgba(239,68,68,0.4)" strokeWidth={1} strokeDasharray="4" />}
      {activationHour > 0 && <text x={sx(activationHour)} y={pad - 4} textAnchor="middle" fill="#ef4444" fontSize={8}>Switch ON</text>}
      <polyline points={activeLine} fill="none" stroke="#22c55e" strokeWidth={2} />
      <polyline points={cytLine} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3" />
      <text x={w / 2} y={h - 5} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>Hours â†’</text>
      <circle cx={w - pad - 80} cy={pad + 5} r={4} fill="#22c55e" /><text x={w - pad - 72} y={pad + 9} fill="var(--text-muted)" fontSize={9}>CAR-T Active</text>
      <circle cx={w - pad - 80} cy={pad + 20} r={4} fill="#f59e0b" /><text x={w - pad - 72} y={pad + 24} fill="var(--text-muted)" fontSize={9}>Cytokines</text>
    </svg>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Manufacturing Timeline Visualization
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function MfgTimeline({ steps }: { steps: any[] }) {
  if (!steps?.length) return null;
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {steps.map((s: any, i: number) => {
        const color = s.success ? '#22c55e' : '#ef4444';
        return (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10,
            border: `1px solid ${color}20`, background: `${color}04` }}>
            <div style={{ minWidth: 50, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{s.day}</div>
              <div style={{ fontSize: 18, marginTop: 2 }}>{s.success ? 'âœ…' : 'âŒ'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{s.step}
                {s.critical && <span style={{ ...S.badge('#f59e0b'), marginLeft: 8, fontSize: 9 }}>CRITICAL</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-muted)' }}>
                {Object.entries(s.data || {}).slice(0, 4).map(([k, v]: [string, any]) => (
                  <span key={k}><strong style={{ color: 'var(--text-primary)' }}>{String(v)}</strong> {k.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>${s.cost_usd?.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Main Component
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function DrugDiscovery() {
  const [activeTab, setActiveTab] = useState<TabKey>('proteome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Proteome scan
  const [proteomeData, setProteomeData] = useState<any>(null);
  const [targetGene, setTargetGene] = useState('');
  const [targetScore, setTargetScore] = useState<any>(null);
  // Novelty
  const [noveltyData, setNoveltyData] = useState<any>(null);
  // Toxicity
  const [toxGene, setToxGene] = useState('CD19');
  const [toxData, setToxData] = useState<any>(null);
  // scFv
  const [scfvTarget, setScfvTarget] = useState('CD19');
  const [scfvData, setScfvData] = useState<any>(null);
  // CAR
  const [carTarget, setCarTarget] = useState('CD19');
  const [carGen, setCarGen] = useState('2nd_generation');
  const [carData, setCarData] = useState<any>(null);
  // Lead Optimizer (new)
  const [optTarget, setOptTarget] = useState('CD19');
  const [optData, setOptData] = useState<any>(null);
  // Safety Switches (new)
  const [switchType, setSwitchType] = useState('iCasp9');
  const [switchData, setSwitchData] = useState<any>(null);
  const [switchList, setSwitchList] = useState<any>(null);
  const [switchSim, setSwitchSim] = useState<any>(null);
  // Competitive Landscape (new)
  const [lsTarget, setLsTarget] = useState('CD19');
  const [lsData, setLsData] = useState<any>(null);
  const [approvedData, setApprovedData] = useState<any>(null);
  // Manufacturing (new)
  const [mfgData, setMfgData] = useState<any>(null);

  const api = async (url: string, opts?: RequestInit) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}${url}`, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) { setError(e.message); return null; }
    finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>ðŸ’Š AI Drug Discovery Engine</h1>
        <p style={S.subtitle}>Proteome scanning â€¢ Target optimization â€¢ Safety switches â€¢ Competitive landscape â€¢ Manufacturing</p>
      </div>

      <div style={S.tabs}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map(tab => (
          <button key={tab} style={S.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>{TAB_LABELS[tab]}</button>
        ))}
      </div>

      {error && <div style={S.error}>âš ï¸ {error}</div>}

      {/* â•â•â• PROTEOME â•â•â• */}
      {activeTab === 'proteome' && (
        <>
          <div style={S.card}>
            <div style={S.formRow}>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => {
                const d = await api('/api/v5/discovery/proteome-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ max_results: 30 }) });
                if (d) setProteomeData(d);
              }} disabled={loading}>{loading ? 'â³ Scanning...' : 'ðŸ”¬ Scan Full Proteome'}</button>
              <div style={{ ...S.field, flexDirection: 'row' as const, alignItems: 'flex-end', gap: 8 }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Score specific gene..." value={targetGene} onChange={e => setTargetGene(e.target.value)} />
                <button style={{ ...S.btnSm }} onClick={async () => {
                  if (!targetGene.trim()) return;
                  const d = await api(`/api/v5/discovery/target/${targetGene.trim().toUpperCase()}/score`);
                  if (d) setTargetScore(d);
                }} disabled={loading}>Score</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['CD19','BCMA','HER2','MSLN','CD47','B7_H3','GPC3','DLL3'].map(g => (
                <button key={g} onClick={() => setTargetGene(g)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.06)', color: '#c084fc', cursor: 'pointer', fontWeight: 600 }}>{g}</button>
              ))}
            </div>
          </div>
          {targetScore && (
            <div style={S.card}>
              <h3 style={S.sectionTitle}>ðŸŽ¯ {targetScore.gene} â€” Target Score</h3>
              <div style={S.statGrid}>
                <div style={S.stat('#a855f7')}><span style={S.statValue}>{(targetScore.composite_score * 100).toFixed(0)}%</span><span style={S.statLabel}>Composite</span></div>
                <div style={S.stat('#ec4899')}><span style={S.statValue}>{targetScore.target_class}</span><span style={S.statLabel}>Class</span></div>
                {Object.entries(targetScore.dimensions || {}).map(([k, v]: [string, any]) => (
                  <div key={k} style={S.stat('#06b6d4')}><span style={S.statValue}>{(v * 100).toFixed(0)}%</span><span style={S.statLabel}>{k.replace(/_/g, ' ')}</span>
                    <div style={S.progressBar}><div style={S.progressFill(v * 100, '#06b6d4')} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {proteomeData && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat('#a855f7')}><span style={S.statValue}>{proteomeData.total_scanned?.toLocaleString()}</span><span style={S.statLabel}>Scanned</span></div>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{proteomeData.ideal_targets}</span><span style={S.statLabel}>Ideal</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{proteomeData.promising_targets}</span><span style={S.statLabel}>Promising</span></div>
                <div style={S.stat('#f59e0b')}><span style={S.statValue}>{proteomeData.surface_proteins}</span><span style={S.statLabel}>Surface</span></div>
              </div>
              <div style={S.card}>
                <h3 style={S.sectionTitle}>ðŸ† Ranked Targets</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={S.table}><thead><tr>
                    <th style={S.th}>#</th><th style={S.th}>Gene</th><th style={S.th}>Score</th><th style={S.th}>Class</th><th style={S.th}>Surface</th><th style={S.th}>Specificity</th><th style={S.th}>Druggability</th>
                  </tr></thead><tbody>
                    {proteomeData.ranked_targets?.map((t: any, i: number) => (
                      <tr key={i} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.05)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...S.td, fontWeight: 700, color: '#c084fc' }}>{i + 1}</td>
                        <td style={{ ...S.td, fontWeight: 700 }}>{t.gene}</td>
                        <td style={S.td}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ ...S.progressBar, width: 60, height: 5 }}><div style={S.progressFill((t.composite_score || t.score || 0) * 100, '#a855f7')} /></div>{((t.composite_score || t.score || 0) * 100).toFixed(0)}%</div></td>
                        <td style={S.td}><span style={S.badge(t.target_class === 'ideal' ? '#22c55e' : t.target_class === 'promising' ? '#06b6d4' : '#f59e0b')}>{t.target_class}</span></td>
                        <td style={S.td}>{((t.surface_probability || 0) * 100).toFixed(0)}%</td>
                        <td style={S.td}>{((t.tumor_specificity || 0) * 100).toFixed(0)}%</td>
                        <td style={S.td}>{((t.druggability || 0) * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* â•â•â• NOVELTY â•â•â• */}
      {activeTab === 'novelty' && (
        <>
          <div style={S.card}>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => {
              const d = await api('/api/v5/discovery/novelty?min_novelty=0.3&max_results=20');
              if (d) setNoveltyData(d);
            }} disabled={loading}>{loading ? 'â³ Detecting...' : 'ðŸŒŸ Detect Novel Targets'}</button>
          </div>
          {noveltyData && (
            <>
              <div style={S.statGrid}><div style={S.stat('#a855f7')}><span style={S.statValue}>{noveltyData.total_novel_targets}</span><span style={S.statLabel}>Novel Targets</span></div></div>
              <div style={S.card}>
                <h3 style={S.sectionTitle}>ðŸŒŸ Underexplored Targets</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  {noveltyData.targets?.map((t: any) => (
                    <div key={t.gene} style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(168,85,247,0.15)', background: 'rgba(168,85,247,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#c084fc' }}>#{t.rank}</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t.gene}</span>
                          <span style={S.badge('#06b6d4')}>{t.stage?.replace(/_/g, ' ')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={S.badge('#a855f7')}>Novelty: {(t.novelty * 100).toFixed(0)}%</span>
                          <span style={S.badge('#22c55e')}>Opportunity: {(t.opportunity_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ðŸ“š {t.pubmed_count?.toLocaleString()} papers</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ðŸ§ª {t.clinical_trials} trials</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ðŸ¢ {t.competitors} competitors</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ðŸ’° ${t.market_size_B}B market</div>
                      </div>
                      {t.recommendations?.length > 0 && <div style={{ fontSize: 12, color: '#4ade80', lineHeight: 1.6 }}>{t.recommendations.map((r: string, i: number) => <div key={i}>ðŸ’¡ {r}</div>)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* â•â•â• TOXICITY â•â•â• */}
      {activeTab === 'toxicity' && (
        <>
          <div style={S.card}><div style={S.formRow}>
            <div style={S.field}><label style={S.label}>Target Gene</label>
              <select style={S.input} value={toxGene} onChange={e => setToxGene(e.target.value)}>
                {['CD19','BCMA','HER2','EGFR','MSLN','GPC3','PSMA','EpCAM','CD47','PD_L1','DLL3','B7_H3'].map(g => <option key={g} value={g}>{g}</option>)}
              </select></div>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api(`/api/v5/discovery/toxicity/${toxGene}`); if (d) setToxData(d); }} disabled={loading}>{loading ? 'â³...' : 'âš ï¸ Predict Toxicity'}</button>
          </div></div>
          {toxData && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat(toxData.safety_summary?.overall_risk > 0.5 ? '#ef4444' : '#22c55e')}><span style={{ ...S.statValue, color: toxData.safety_summary?.overall_risk > 0.5 ? '#ef4444' : '#22c55e' }}>{((toxData.safety_summary?.overall_risk || 0) * 100).toFixed(0)}%</span><span style={S.statLabel}>Overall Risk</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{toxData.safety_summary?.grade?.replace(/_/g,' ')}</span><span style={S.statLabel}>CTCAE Grade</span></div>
                <div style={S.stat('#a855f7')}><span style={S.statValue}>{toxData.safety_summary?.therapeutic_index?.toFixed(1)}x</span><span style={S.statLabel}>Therapeutic Index</span></div>
                <div style={S.stat('#f59e0b')}><span style={S.statValue}>{toxData.safety_summary?.critical_tissues}</span><span style={S.statLabel}>Critical Tissues</span></div>
              </div>
              <div style={S.card}><h3 style={S.sectionTitle}>ðŸ§« Tissue Expression Risk</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {toxData.tissue_risks?.map((t: any) => {
                    const rc = t.risk > 0.15 ? '#ef4444' : t.risk > 0.05 ? '#f59e0b' : '#10b981';
                    return (<div key={t.tissue} style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${rc}25`, background: `${rc}06` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{t.tissue?.replace(/_/g,' ')}</div>
                      <div style={S.progressBar}><div style={S.progressFill(t.expression * 100, rc)} /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Expr: {(t.expression*100).toFixed(0)}%</span><span style={{ color: rc, fontWeight: 700 }}>Risk: {(t.risk*100).toFixed(1)}%</span>
                      </div></div>);
                  })}
                </div>
              </div>
              {toxData.management?.length > 0 && <div style={S.card}><h3 style={S.sectionTitle}>ðŸ“‹ Management</h3>
                {toxData.management.map((m: string, i: number) => <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(148,163,184,0.06)' }}><span>ðŸ“Œ</span><span style={{ fontSize:13, color:'var(--text-primary)', lineHeight:1.6 }}>{m}</span></div>)}
              </div>}
            </>
          )}
        </>
      )}

      {/* â•â•â• scFv â•â•â• */}
      {activeTab === 'scfv' && (
        <>
          <div style={S.card}><div style={S.formRow}>
            <div style={S.field}><label style={S.label}>Target</label><select style={S.input} value={scfvTarget} onChange={e => setScfvTarget(e.target.value)}>{['CD19','CD22','HER2','MSLN','PSMA','BCMA'].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api('/api/v5/discovery/scfv/design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: scfvTarget, num_candidates: 5 }) }); if (d) setScfvData(d); }} disabled={loading}>{loading ? 'â³...' : 'ðŸ§¬ Design scFv'}</button>
          </div></div>
          {scfvData && (
            <div style={{ display: 'grid', gap: 16 }}>
              {scfvData.candidates?.map((c: any) => (
                <div key={c.id} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#c084fc' }}>#{c.rank}</span>
                      <div><div style={{ fontSize: 14, fontWeight: 700 }}>{c.id}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Template: {c.template} â€¢ {c.humanization?.replace(/_/g,' ')}</div></div>
                    </div>
                    <span style={S.badge('#a855f7')}>Score: {(c.overall_score * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
                    <div style={S.stat('#06b6d4')}><span style={{ ...S.statValue, fontSize: 16 }}>{c.binding?.kd_nm?.toFixed(2)}</span><span style={S.statLabel}>KD (nM)</span></div>
                    <div style={S.stat('#22c55e')}><span style={{ ...S.statValue, fontSize: 16 }}>{c.developability?.stability_tm?.toFixed(1)}Â°C</span><span style={S.statLabel}>Tm</span></div>
                    <div style={S.stat('#ec4899')}><span style={{ ...S.statValue, fontSize: 14 }}>{((c.developability?.immunogenicity||0)*100).toFixed(0)}%</span><span style={S.statLabel}>Immunogenicity</span></div>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 8, padding: 10, fontFamily: 'monospace', fontSize: 11, lineHeight: 1.8, color: 'var(--text-muted)' }}>
                    {Object.entries(c.cdr_sequences || {}).map(([k, v]: [string, any]) => <div key={k}><span style={{ color: '#818cf8', fontWeight: 700 }}>{k}:</span> <span style={{ color: 'var(--text-primary)', letterSpacing: 1 }}>{v}</span></div>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* â•â•â• CAR ARCHITECT â•â•â• */}
      {activeTab === 'car' && (
        <>
          <div style={S.card}><div style={S.formRow}>
            <div style={S.field}><label style={S.label}>Target</label><select style={S.input} value={carTarget} onChange={e => setCarTarget(e.target.value)}>{['CD19','BCMA','HER2','MSLN','EGFR','CD22','GPC3'].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
            <div style={S.field}><label style={S.label}>Generation</label><select style={S.input} value={carGen} onChange={e => setCarGen(e.target.value)}>{['1st_generation','2nd_generation','3rd_generation','4th_generation','5th_generation'].map(g => <option key={g} value={g}>{g.replace(/_/g,' ')}</option>)}</select></div>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api('/api/v5/discovery/car/design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: carTarget, generation: carGen, num_designs: 5 }) }); if (d) setCarData(d); }} disabled={loading}>{loading ? 'â³...' : 'ðŸ—ï¸ Design CAR'}</button>
          </div></div>
          {carData?.constructs?.map((c: any) => (
            <div key={c.id} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 22, fontWeight: 800, color: '#c084fc' }}>#{c.rank}</span><span style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.size_kda} kDa â€¢ {c.vector_kb} kb</div>
                </div><span style={S.badge('#a855f7')}>Fitness: {((c.fitness?.overall||0)*100).toFixed(0)}%</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start' }}>
                <FitnessRadar fitness={c.fitness} color="#a855f7" />
                <div>{['activation','persistence','exhaustion_resistance','tumor_killing','safety','manufacturing'].map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 100, textTransform: 'capitalize' }}>{k.replace(/_/g,' ')}</span>
                    <div style={{ ...S.progressBar, flex: 1, height: 6 }}><div style={S.progressFill((c.fitness?.[k]||0)*100, '#a855f7')} /></div>
                    <span style={{ fontSize: 10, width: 35, textAlign: 'right' }}>{((c.fitness?.[k]||0)*100).toFixed(0)}%</span>
                  </div>
                ))}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* â•â•â• TAB: LEAD OPTIMIZER â•â•â• */}
      {activeTab === 'optimize' && (
        <>
          <div style={S.card}>
            <h3 style={S.sectionTitle}>ðŸŽ¯ Multi-Objective CAR Construct Optimizer</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
              Generates candidate CAR constructs from {'>'}30 domain combinations and ranks them across efficacy, persistence, safety, and manufacturability. Identifies the Pareto frontier of optimal designs.
            </p>
            <div style={S.formRow}>
              <div style={S.field}><label style={S.label}>Target Antigen</label>
                <select style={S.input} value={optTarget} onChange={e => setOptTarget(e.target.value)}>
                  {['CD19','BCMA','HER2','MSLN','EGFR','CD22','GPC3','PSMA','CD20'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => {
                const d = await api('/api/v5/discovery/optimize-car', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: optTarget, n_candidates: 50 }) });
                if (d) setOptData(d);
              }} disabled={loading}>{loading ? 'â³ Optimizing...' : 'ðŸŽ¯ Optimize CAR Construct'}</button>
            </div>
          </div>
          {optData && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat('#a855f7')}><span style={S.statValue}>{optData.total_candidates}</span><span style={S.statLabel}>Candidates</span></div>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{optData.pareto_optimal}</span><span style={S.statLabel}>Pareto Optimal</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{optData.recommendation?.verdict}</span><span style={S.statLabel}>Verdict</span></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>ðŸ“ˆ Pareto Frontier (Efficacy vs Safety)</h3>
                  <ParetoChart candidates={optData.top_candidates || []} pareto={optData.pareto_frontier || []} />
                </div>
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>ðŸ† Top Recommendation</h3>
                  {optData.recommendation && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#c084fc', marginBottom: 12 }}>{optData.recommendation.candidate_id}</div>
                      {optData.recommendation.strengths?.map((s: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#4ade80', padding: '3px 0' }}>âœ… {s}</div>)}
                      {optData.recommendation.limitations?.map((l: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#f59e0b', padding: '3px 0' }}>âš ï¸ {l}</div>)}
                    </div>
                  )}
                </div>
              </div>
              <div style={S.card}>
                <h3 style={S.sectionTitle}>ðŸ”¬ Top 10 Candidates</h3>
                <div style={{ overflowX: 'auto' }}><table style={S.table}><thead><tr>
                  <th style={S.th}>#</th><th style={S.th}>ID</th><th style={S.th}>scFv</th><th style={S.th}>Costim</th>
                  <th style={S.th}>Efficacy</th><th style={S.th}>Persist</th><th style={S.th}>Safety</th><th style={S.th}>Mfg</th><th style={S.th}>Composite</th>
                </tr></thead><tbody>
                  {optData.top_candidates?.map((c: any) => (
                    <tr key={c.candidate_id}>
                      <td style={{ ...S.td, fontWeight: 700, color: '#c084fc' }}>{c.rank}</td>
                      <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11 }}>{c.candidate_id}</td>
                      <td style={S.td}>{c.domains?.scFv}</td>
                      <td style={S.td}><span style={S.badge('#6366f1')}>{c.domains?.costimulatory}</span></td>
                      <td style={S.td}>{(c.scores?.efficacy * 100).toFixed(0)}%</td>
                      <td style={S.td}>{(c.scores?.persistence * 100).toFixed(0)}%</td>
                      <td style={S.td}>{(c.scores?.safety * 100).toFixed(0)}%</td>
                      <td style={S.td}>{(c.scores?.manufacturability * 100).toFixed(0)}%</td>
                      <td style={{ ...S.td, fontWeight: 700 }}><span style={S.badge(c.scores?.composite > 0.65 ? '#22c55e' : '#f59e0b')}>{(c.scores?.composite * 100).toFixed(0)}%</span></td>
                    </tr>
                  ))}
                </tbody></table></div>
              </div>
            </>
          )}
        </>
      )}

      {/* â•â•â• TAB: SAFETY SWITCHES â•â•â• */}
      {activeTab === 'switches' && (
        <>
          <div style={S.card}>
            <h3 style={S.sectionTitle}>ðŸ›¡ï¸ Safety Switch Designer & Simulator</h3>
            <div style={S.formRow}>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api('/api/v5/discovery/safety-switch/all'); if (d) setSwitchList(d); }} disabled={loading}>ðŸ“‹ List All Switches</button>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api('/api/v5/discovery/safety-switch/design?risk_profile=high'); if (d) setSwitchData(d); }} disabled={loading}>ðŸ›¡ï¸ Design Strategy (High Risk)</button>
            </div>
            <div style={S.formRow}>
              <div style={S.field}><label style={S.label}>Switch Type</label><select style={S.input} value={switchType} onChange={e => setSwitchType(e.target.value)}>
                {['iCasp9','RQR8','EGFRt','HSV_TK','dasatinib','tet_ON','synNotch','split_CAR','SWIFF_CAR'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
              <button style={{ ...S.btnSm, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api(`/api/v5/discovery/safety-switch/simulate/${switchType}?activation_hour=24`); if (d) setSwitchSim(d); }} disabled={loading}>â–¶ï¸ Simulate</button>
            </div>
          </div>
          {switchSim && (
            <div style={S.card}>
              <h3 style={S.sectionTitle}>ðŸ“Š {switchSim.switch_name} â€” Activation Kinetics</h3>
              <div style={S.statGrid}>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{switchSim.summary?.initial_car_t?.toLocaleString()}</span><span style={S.statLabel}>Initial CAR-T</span></div>
                <div style={S.stat('#ef4444')}><span style={S.statValue}>{switchSim.summary?.final_car_t?.toLocaleString()}</span><span style={S.statLabel}>Final CAR-T</span></div>
                <div style={S.stat('#a855f7')}><span style={S.statValue}>{switchSim.summary?.elimination_pct}%</span><span style={S.statLabel}>Eliminated</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{switchSim.expected_response_time_hours}h</span><span style={S.statLabel}>Response Time</span></div>
              </div>
              <KineticsChart timepoints={switchSim.timepoints || []} />
            </div>
          )}
          {switchList && (
            <div style={S.card}>
              <h3 style={S.sectionTitle}>ðŸ“‹ Safety Switch Catalog ({switchList.total} mechanisms)</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {Object.entries(switchList.switches || {}).map(([code, s]: [string, any]) => (
                  <div key={code} style={{ padding: 14, borderRadius: 12, border: '1px solid rgba(148,163,184,0.1)', background: 'rgba(30,41,59,0.3)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.mechanism}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      <span style={S.badge(s.type === 'suicide' ? '#ef4444' : s.type === 'reversible_pause' ? '#22c55e' : '#06b6d4')}>{s.type.replace(/_/g,' ')}</span>
                      <span style={S.badge('#a855f7')}>{s.response_time_hours}h response</span>
                      {s.reversible && <span style={S.badge('#22c55e')}>reversible</span>}
                      <span style={S.badge('#f59e0b')}>{s.clinical_stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {switchData && (
            <div style={S.card}>
              <h3 style={S.sectionTitle}>ðŸŽ¯ Recommended Strategy</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: 8 }}>Primary Switch</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{switchData.recommended_primary?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{switchData.recommended_primary?.mechanism}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.04)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', marginBottom: 8 }}>Backup Switch</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{switchData.recommended_backup?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>{switchData.recommended_backup?.mechanism}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* â•â•â• TAB: COMPETITIVE LANDSCAPE â•â•â• */}
      {activeTab === 'landscape' && (
        <>
          <div style={S.card}>
            <h3 style={S.sectionTitle}>ðŸ“Š Competitive Landscape & Approved Products</h3>
            <div style={S.formRow}>
              <div style={S.field}><label style={S.label}>Target</label><select style={S.input} value={lsTarget} onChange={e => setLsTarget(e.target.value)}>{['CD19','BCMA','HER2','EGFR','MSLN'].map(g => <option key={g} value={g}>{g}</option>)}</select></div>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api(`/api/v5/discovery/landscape/${lsTarget}`); if (d) setLsData(d); }} disabled={loading}>ðŸ“Š Analyze Landscape</button>
              <button style={{ ...S.btnSm, opacity: loading ? 0.7 : 1 }} onClick={async () => { const d = await api('/api/v5/discovery/approved-products'); if (d) setApprovedData(d); }} disabled={loading}>ðŸ’Š Approved Products</button>
            </div>
          </div>
          {approvedData && (
            <div style={S.card}>
              <h3 style={S.sectionTitle}>ðŸ’Š FDA-Approved CAR-T Products ({approvedData.total})</h3>
              <div style={{ overflowX: 'auto' }}><table style={S.table}><thead><tr>
                <th style={S.th}>Product</th><th style={S.th}>Brand</th><th style={S.th}>Target</th><th style={S.th}>Costim</th><th style={S.th}>ORR</th><th style={S.th}>CR</th><th style={S.th}>CRS â‰¥3</th><th style={S.th}>Price</th>
              </tr></thead><tbody>
                {Object.entries(approvedData.products || {}).map(([k, p]: [string, any]) => (
                  <tr key={k}>
                    <td style={{ ...S.td, fontSize: 11, fontWeight: 600 }}>{k}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{p.brand}</td>
                    <td style={S.td}><span style={S.badge('#a855f7')}>{p.target}</span></td>
                    <td style={S.td}><span style={S.badge('#06b6d4')}>{p.costim}</span></td>
                    <td style={S.td}>{(p.efficacy?.ORR * 100).toFixed(0)}%</td>
                    <td style={S.td}>{(p.efficacy?.CR * 100).toFixed(0)}%</td>
                    <td style={S.td}><span style={S.badge(p.safety?.CRS_3plus > 0.15 ? '#ef4444' : '#22c55e')}>{(p.safety?.CRS_3plus * 100).toFixed(0)}%</span></td>
                    <td style={S.td}>${(p.pricing_usd / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
              </tbody></table></div>
            </div>
          )}
          {lsData && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat('#a855f7')}><span style={S.statValue}>{lsData.approved_products}</span><span style={S.statLabel}>Approved</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{lsData.pipeline_candidates}</span><span style={S.statLabel}>In Pipeline</span></div>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>${(lsData.market_analysis?.estimated_market_size_usd / 1e9).toFixed(1)}B</span><span style={S.statLabel}>Market Size</span></div>
                <div style={S.stat('#ec4899')}><span style={S.statValue}>{lsData.market_analysis?.growth_rate_pct}%</span><span style={S.statLabel}>Growth Rate</span></div>
              </div>
              <div style={S.card}>
                <h3 style={S.sectionTitle}>ðŸ’¡ Differentiation Opportunities</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  {lsData.differentiation_opportunities?.map((d: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(168,85,247,0.1)', background: 'rgba(168,85,247,0.03)' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.opportunity}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={S.badge(d.impact === 'transformative' ? '#ec4899' : d.impact === 'high' ? '#a855f7' : '#06b6d4')}>{d.impact}</span>
                        <span style={S.badge(d.feasibility === 'high' ? '#22c55e' : d.feasibility === 'moderate' ? '#f59e0b' : '#ef4444')}>{d.feasibility}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* â•â•â• TAB: MANUFACTURING â•â•â• */}
      {activeTab === 'mfg' && (
        <>
          <div style={S.card}>
            <h3 style={S.sectionTitle}>ðŸ­ CAR-T Manufacturing Process Simulator</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
              Simulates a complete 14-day GMP manufacturing run including apheresis, transduction, expansion, QC release, and logistics. Track each step's success and cost.
            </p>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => {
              const d = await api('/api/v5/discovery/manufacturing/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: 'CD19' }) });
              if (d) setMfgData(d);
            }} disabled={loading}>{loading ? 'â³ Simulating...' : 'ðŸ­ Run Manufacturing Simulation'}</button>
          </div>
          {mfgData && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat(mfgData.batch_outcome === 'PASS' ? '#22c55e' : '#ef4444')}><span style={{ ...S.statValue, color: mfgData.batch_outcome === 'PASS' ? '#22c55e' : '#ef4444' }}>{mfgData.batch_outcome}</span><span style={S.statLabel}>Batch Outcome</span></div>
                <div style={S.stat('#a855f7')}><span style={S.statValue}>{mfgData.batch_id}</span><span style={S.statLabel}>Batch ID</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{mfgData.vein_to_vein_days}d</span><span style={S.statLabel}>Vein-to-Vein</span></div>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{mfgData.steps_passed}/{mfgData.steps_total}</span><span style={S.statLabel}>Steps Passed</span></div>
                <div style={S.stat('#f59e0b')}><span style={S.statValue}>${mfgData.cogs?.total?.toLocaleString()}</span><span style={S.statLabel}>Total COGS</span></div>
              </div>
              {mfgData.final_product && (
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>ðŸ“¦ Final Product</h3>
                  <div style={S.statGrid}>
                    <div style={S.stat('#a855f7')}><span style={S.statValue}>{mfgData.final_product.total_cells}</span><span style={S.statLabel}>Total Cells</span></div>
                    <div style={S.stat('#22c55e')}><span style={S.statValue}>{mfgData.final_product.car_positive_cells}</span><span style={S.statLabel}>CAR+ Cells</span></div>
                    <div style={S.stat('#06b6d4')}><span style={S.statValue}>{mfgData.final_product.car_positive_pct}%</span><span style={S.statLabel}>CAR+</span></div>
                    <div style={S.stat('#ec4899')}><span style={S.statValue}>{mfgData.final_product.viability_pct}%</span><span style={S.statLabel}>Viability</span></div>
                    <div style={S.stat(mfgData.final_product.meets_dose_spec ? '#22c55e' : '#ef4444')}><span style={S.statValue}>{mfgData.final_product.meets_dose_spec ? 'âœ…' : 'âŒ'}</span><span style={S.statLabel}>Dose Spec Met</span></div>
                  </div>
                </div>
              )}
              <div style={S.card}>
                <h3 style={S.sectionTitle}>ðŸ“‹ Manufacturing Steps</h3>
                <MfgTimeline steps={mfgData.steps || []} />
              </div>
              {mfgData.cogs && (
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>ðŸ’° Cost of Goods Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                    {Object.entries(mfgData.cogs).filter(([k]) => k !== 'total').map(([k, v]: [string, any]) => (
                      <div key={k} style={S.stat('#a855f7')}>
                        <span style={{ ...S.statValue, fontSize: 16 }}>${v?.toLocaleString()}</span>
                        <span style={S.statLabel}>{k.replace(/_/g, ' ')}</span>
                        <div style={S.progressBar}><div style={S.progressFill((v / mfgData.cogs.total) * 100, '#a855f7')} /></div>
                      </div>
                    ))}
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

