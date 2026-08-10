import { useState } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter',system-ui,sans-serif" } as React.CSSProperties,
  h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg,#ef4444,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' as const },
  sub: { fontSize: 14, color: 'var(--text-muted,#94a3b8)', margin: '0 0 24px', textAlign: 'center' as const },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card,rgba(30,41,59,0.6))', border: '1px solid var(--border-color,rgba(148,163,184,0.12))', borderRadius: 14, padding: 5 } as React.CSSProperties,
  tab: (a: boolean) => ({ flex: 1, padding: '12px 8px', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: a ? 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(245,158,11,0.15))' : 'transparent', color: a ? '#f87171' : 'var(--text-muted,#94a3b8)' }) as React.CSSProperties,
  card: { background: 'var(--bg-card,rgba(30,41,59,0.6))', border: '1px solid var(--border-color,rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary,#f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.1)' } as React.CSSProperties,
  input: { background: 'var(--bg-input,rgba(15,23,42,0.6))', border: '1px solid var(--border-color,rgba(148,163,184,0.15))', color: 'var(--text-primary,#f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' as const },
  btn: { background: 'linear-gradient(135deg,#ef4444,#f59e0b)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  badge: (c: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, display: 'inline-block' }),
  err: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  statG: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (a: string) => ({ background: `linear-gradient(135deg,${a}10,${a}05)`, border: `1px solid ${a}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }),
  sv: { fontSize: 18, fontWeight: 800, color: 'var(--text-primary,#f1f5f9)', display: 'block' },
  sl: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted,#94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '.05em', marginTop: 4, display: 'block' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(148,163,184,0.06)' } as React.CSSProperties,
};

type Tab = 'dashboard' | 'deviations' | 'ich' | 'audit';

export default function RegulatoryCompliance() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [deviations, setDeviations] = useState<any>(null);
  const [ichData, setIchData] = useState<any>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [devTitle, setDevTitle] = useState('');
  const [devDesc, setDevDesc] = useState('');
  const [devSeverity, setDevSeverity] = useState('major');

  const api = async (url: string, opts?: RequestInit) => {
    setLoading(true); setError('');
    try { const r = await fetch(`${API}${url}`, opts); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
    catch (e: any) { setError(e.message); return null; } finally { setLoading(false); }
  };

  const loadDashboard = async () => { const d = await api('/api/v5/regulatory/dashboard'); if (d) setDashboard(d); };
  const loadDeviations = async () => { const d = await api('/api/v5/regulatory/deviations'); if (d) setDeviations(d); };
  const loadICH = async () => { const d = await api('/api/v5/regulatory/ich-guidelines'); if (d) setIchData(d); };
  const loadAudit = async () => { const d = await api('/api/v5/regulatory/audit-trail'); if (d) setAuditData(d); };

  const createDeviation = async () => {
    if (!devTitle.trim()) return;
    const d = await api('/api/v5/regulatory/deviations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: devTitle, description: devDesc, severity: devSeverity, opened_by: 'qa_user' }),
    });
    if (d) { setDevTitle(''); setDevDesc(''); loadDeviations(); }
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>🛡️ Regulatory & Compliance</h1>
      <p style={S.sub}>GxP Compliance • Deviations/CAPA • ICH Guidelines • 21 CFR Part 11 Audit</p>

      <div style={S.tabs}>
        {(['dashboard', 'deviations', 'ich', 'audit'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {{ dashboard: '📊 Dashboard', deviations: '⚠️ Deviations', ich: '📋 ICH Guidelines', audit: '🔒 Audit Trail' }[t]}
          </button>
        ))}
      </div>

      {error && <div style={S.err}>⚠️ {error}</div>}

      {/* DASHBOARD */}
      {tab === 'dashboard' && (<>
        <div style={S.card}><button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={loadDashboard} disabled={loading}>{loading ? '⏳' : '📊 Load Dashboard'}</button></div>
        {dashboard && (<>
          <div style={S.statG}>
            <div style={S.stat('#22c55e')}><span style={S.sv}>{dashboard.compliance_score}%</span><span style={S.sl}>Compliance</span></div>
            <div style={S.stat('#ef4444')}><span style={S.sv}>{dashboard.open_deviations}</span><span style={S.sl}>Open Devs</span></div>
            <div style={S.stat('#f59e0b')}><span style={S.sv}>{dashboard.critical_deviations}</span><span style={S.sl}>Critical</span></div>
            <div style={S.stat('#3b82f6')}><span style={S.sv}>{dashboard.open_capas}</span><span style={S.sl}>Open CAPAs</span></div>
            <div style={S.stat('#8b5cf6')}><span style={S.sv}>{dashboard.lots_in_process}</span><span style={S.sl}>Lots In Process</span></div>
            <div style={S.stat('#10b981')}><span style={S.sv}>{dashboard.lots_released}</span><span style={S.sl}>Released</span></div>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{dashboard.audit_entries_24h}</span><span style={S.sl}>Audit Entries</span></div>
            <div style={S.stat('#ec4899')}><span style={S.sv}>{dashboard.ich_guidelines_applicable}</span><span style={S.sl}>ICH Guidelines</span></div>
          </div>
        </>)}
      </>)}

      {/* DEVIATIONS */}
      {tab === 'deviations' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>➕ New Deviation</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <input style={{ ...S.input, flex: 2, minWidth: 200 }} placeholder="Deviation title..." value={devTitle} onChange={e => setDevTitle(e.target.value)} />
            <select style={{ ...S.input, maxWidth: 120 }} value={devSeverity} onChange={e => setDevSeverity(e.target.value)}>
              <option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option>
            </select>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={createDeviation} disabled={loading}>Submit</button>
          </div>
          <textarea style={{ ...S.input, minHeight: 60 }} placeholder="Description..." value={devDesc} onChange={e => setDevDesc(e.target.value)} />
        </div>
        <div style={S.card}><button style={{ ...S.btn, opacity: loading ? 0.7 : 1, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }} onClick={loadDeviations} disabled={loading}>{loading ? '⏳' : '📋 Load Deviations'}</button></div>
        {deviations?.deviations?.map((d: any) => (
          <div key={d.deviation_id} style={{ ...S.card, padding: 14, borderLeft: `3px solid ${d.severity === 'critical' ? '#ef4444' : d.severity === 'major' ? '#f59e0b' : '#3b82f6'}` }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>{d.deviation_id}: {d.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>By {d.opened_by} • {d.opened_at?.slice(0, 10)}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={S.badge(d.severity === 'critical' ? '#ef4444' : d.severity === 'major' ? '#f59e0b' : '#3b82f6')}>{d.severity}</span>
              <span style={S.badge(d.status === 'open' ? '#ef4444' : '#22c55e')}>{d.status}</span>
              {d.capa_id && <span style={S.badge('#8b5cf6')}>CAPA: {d.capa_id}</span>}
            </div>
          </div>
        ))}
      </>)}

      {/* ICH */}
      {tab === 'ich' && (<>
        <div style={S.card}><button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={loadICH} disabled={loading}>{loading ? '⏳' : '📋 Load ICH Guidelines'}</button></div>
        {ichData?.guidelines?.map((g: any, i: number) => (
          <div key={i} style={{ ...S.card, padding: 14 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>{g.code}: {g.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{g.relevance_to_cart}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={S.badge('#3b82f6')}>{g.applicability}</span>
              <span style={S.badge('#22c55e')}>{g.status}</span>
            </div>
          </div>
        ))}
      </>)}

      {/* AUDIT */}
      {tab === 'audit' && (<>
        <div style={S.card}><button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={loadAudit} disabled={loading}>{loading ? '⏳' : '🔒 Load Audit Trail'}</button></div>
        {auditData?.entries?.length === 0 && <div style={S.card}><div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No audit entries yet. Create deviations or lot records to generate entries.</div></div>}
        {auditData?.entries?.map((e: any, i: number) => (
          <div key={i} style={S.row}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{e.timestamp?.slice(0, 19)}</span>
            <span style={{ fontWeight: 600 }}>{e.user}</span>
            <span style={S.badge('#3b82f6')}>{e.action}</span>
            <span style={{ color: 'var(--text-muted)' }}>{e.entity}</span>
            <span style={{ fontSize: 9, color: '#64748b' }}>🔑 {e.signature}</span>
          </div>
        ))}
      </>)}
    </div>
  );
}
