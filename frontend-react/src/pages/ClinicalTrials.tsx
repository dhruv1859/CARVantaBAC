import { useState, useEffect } from 'react';
import React from 'react';
import { fetchAntigens, fetchClinicalTrials } from '../api/client';
import { ErrorMsg, StatsCard } from '../components/UIComponents';
import PageLoader from '../components/PageLoader';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

type DashTab = 'trials' | 'safety' | 'rwe' | 'regulatory';

const DS = {
  tabs: { display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 5 } as React.CSSProperties,
  tab: (a: boolean) => ({ flex: 1, padding: '10px 8px', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: a ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))' : 'transparent', color: a ? '#fbbf24' : 'var(--text-muted, #94a3b8)' }) as React.CSSProperties,
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.1)' } as React.CSSProperties,
  input: { background: 'var(--bg-input, rgba(15,23,42,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.15))', color: 'var(--text-primary, #f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' as const },
  btn: { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  badge: (c: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, display: 'inline-block' }),
  statG: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (a: string) => ({ background: `linear-gradient(135deg,${a}10,${a}05)`, border: `1px solid ${a}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }) as React.CSSProperties,
  sv: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary,#f1f5f9)', display: 'block' },
  sl: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted,#94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
  th: { textAlign: 'left' as const, padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '2px solid var(--border-color, rgba(148,163,184,0.15))' },
  td: { padding: '8px 10px', borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.06))', color: 'var(--text-primary, #e2e8f0)', fontSize: 12 },
  progressBar: { height: 8, borderRadius: 4, background: 'var(--bg-input, rgba(148,163,184,0.1))', overflow: 'hidden' as const, marginTop: 4 },
  progressFill: (pct: number, c: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${c}, ${c}cc)`, transition: 'width 0.6s ease' }),
};

