import { useState } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

type Tab = 'search' | 'match' | 'predict' | 'stratify' | 'protocol' | 'sites' | 'journey';

const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
  h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' as const },
  subtitle: { fontSize: 14, color: 'var(--text-muted, #94a3b8)', margin: '0 0 24px', textAlign: 'center' as const },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 5, flexWrap: 'wrap' as const } as React.CSSProperties,
  tab: (a: boolean) => ({ padding: '10px 10px', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: a ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))' : 'transparent', color: a ? '#fbbf24' : 'var(--text-muted, #94a3b8)', flex: 1, minWidth: 90 }) as React.CSSProperties,
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  input: { background: 'var(--bg-input, rgba(15,23,42,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.15))', color: 'var(--text-primary, #f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' as const },
  btn: { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' },
  err: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  badge: (c: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, display: 'inline-block' }),
  statG: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (a: string) => ({ background: `linear-gradient(135deg,${a}10,${a}05)`, border: `1px solid ${a}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }) as React.CSSProperties,
  sv: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary,#f1f5f9)', display: 'block' },
  sl: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted,#94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
  bar: (pct: number, c: string) => ({ height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.1)', overflow: 'hidden', flex: 1, position: 'relative' as const, display: 'flex' }),
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 },
  th: { textAlign: 'left' as const, padding: '8px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '2px solid var(--border-color, rgba(148,163,184,0.15))' },
  td: { padding: '8px 10px', borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.06))', color: 'var(--text-primary, #e2e8f0)', fontSize: 12 },
  progressBar: { height: 8, borderRadius: 4, background: 'var(--bg-input, rgba(148,163,184,0.1))', overflow: 'hidden' as const, marginTop: 4 },
  progressFill: (pct: number, c: string) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${c}, ${c}cc)`, transition: 'width 0.6s ease' }),
};

export default function TrialMatcher() {
  const [tab, setTab] = useState<Tab>('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search
  const [sq, setSq] = useState(''); const [sTarget, setSTarget] = useState(''); const [sPhase, setSPhase] = useState('');
  const [searchRes, setSearchRes] = useState<any>(null);

  // Match
  const [mAge, setMAge] = useState(55); const [mCancer, setMCancer] = useState('DLBCL');
  const [mTargets, setMTargets] = useState('CD19'); const [mPrior, setMPrior] = useState(2); const [mEcog, setMEcog] = useState(1);
  const [matchRes, setMatchRes] = useState<any>(null);

  // Predict
  const [pNct, setPNct] = useState('NCT02348216'); const [predRes, setPredRes] = useState<any>(null);

  // Stratify
  const [sCancer, setSCancer] = useState('DLBCL'); const [sAge, setSAge] = useState(55); const [sStage, setSStage] = useState('IV');
  const [sEcog, setSEcog] = useState(1); const [sLdh, setSLdh] = useState(true);
  const [stratRes, setStratRes] = useState<any>(null);

  // Protocol
  const [pIndication, setPIndication] = useState('DLBCL'); const [pTarget, setPTarget] = useState('CD19');
  const [pPhase, setPPhase] = useState('Phase 1/2'); const [pCostim, setPCostim] = useState('4-1BB');
  const [protoRes, setProtoRes] = useState<any>(null);

  // Sites
  const [sitesRes, setSitesRes] = useState<any>(null); const [siteRegion, setSiteRegion] = useState('');

  // Journey
  const [journeyRes, setJourneyRes] = useState<any>(null);

  const api = async (url: string, opts?: RequestInit) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}${url}`, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e: any) { setError(e.message); return null; }
    finally { setLoading(false); }
  };

  const doSearch = async () => {
    const d = await api('/api/v5/trials/search', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sq, target: sTarget || undefined, phase: sPhase || undefined, max_results: 20 }) });
    if (d) setSearchRes(d);
  };

  const doMatch = async () => {
    const d = await api('/api/v5/trials/match', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: { age: mAge, cancer_type: mCancer, target_antigens_expressed: mTargets.split(',').map(s => s.trim()), prior_therapies: mPrior, ecog_status: mEcog }, max_results: 15, min_score: 0.15, include_ineligible: true }) });
    if (d) setMatchRes(d);
  };

  const doPredict = async () => {
    const d = await api('/api/v5/trials/outcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nct_id: pNct }) });
    if (d) setPredRes(d);
  };

  const doStratify = async () => {
    const d = await api('/api/v5/trials/stratify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancer_type: sCancer, age: sAge, stage: sStage, ecog: sEcog, ldh_elevated: sLdh }) });
    if (d) setStratRes(d);
  };

  const doProtocol = async () => {
    const d = await api('/api/v5/trials/protocol/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ indication: pIndication, target: pTarget, phase: pPhase, costimulation: pCostim }) });
    if (d) setProtoRes(d);
  };

  const doSites = async () => {
    const d = await api(`/api/v5/trials/sites/network${siteRegion ? `?region=${siteRegion}` : ''}`);
    if (d) setSitesRes(d);
  };

  const doJourney = async () => {
    const d = await api('/api/v5/trials/journey/simulate?cancer_type=DLBCL&target=CD19');
    if (d) setJourneyRes(d);
  };

  const Pct = ({ val, color }: { val: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ ...S.bar(val * 100, color) }}>
        <div style={{ width: `${val * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 38 }}>{(val * 100).toFixed(0)}%</span>
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'search', label: 'ðŸ” Browse' }, { key: 'match', label: 'ðŸ§¬ Match' },
    { key: 'predict', label: 'ðŸ“Š Predict' }, { key: 'stratify', label: 'ðŸ“‹ Stratify' },
    { key: 'protocol', label: 'ðŸ“ Protocol' }, { key: 'sites', label: 'ðŸŒ Sites' },
    { key: 'journey', label: 'ðŸš¶ Journey' },
  ];

  const riskColor = (g: string) => g === 'low' || g === 'standard' || g === 'favorable' || g === 'stage_I' ? '#22c55e' : g === 'high' || g === 'very_high' || g === 'poor' || g === 'stage_III' ? '#ef4444' : '#f59e0b';

  return (
    <div style={S.page}>
      <h1 style={S.h1}>ðŸ¥ Clinical Trial Matcher</h1>
      <p style={S.subtitle}>Search 500+ trials â€¢ AI matching â€¢ Statistical design â€¢ Site analytics</p>

      <div style={S.tabs}>
        {TABS.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {error && <div style={S.err}>âš ï¸ {error}</div>}

      {/* â•â•â• SEARCH â•â•â• */}
      {tab === 'search' && (<>
        <div style={S.card}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input style={{ ...S.input, flex: 2, minWidth: 200 }} placeholder="Search trialsâ€¦" value={sq} onChange={e => setSq(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} />
            <select style={{ ...S.input, maxWidth: 120 }} value={sTarget} onChange={e => setSTarget(e.target.value)}><option value="">All targets</option>{['CD19','BCMA','HER2','MSLN','GPC3','DLL3','EGFR','PSMA','GPRC5D','CD47'].map(g => <option key={g}>{g}</option>)}</select>
            <select style={{ ...S.input, maxWidth: 120 }} value={sPhase} onChange={e => setSPhase(e.target.value)}><option value="">All phases</option>{['Phase 1','Phase 1/Phase 2','Phase 2','Phase 3'].map(p => <option key={p}>{p}</option>)}</select>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={doSearch} disabled={loading}>{loading ? 'â³' : 'ðŸ” Search'}</button>
          </div>
        </div>
        {searchRes && (<>
          <div style={S.statG}><div style={S.stat('#f59e0b')}><span style={S.sv}>{searchRes.total_results}</span><span style={S.sl}>Results</span></div></div>
          {searchRes.trials?.map((t: any) => (
            <div key={t.nct_id} style={{ ...S.card, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>
                <span style={{ color: '#fbbf24', marginRight: 6 }}>{t.nct_id}</span>{t.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t.sponsor} â€¢ {t.enrollment} enrolled</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={S.badge('#f59e0b')}>{t.target_antigen}</span>
                <span style={S.badge('#3b82f6')}>{t.phase}</span>
                <span style={S.badge(t.status?.includes('Recruiting') ? '#22c55e' : '#94a3b8')}>{t.status}</span>
              </div>
            </div>
          ))}
        </>)}
      </>)}

      {/* â•â•â• MATCH â•â•â• */}
      {tab === 'match' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>ðŸ§¬ Patient Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Age<input type="number" style={S.input} value={mAge} onChange={e => setMAge(+e.target.value)} /></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancer<select style={S.input} value={mCancer} onChange={e => setMCancer(e.target.value)}>{['DLBCL','ALL','MM','NSCLC','BREAST','GBM','PROSTATE','RENAL'].map(c => <option key={c}>{c}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>ECOG<select style={S.input} value={mEcog} onChange={e => setMEcog(+e.target.value)}>{[0,1,2,3].map(e => <option key={e} value={e}>ECOG {e}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prior Lines<input type="number" style={S.input} value={mPrior} onChange={e => setMPrior(+e.target.value)} /></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Antigens<input style={S.input} value={mTargets} onChange={e => setMTargets(e.target.value)} /></label>
          </div>
          <button style={{ ...S.btn, marginTop: 14 }} onClick={doMatch} disabled={loading}>{loading ? 'â³' : 'ðŸ§¬ Match'}</button>
        </div>
        {matchRes && (<>
          <div style={S.statG}>
            <div style={S.stat('#22c55e')}><span style={S.sv}>{matchRes.total_matches}</span><span style={S.sl}>Matches</span></div>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{matchRes.eligible_count}</span><span style={S.sl}>Eligible</span></div>
          </div>
          {matchRes.matches?.map((m: any) => (
            <div key={m.nct_id} style={{ ...S.card, padding: 14, borderLeft: `3px solid ${m.eligible ? '#22c55e' : '#ef4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div><span style={{ fontWeight: 800, color: '#fbbf24', fontSize: 16, marginRight: 8 }}>#{m.rank}</span><span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{m.title}</span></div>
                <span style={S.badge(m.eligible ? '#22c55e' : '#ef4444')}>{m.eligible ? 'Eligible' : 'Ineligible'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={S.badge('#f59e0b')}>{m.target}</span><span style={S.badge('#3b82f6')}>{m.phase}</span>
                <span style={S.badge('#06b6d4')}>Score: {(m.overall_score * 100).toFixed(0)}%</span>
              </div>
              <Pct val={m.overall_score} color="#f59e0b" />
              {m.dimensions && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, color: '#fbbf24', cursor: 'pointer', fontWeight: 600 }}>Score Breakdown</summary>
                  {m.dimensions.map((d: any, i: number) => (
                    <div key={i} style={{ fontSize: 11, padding: '4px 0', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{d.dimension.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: 700, color: d.score >= 0.7 ? '#22c55e' : d.score >= 0.4 ? '#f59e0b' : '#ef4444' }}>{(d.score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </details>
              )}
            </div>
          ))}
        </>)}
      </>)}

      {/* â•â•â• PREDICT â•â•â• */}
      {tab === 'predict' && (<>
        <div style={S.card}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="NCT ID" value={pNct} onChange={e => setPNct(e.target.value)} />
            <button style={S.btn} onClick={doPredict} disabled={loading}>{loading ? 'â³' : 'ðŸ“Š Predict'}</button>
          </div>
        </div>
        {predRes && !predRes.error && (<>
          <div style={S.card}>
            <h3 style={S.sTitle}>ðŸ“Š {predRes.title}</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={S.badge('#f59e0b')}>{predRes.target}</span><span style={S.badge('#3b82f6')}>{predRes.phase}</span>
              <span style={S.badge('#a855f7')}>{predRes.disease}</span>
            </div>
          </div>
          <div style={S.card}>
            <h3 style={S.sTitle}>ðŸ’Š Response</h3>
            <div style={S.statG}>
              <div style={S.stat('#22c55e')}><span style={S.sv}>{(predRes.response.overall_response_rate * 100).toFixed(0)}%</span><span style={S.sl}>ORR</span></div>
              <div style={S.stat('#06b6d4')}><span style={S.sv}>{(predRes.response.complete_response_rate * 100).toFixed(0)}%</span><span style={S.sl}>CR</span></div>
              <div style={S.stat('#a855f7')}><span style={S.sv}>{(predRes.response.partial_response_rate * 100).toFixed(0)}%</span><span style={S.sl}>PR</span></div>
            </div>
          </div>
          <div style={S.card}>
            <h3 style={S.sTitle}>ðŸ“ˆ Survival</h3>
            <div style={S.statG}>
              <div style={S.stat('#22c55e')}><span style={S.sv}>{predRes.survival.median_pfs_months ?? 'NR'}</span><span style={S.sl}>mPFS (mo)</span></div>
              <div style={S.stat('#06b6d4')}><span style={S.sv}>{predRes.survival.median_os_months ?? 'NR'}</span><span style={S.sl}>mOS (mo)</span></div>
              <div style={S.stat('#f59e0b')}><span style={S.sv}>{predRes.survival.median_dor_months ?? 'NR'}</span><span style={S.sl}>mDOR (mo)</span></div>
            </div>
          </div>
        </>)}
      </>)}

      {/* â•â•â• STRATIFY â•â•â• */}
      {tab === 'stratify' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>ðŸ“‹ Risk Stratification</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancer<select style={S.input} value={sCancer} onChange={e => setSCancer(e.target.value)}>{['DLBCL','ALL','MM','NSCLC','MCL'].map(c => <option key={c}>{c}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Age<input type="number" style={S.input} value={sAge} onChange={e => setSAge(+e.target.value)} /></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stage<select style={S.input} value={sStage} onChange={e => setSStage(e.target.value)}>{['I','II','III','IV'].map(s => <option key={s}>{s}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>ECOG<select style={S.input} value={sEcog} onChange={e => setSEcog(+e.target.value)}>{[0,1,2,3].map(e => <option key={e} value={e}>{e}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={sLdh} onChange={e => setSLdh(e.target.checked)} />LDH Elevated</label>
          </div>
          <button style={{ ...S.btn, marginTop: 14 }} onClick={doStratify} disabled={loading}>{loading ? 'â³' : 'ðŸ“‹ Stratify'}</button>
        </div>
        {stratRes && (
          <div style={S.card}>
            <h3 style={S.sTitle}>ðŸ“Š {stratRes.risk_model || 'Risk Assessment'}</h3>
            <div style={S.statG}>
              <div style={S.stat(riskColor(stratRes.risk_group))}>
                <span style={S.sv}>{stratRes.risk_group?.replace(/_/g, ' ').toUpperCase()}</span><span style={S.sl}>Risk Group</span>
              </div>
              <div style={S.stat('#f59e0b')}><span style={S.sv}>{stratRes.risk_score}/{stratRes.max_score || 5}</span><span style={S.sl}>Score</span></div>
              {stratRes.predicted_car_t_response && (<>
                <div style={S.stat('#22c55e')}><span style={S.sv}>{(stratRes.predicted_car_t_response.CR_rate * 100).toFixed(0)}%</span><span style={S.sl}>Pred CR</span></div>
                <div style={S.stat('#06b6d4')}><span style={S.sv}>{(stratRes.predicted_car_t_response.ORR * 100).toFixed(0)}%</span><span style={S.sl}>Pred ORR</span></div>
              </>)}
            </div>
            {stratRes.factors_present?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Risk Factors Present:</div>
                {stratRes.factors_present.map((f: string, i: number) => (
                  <span key={i} style={{ ...S.badge('#ef4444'), marginRight: 6, marginBottom: 4 }}>{f}</span>
                ))}
              </div>
            )}
            {stratRes.trial_arm_recommendation && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#fbbf24', padding: 10, background: 'rgba(245,158,11,0.08)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)' }}>
                ðŸ’¡ <strong>Arm:</strong> {stratRes.trial_arm_recommendation}
              </div>
            )}
          </div>
        )}
      </>)}

      {/* â•â•â• PROTOCOL â•â•â• */}
      {tab === 'protocol' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>ðŸ“ Protocol Generator</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Indication<select style={S.input} value={pIndication} onChange={e => setPIndication(e.target.value)}>{['DLBCL','ALL','MM','MCL','NSCLC'].map(c => <option key={c}>{c}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target<select style={S.input} value={pTarget} onChange={e => setPTarget(e.target.value)}>{['CD19','BCMA','CD22','GPRC5D','HER2','MSLN'].map(c => <option key={c}>{c}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phase<select style={S.input} value={pPhase} onChange={e => setPPhase(e.target.value)}>{['Phase 1','Phase 1/2','Phase 2','Phase 3'].map(c => <option key={c}>{c}</option>)}</select></label>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Costim<select style={S.input} value={pCostim} onChange={e => setPCostim(e.target.value)}>{['4-1BB','CD28','ICOS'].map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <button style={{ ...S.btn, marginTop: 14 }} onClick={doProtocol} disabled={loading}>{loading ? 'â³' : 'ðŸ“ Generate Protocol'}</button>
        </div>
        {protoRes && (<>
          <div style={S.card}>
            <h3 style={S.sTitle}>ðŸ“„ {protoRes.protocol_id}</h3>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 12 }}>{protoRes.title}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={S.badge('#f59e0b')}>{protoRes.synopsis?.study_phase}</span>
              <span style={S.badge('#3b82f6')}>{protoRes.synopsis?.planned_enrollment} patients</span>
              <span style={S.badge('#22c55e')}>{protoRes.car_construct?.costimulation || pCostim}</span>
            </div>
          </div>
          {protoRes.dose_levels?.length > 0 && (
            <div style={S.card}>
              <h3 style={S.sTitle}>ðŸ’Š Dose Levels</h3>
              <table style={S.table}><thead><tr><th style={S.th}>Level</th><th style={S.th}>Dose</th><th style={S.th}>Rationale</th></tr></thead>
                <tbody>{protoRes.dose_levels.map((d: any, i: number) => (
                  <tr key={i}><td style={S.td}><span style={S.badge('#f59e0b')}>DL{d.level || i + 1}</span></td><td style={{ ...S.td, fontWeight: 700 }}>{d.dose}</td><td style={{ ...S.td, fontSize: 11, color: 'var(--text-muted)' }}>{d.rationale}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {protoRes.statistical_considerations && (
            <div style={S.card}>
              <h3 style={S.sTitle}>ðŸ“Š Statistical Design</h3>
              <div style={S.statG}>
                <div style={S.stat('#a855f7')}><span style={S.sv}>{protoRes.statistical_considerations.primary_analysis?.total_n || 'â€”'}</span><span style={S.sl}>Total N</span></div>
                <div style={S.stat('#f59e0b')}><span style={S.sv}>{protoRes.statistical_considerations.primary_analysis?.one_sided_alpha || 'â€”'}</span><span style={S.sl}>Alpha</span></div>
                <div style={S.stat('#22c55e')}><span style={S.sv}>{protoRes.statistical_considerations.primary_analysis?.power || 'â€”'}</span><span style={S.sl}>Power</span></div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{protoRes.statistical_considerations.primary_analysis?.design}</div>
            </div>
          )}
          {protoRes.endpoints && (
            <div style={S.card}>
              <h3 style={S.sTitle}>ðŸŽ¯ Endpoints</h3>
              {['primary', 'key_secondary', 'safety'].map(cat => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cat === 'primary' ? '#22c55e' : cat === 'safety' ? '#ef4444' : '#06b6d4', textTransform: 'uppercase', marginBottom: 4 }}>{cat.replace(/_/g, ' ')}</div>
                  {protoRes.endpoints[cat]?.map((ep: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-primary)', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <strong>{ep.name}</strong> â€” <span style={{ color: 'var(--text-muted)' }}>{ep.definition}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>)}
      </>)}

      {/* â•â•â• SITES â•â•â• */}
      {tab === 'sites' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>ðŸŒ Global CAR-T Site Network</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <select style={{ ...S.input, maxWidth: 180 }} value={siteRegion} onChange={e => setSiteRegion(e.target.value)}>
              <option value="">All Regions</option><option value="US">North America</option><option value="EU">Europe</option><option value="ASIA">Asia-Pacific</option>
            </select>
            <button style={S.btn} onClick={doSites} disabled={loading}>{loading ? 'â³' : 'ðŸŒ Load Sites'}</button>
          </div>
        </div>
        {sitesRes && (<>
          <div style={S.statG}>
            <div style={S.stat('#f59e0b')}><span style={S.sv}>{sitesRes.total_sites}</span><span style={S.sl}>Sites</span></div>
            <div style={S.stat('#22c55e')}><span style={S.sv}>{sitesRes.total_annual_patients}</span><span style={S.sl}>Annual Patients</span></div>
            <div style={S.stat('#06b6d4')}><span style={S.sv}>{sitesRes.rems_certified_pct}%</span><span style={S.sl}>REMS Cert</span></div>
            <div style={S.stat('#a855f7')}><span style={S.sv}>{sitesRes.countries?.length}</span><span style={S.sl}>Countries</span></div>
          </div>
          <div style={S.card}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Site</th><th style={S.th}>City</th><th style={S.th}>Country</th><th style={S.th}>Patients/yr</th><th style={S.th}>Tier</th><th style={S.th}>ICU</th></tr></thead>
              <tbody>{sitesRes.sites?.map((s: any) => (
                <tr key={s.site_id}>
                  <td style={{ ...S.td, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</td>
                  <td style={S.td}>{s.city}</td><td style={S.td}>{s.country}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: '#22c55e' }}>{s.annual_patients}</td>
                  <td style={S.td}><span style={S.badge(s.tier === 'academic_medical_center' ? '#a855f7' : '#06b6d4')}>{s.tier?.replace(/_/g, ' ')}</span></td>
                  <td style={S.td}>{s.icu_beds} beds</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>)}
      </>)}

      {/* â•â•â• JOURNEY â•â•â• */}
      {tab === 'journey' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>ðŸš¶ Patient Journey Simulator</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>Simulate a patient's full journey from referral to long-term follow-up in a CAR-T clinical trial.</p>
          <button style={S.btn} onClick={doJourney} disabled={loading}>{loading ? 'â³' : 'ðŸš¶ Simulate Journey'}</button>
        </div>
        {journeyRes && (<>
          <div style={S.statG}>
            <div style={S.stat(journeyRes.screen_passed ? '#22c55e' : '#ef4444')}>
              <span style={S.sv}>{journeyRes.screen_passed ? 'âœ… Enrolled' : 'âŒ Screen Fail'}</span><span style={S.sl}>Outcome</span>
            </div>
            <div style={S.stat('#f59e0b')}><span style={S.sv}>{journeyRes.total_days}</span><span style={S.sl}>Total Days</span></div>
            <div style={S.stat('#a855f7')}><span style={S.sv}>{journeyRes.journey?.length}</span><span style={S.sl}>Stages</span></div>
          </div>
          <div style={S.card}>
            <h3 style={S.sTitle}>ðŸ“… Journey Timeline</h3>
            {journeyRes.journey?.map((stage: any, i: number) => {
              const color = stage.status === 'completed' ? '#22c55e' : stage.status === 'screen_failure' ? '#ef4444' : '#94a3b8';
              const pctOfTotal = (stage.duration_days / Math.max(journeyRes.total_days, 1)) * 100;
              return (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{stage.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Day {stage.start_day}-{stage.end_day}</span>
                      <span style={S.badge(color)}>{stage.duration_days}d</span>
                    </div>
                  </div>
                  <div style={S.progressBar}><div style={S.progressFill(pctOfTotal, color)} /></div>
                  {stage.failure_reason && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>âŒ {stage.failure_reason}</div>}
                </div>
              );
            })}
          </div>
          {journeyRes.quality_of_life?.length > 0 && (
            <div style={S.card}>
              <h3 style={S.sTitle}>ðŸ’š Quality of Life (FACT-Lym)</h3>
              <div style={{ display: 'flex', alignItems: 'end', gap: 2, height: 120 }}>
                {journeyRes.quality_of_life.map((qol: any, i: number) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${qol.FACT_Lym_score}%`, background: `linear-gradient(180deg, ${qol.FACT_Lym_score > 60 ? '#22c55e' : qol.FACT_Lym_score > 40 ? '#f59e0b' : '#ef4444'}, transparent)`, borderRadius: '3px 3px 0 0', minHeight: 2, transition: 'height 0.3s ease' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>Month 0</span><span>Month 6</span><span>Month 12</span><span>Month 18</span><span>Month 24</span>
              </div>
            </div>
          )}
        </>)}
      </>)}
    </div>
  );
}