export default function ClinicalTrials() {
  const [dashTab, setDashTab] = useState<DashTab>('trials');
  const [antigens, setAntigens] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Safety
  const [safetyRes, setSafetyRes] = useState<any>(null);
  const [dsmbRes, setDsmbRes] = useState<any>(null);
  const [crsTemp, setCrsTemp] = useState(39.5);
  const [crsVasopressors, setCrsVasopressors] = useState(0);
  const [crsO2, setCrsO2] = useState('none');
  const [crsGradeRes, setCrsGradeRes] = useState<any>(null);

  // RWE
  const [rweIndication, setRweIndication] = useState('DLBCL');
  const [rweRes, setRweRes] = useState<any>(null);
  const [teRes, setTeRes] = useState<any>(null);

  // Regulatory
  const [regRes, setRegRes] = useState<any>(null);
  const [indRes, setIndRes] = useState<any>(null);

  useEffect(() => { fetchAntigens('', 50).then(setAntigens).catch(() => { }); }, []);

  const api = async (url: string, opts?: RequestInit) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}${url}`, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e: any) { setError(e.message); return null; }
    finally { setLoading(false); }
  };

  const handleLoad = async () => {
    if (!selected) return;
    setLoading(true); setError(''); setData(null);
    try { setData(await fetchClinicalTrials(selected)); }
    catch (e: any) { setError(e.response?.data?.detail || 'Failed to load'); }
    finally { setLoading(false); }
  };

  const doSafetySignals = async () => { const d = await api('/api/v5/trials/safety/signals?n_patients=80'); if (d) setSafetyRes(d); };
  const doDSMB = async () => { const d = await api('/api/v5/trials/safety/dsmb-report?n_patients=60'); if (d) setDsmbRes(d); };
  const doGradeCRS = async () => {
    const d = await api('/api/v5/trials/safety/grade-crs', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature: crsTemp, n_vasopressors: crsVasopressors, o2_device: crsO2, on_vasopressor: crsVasopressors > 0 }) });
    if (d) setCrsGradeRes(d);
  };
  const doRWE = async () => { const d = await api(`/api/v5/trials/rwe/historical-outcomes?indication=${rweIndication}`); if (d) setRweRes(d); };
  const doTreatmentEffect = async () => { const d = await api(`/api/v5/trials/rwe/treatment-effect?indication=${rweIndication}`); if (d) setTeRes(d); };
  const doRegComparison = async () => { const d = await api('/api/v5/trials/regulatory/comparison'); if (d) setRegRes(d); };
  const doINDChecklist = async () => { const d = await api('/api/v5/trials/regulatory/ind-checklist?target=CD19&indication=DLBCL'); if (d) setIndRes(d); };

  const phases = data?.phase_distribution || {};
  const statuses = data?.status_distribution || {};
  const trials = data?.recent_trials || [];

  return (
    <>
      <div className="page-header">
        <h2>💊 Clinical Trials Dashboard</h2>
        <p>Trial data, safety monitoring, real-world evidence & regulatory intelligence</p>
      </div>

      <div style={DS.tabs}>
        {([['trials', '📋 Trials'], ['safety', '🛡️ Safety'], ['rwe', '📊 RWE'], ['regulatory', '🏛️ Regulatory']] as [DashTab, string][]).map(([k, l]) => (
          <button key={k} style={DS.tab(dashTab === k)} onClick={() => setDashTab(k)}>{l}</button>
        ))}
      </div>

      {error && <ErrorMsg msg={error} />}
      {loading && <PageLoader theme="trials" text="Loading..." />}

      {/* ═══ TRIALS TAB ═══ */}
      {dashTab === 'trials' && (
        <>
          <div className="card">
            <div className="input-row">
              <div className="form-group">
                <label>Antigen</label>
                <select className="form-control" value={selected} onChange={e => setSelected(e.target.value)}>
                  <option value="">-- select --</option>
                  {antigens.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleLoad} disabled={!selected || loading}>
                {loading ? 'Loading...' : 'Load Trials'}
              </button>
            </div>
          </div>
          {data && (
            <>
              <div className="stats-grid">
                <StatsCard value={data.total_trials || 0} label="Total Trials" />
                <StatsCard value={data.car_t_trials || 0} label="CAR-T Trials" />
                <StatsCard value={statuses.RECRUITING || 0} label="Recruiting" />
                <StatsCard value={statuses.COMPLETED || 0} label="Completed" />
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-header">Phase Distribution</div>
                  {Object.entries(phases).map(([phase, count]) => (
                    <div key={phase} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 600 }}>{String(phase).replace('_', ' ')}</span>
                      <span style={{ color: '#94A3B8' }}>{String(count)} trials</span>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-header">Status Distribution</div>
                  {Object.entries(statuses).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 600, color: status === 'RECRUITING' ? '#10B981' : '#94A3B8' }}>
                        {status === 'RECRUITING' ? '🟢' : status === 'COMPLETED' ? '✅' : '⚪'} {status}
                      </span>
                      <span style={{ color: '#94A3B8' }}>{String(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {trials.length > 0 && (
                <div className="card">
                  <div className="card-header">Recent Trials ({trials.length})</div>
                  <table className="data-table">
                    <thead><tr><th>NCT ID</th><th>Title</th><th>Phase</th><th>Status</th></tr></thead>
                    <tbody>
                      {trials.slice(0, 20).map((t: any, i: number) => (
                        <tr key={i}>
                          <td><a href={`https://clinicaltrials.gov/ct2/show/${t.nct_id}`} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 600 }}>{t.nct_id}</a></td>
                          <td style={{ maxWidth: 400, fontSize: 12 }}>{t.title || 'N/A'}</td>
                          <td>{(t.phases || []).map((p: string) => <span key={p} className="badge badge-tier2" style={{ marginRight: 4 }}>{p}</span>)}</td>
                          <td style={{ fontSize: 12, color: t.status === 'RECRUITING' ? '#10B981' : '#94A3B8' }}>{t.status || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ SAFETY TAB ═══ */}
      {dashTab === 'safety' && (
        <>
          <div style={DS.card}>
            <h3 style={DS.sTitle}>🩺 CRS Grading Calculator</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Temperature (°C)<input type="number" step="0.1" style={DS.input} value={crsTemp} onChange={e => setCrsTemp(+e.target.value)} /></label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vasopressors<select style={DS.input} value={crsVasopressors} onChange={e => setCrsVasopressors(+e.target.value)}>{[0,1,2,3].map(v => <option key={v} value={v}>{v}</option>)}</select></label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>O₂ Device<select style={DS.input} value={crsO2} onChange={e => setCrsO2(e.target.value)}>{['none','nasal_cannula','high_flow','non_rebreather','cpap','bipap'].map(d => <option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}</select></label>
            </div>
            <button style={DS.btn} onClick={doGradeCRS} disabled={loading}>{loading ? '⏳' : '🩺 Grade CRS'}</button>
          </div>
          {crsGradeRes && (
            <div style={DS.card}>
              <div style={DS.statG}>
                <div style={DS.stat(crsGradeRes.grade >= 3 ? '#ef4444' : crsGradeRes.grade >= 2 ? '#f59e0b' : '#22c55e')}>
                  <span style={DS.sv}>Grade {crsGradeRes.grade}</span><span style={DS.sl}>CRS</span>
                </div>
                <div style={DS.stat(crsGradeRes.requires_icu ? '#ef4444' : '#22c55e')}><span style={DS.sv}>{crsGradeRes.requires_icu ? 'Yes' : 'No'}</span><span style={DS.sl}>ICU</span></div>
                <div style={DS.stat(crsGradeRes.requires_tocilizumab ? '#f59e0b' : '#22c55e')}><span style={DS.sv}>{crsGradeRes.requires_tocilizumab ? 'Yes' : 'No'}</span><span style={DS.sl}>Tocilizumab</span></div>
              </div>
              {crsGradeRes.criteria?.management?.map((m: string, i: number) => (
                <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-primary)', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>• {m}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={DS.card}>
              <h3 style={DS.sTitle}>📊 Safety Signals</h3>
              <button style={{ ...DS.btn, marginBottom: 12 }} onClick={doSafetySignals} disabled={loading}>Detect Signals</button>
              {safetyRes && (
                <>
                  <div style={DS.statG}>
                    <div style={DS.stat('#f59e0b')}><span style={DS.sv}>{safetyRes.total_ae_types}</span><span style={DS.sl}>AE Types</span></div>
                    <div style={DS.stat(safetyRes.active_signals > 0 ? '#ef4444' : '#22c55e')}><span style={DS.sv}>{safetyRes.active_signals}</span><span style={DS.sl}>Signals</span></div>
                  </div>
                  {safetyRes.signals?.slice(0, 8).map((s: any) => (
                    <div key={s.adverse_event} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{s.adverse_event.replace(/_/g, ' ')}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{s.observed_rate_pct}%</span>
                        <span style={DS.badge(s.is_signal ? '#ef4444' : '#22c55e')}>PRR {s.prr}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div style={DS.card}>
              <h3 style={DS.sTitle}>📋 DSMB Report</h3>
              <button style={{ ...DS.btn, marginBottom: 12 }} onClick={doDSMB} disabled={loading}>Generate</button>
              {dsmbRes && (
                <div style={DS.statG}>
                  <div style={DS.stat('#3b82f6')}><span style={DS.sv}>{dsmbRes.enrollment?.treated}</span><span style={DS.sl}>Treated</span></div>
                  <div style={DS.stat('#f59e0b')}><span style={DS.sv}>{dsmbRes.crs_summary?.any_grade_pct}%</span><span style={DS.sl}>CRS Any</span></div>
                  <div style={DS.stat('#ef4444')}><span style={DS.sv}>{dsmbRes.crs_summary?.grade_3plus_pct}%</span><span style={DS.sl}>CRS G3+</span></div>
                  <div style={DS.stat(dsmbRes.stopping_rules_triggered ? '#ef4444' : '#22c55e')}><span style={DS.sv}>{dsmbRes.dsmb_recommendation}</span><span style={DS.sl}>Recommendation</span></div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ RWE TAB ═══ */}
      {dashTab === 'rwe' && (
        <>
          <div style={DS.card}>
            <h3 style={DS.sTitle}>📊 Real-World Evidence</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ ...DS.input, maxWidth: 150 }} value={rweIndication} onChange={e => setRweIndication(e.target.value)}>
                {['DLBCL', 'ALL', 'MM'].map(i => <option key={i}>{i}</option>)}
              </select>
              <button style={DS.btn} onClick={doRWE} disabled={loading}>Historical Outcomes</button>
              <button style={{ ...DS.btn, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }} onClick={doTreatmentEffect} disabled={loading}>Treatment Effect</button>
            </div>
          </div>
          {rweRes?.outcomes && (
            <div style={DS.card}>
              <h3 style={DS.sTitle}>📈 Published Outcomes — {rweRes.indication}</h3>
              <table style={DS.table}>
                <thead><tr><th style={DS.th}>Regimen</th><th style={DS.th}>ORR</th><th style={DS.th}>CR</th><th style={DS.th}>mPFS</th><th style={DS.th}>mOS</th><th style={DS.th}>N</th><th style={DS.th}>Source</th></tr></thead>
                <tbody>
                  {Object.entries(rweRes.outcomes).map(([key, val]: [string, any]) => (
                    <tr key={key}>
                      <td style={{ ...DS.td, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val.regimen}</td>
                      <td style={{ ...DS.td, fontWeight: 700, color: val.orr > 0.5 ? '#22c55e' : '#f59e0b' }}>{(val.orr * 100).toFixed(0)}%</td>
                      <td style={{ ...DS.td, fontWeight: 700, color: val.cr > 0.3 ? '#06b6d4' : '#94a3b8' }}>{(val.cr * 100).toFixed(0)}%</td>
                      <td style={DS.td}>{val.median_pfs_months}mo</td>
                      <td style={DS.td}>{val.median_os_months ? `${val.median_os_months}mo` : 'NR'}</td>
                      <td style={DS.td}>{val.n_patients}</td>
                      <td style={{ ...DS.td, fontSize: 10, color: 'var(--text-muted)', maxWidth: 200 }}>{val.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {teRes && (
            <div style={DS.card}>
              <h3 style={DS.sTitle}>⚖️ Treatment Effect: {teRes.experimental?.arm} vs {teRes.comparator?.arm}</h3>
              <div style={DS.statG}>
                <div style={DS.stat('#22c55e')}><span style={DS.sv}>{teRes.response?.odds_ratio}</span><span style={DS.sl}>Odds Ratio</span></div>
                <div style={DS.stat('#06b6d4')}><span style={DS.sv}>{teRes.response?.nnt || '—'}</span><span style={DS.sl}>NNT</span></div>
                <div style={DS.stat('#a855f7')}><span style={DS.sv}>{teRes.survival?.pfs_hr || '—'}</span><span style={DS.sl}>PFS HR</span></div>
                <div style={DS.stat('#f59e0b')}><span style={DS.sv}>{teRes.survival?.pfs_improvement_months || '—'}</span><span style={DS.sl}>PFS Gain (mo)</span></div>
              </div>
              <div style={{ fontSize: 12, color: '#fbbf24', padding: 10, background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                💡 {teRes.interpretation}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ REGULATORY TAB ═══ */}
      {dashTab === 'regulatory' && (
        <>
          <div style={DS.card}>
            <h3 style={DS.sTitle}>🏛️ Regulatory Intelligence</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={DS.btn} onClick={doRegComparison} disabled={loading}>Agency Comparison</button>
              <button style={{ ...DS.btn, background: 'linear-gradient(135deg, #a855f7, #6366f1)' }} onClick={doINDChecklist} disabled={loading}>IND Checklist</button>
            </div>
          </div>
          {regRes?.comparison && (
            <div style={DS.card}>
              <h3 style={DS.sTitle}>🌍 Regulatory Pathway Comparison</h3>
              <table style={DS.table}>
                <thead><tr><th style={DS.th}>Agency</th><th style={DS.th}>Country</th><th style={DS.th}>IND Timeline</th><th style={DS.th}>BLA Review</th><th style={DS.th}>Priority Review</th><th style={DS.th}>Breakthrough</th></tr></thead>
                <tbody>
                  {Object.entries(regRes.comparison).map(([code, info]: [string, any]) => (
                    <tr key={code}>
                      <td style={{ ...DS.td, fontWeight: 700 }}>{code}</td>
                      <td style={DS.td}>{info.country}</td>
                      <td style={DS.td}>{info.ind_timeline_months}mo</td>
                      <td style={DS.td}>{info.bla_review_months}mo</td>
                      <td style={{ ...DS.td, fontWeight: 700, color: '#22c55e' }}>{info.priority_review_months}mo</td>
                      <td style={DS.td}><span style={DS.badge(info.breakthrough_therapy ? '#22c55e' : '#94a3b8')}>{info.breakthrough_therapy ? 'Yes' : 'No'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {indRes && (
            <div style={DS.card}>
              <h3 style={DS.sTitle}>📋 IND Readiness — {indRes.target} / {indRes.indication}</h3>
              <div style={DS.statG}>
                <div style={DS.stat(indRes.overall_readiness_pct > 70 ? '#22c55e' : '#f59e0b')}><span style={DS.sv}>{indRes.overall_readiness_pct}%</span><span style={DS.sl}>Readiness</span></div>
                <div style={DS.stat('#3b82f6')}><span style={DS.sv}>{indRes.completed}/{indRes.total_items}</span><span style={DS.sl}>Complete</span></div>
                <div style={DS.stat(indRes.critical_items_incomplete > 0 ? '#ef4444' : '#22c55e')}><span style={DS.sv}>{indRes.critical_items_incomplete}</span><span style={DS.sl}>Critical Gap</span></div>
                <div style={DS.stat('#a855f7')}><span style={DS.sv}>{indRes.estimated_weeks_to_ind}w</span><span style={DS.sl}>Est. Weeks</span></div>
              </div>
              <div style={DS.progressBar}><div style={DS.progressFill(indRes.overall_readiness_pct, indRes.overall_readiness_pct > 70 ? '#22c55e' : '#f59e0b')} /></div>
              {Object.entries(indRes.sections || {}).map(([section, items]: [string, any]) => (
                <div key={section} style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: 4 }}>{section}</div>
                  {items.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <span style={{ color: 'var(--text-primary)', flex: 1 }}>{item.critical && '⚠️ '}{item.item}</span>
                      <span style={DS.badge(item.status === 'complete' ? '#22c55e' : item.status === 'in_progress' ? '#f59e0b' : '#ef4444')}>{item.status}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
        CARVanta Clinical Trial Intelligence Platform — 14 engines • 47 endpoints • 500+ indexed trials
      </div>
    </>
  );
}
