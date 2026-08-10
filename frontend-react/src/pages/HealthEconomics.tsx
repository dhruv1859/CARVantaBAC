import { useState, useRef, useEffect } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

/* ═══════════════════════════════════════════════════════════════════════ */
/* Styles                                                                */
/* ═══════════════════════════════════════════════════════════════════════ */

const C = {
    card: 'rgba(30,41,59,0.6)', border: 'rgba(148,163,184,0.12)',
    a1: '#10b981', a2: '#06b6d4', a3: '#f59e0b', a4: '#8b5cf6', a5: '#ef4444', a6: '#3b82f6',
    muted: '#94a3b8', text: '#f1f5f9',
};

const S = {
    page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter',system-ui,sans-serif" } as React.CSSProperties,
    h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg,#10b981,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' as const },
    sub: { fontSize: 14, color: C.muted, margin: '0 0 24px', textAlign: 'center' as const },
    tabs: { display: 'flex', gap: 4, marginBottom: 24, background: `var(--bg-card,${C.card})`, border: `1px solid var(--border-color,${C.border})`, borderRadius: 14, padding: 5, flexWrap: 'wrap' as const } as React.CSSProperties,
    tab: (a: boolean) => ({ flex: '0 0 auto', padding: '10px 14px', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', background: a ? 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.15))' : 'transparent', color: a ? '#34d399' : C.muted }) as React.CSSProperties,
    card: { background: `var(--bg-card,${C.card})`, border: `1px solid var(--border-color,${C.border})`, borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
    sTitle: { fontSize: 16, fontWeight: 700, color: `var(--text-primary,${C.text})`, margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.1)' } as React.CSSProperties,
    input: { background: 'var(--bg-input,rgba(15,23,42,0.6))', border: `1px solid var(--border-color,${C.border})`, color: `var(--text-primary,${C.text})`, padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' as const },
    btn: { background: `linear-gradient(135deg,${C.a1},${C.a2})`, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
    badge: (c: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, display: 'inline-block' }),
    err: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
    statG: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
    stat: (a: string) => ({ background: `linear-gradient(135deg,${a}10,${a}05)`, border: `1px solid ${a}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }),
    sv: { fontSize: 18, fontWeight: 800, color: `var(--text-primary,${C.text})`, display: 'block' },
    sl: { fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginTop: 4, display: 'block' },
};

type Tab = 'cost' | 'icer' | 'market' | 'qaly' | 'manufacturing' | 'budget' | 'breakeven' | 'outcomes' | 'platforms';

/* ═══════════════════════════════════════════════════════════════════════ */
/* Bar Chart Component                                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

const HorizBar = ({ items, color = C.a1 }: { items: { label: string; value: number }[]; color?: string }) => {
    const maxV = Math.max(...items.map(i => i.value), 0.001);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {items.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 140, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 4, height: 18, overflow: 'hidden' }}>
                        <div style={{ width: `${(d.value / maxV) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ width: 70, textAlign: 'right', color, fontFamily: 'monospace', fontSize: 11 }}>
                        {d.value >= 1e6 ? `$${(d.value/1e6).toFixed(1)}M` : d.value >= 1e3 ? `$${(d.value/1e3).toFixed(0)}K` : d.value < 1 ? (d.value * 100).toFixed(1) + '%' : `$${d.value.toFixed(0)}`}
                    </span>
                </div>
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════ */
/* Main Component                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function HealthEconomics() {
    const [tab, setTab] = useState<Tab>('cost');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* Core results */
    const [costRes, setCostRes] = useState<any>(null);
    const [icerRes, setIcerRes] = useState<any>(null);
    const [htaRes, setHtaRes] = useState<any>(null);
    const [markovRes, setMarkovRes] = useState<any>(null);

    /* New module results */
    const [mfgRes, setMfgRes] = useState<any>(null);
    const [budgetRes, setBudgetRes] = useState<any>(null);
    const [breakEvenRes, setBreakEvenRes] = useState<any>(null);
    const [outcomesRes, setOutcomesRes] = useState<any>(null);
    const [platformRes, setPlatformRes] = useState<any>(null);
    const [learningRes, setLearningRes] = useState<any>(null);
    const [valueRes, setValueRes] = useState<any>(null);
    const [regionRes, setRegionRes] = useState<any>(null);

    /* Params */
    const [product, setProduct] = useState('tisagenlecleucel');
    const [country, setCountry] = useState('US');
    const [target, setTarget] = useState('cd19');
    const [platform, setPlatform] = useState('lentiviral');
    const [facility, setFacility] = useState('centralized_large');
    const [eligiblePatients, setEligiblePatients] = useState(500);
    const [adoptionRate, setAdoptionRate] = useState(0.15);
    const [cartCost, setCartCost] = useState(475000);
    const [socAnnualCost, setSocAnnualCost] = useState(45000);

    const apiCall = async (url: string, opts?: RequestInit) => {
        setLoading(true); setError('');
        try { const r = await fetch(`${API}${url}`, opts); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
        catch (e: any) { setError(e.message); return null; } finally { setLoading(false); }
    };

    const post = (url: string, body: any) => apiCall(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    /* Core actions */
    const calcCost = async () => { const d = await post('/api/v5/health-econ/treatment-cost', { product, target, country }); if (d) setCostRes(d); };
    const calcICER = async () => { const d = await post('/api/v5/health-econ/icer', { product, target, country }); if (d) setIcerRes(d); };
    const loadHTA = async () => { const d = await apiCall('/api/v5/health-econ/hta-landscape'); if (d) setHtaRes(d); };
    const runMarkov = async () => { const d = await post('/api/v5/health-econ/compare-treatments', {}); if (d) setMarkovRes(d); };

    /* New actions */
    const calcMfg = async () => { const d = await post('/api/v5/health-econ/manufacturing-cost', { platform, facility, country, include_clinical: true }); if (d) setMfgRes(d); };
    const calcBudget = async () => { const d = await post('/api/v5/health-econ/budget-impact', { product, target, eligible_patients: eligiblePatients, adoption_rate_year1: adoptionRate, country }); if (d) setBudgetRes(d); };
    const calcBreakEven = async () => { const d = await post('/api/v5/health-econ/break-even', { cart_cost: cartCost, soc_annual_cost: socAnnualCost, cart_os_years: 5.0, soc_os_years: 1.5, discount_rate: 0.03 }); if (d) setBreakEvenRes(d); };
    const calcOutcomes = async () => { const d = await post('/api/v5/health-econ/outcomes-contract', { product, n_patients: 100, response_threshold_months: 1 }); if (d) setOutcomesRes(d); };
    const comparePlatforms = async () => { const d = await apiCall(`/api/v5/health-econ/compare-platforms?country=${country}`); if (d) setPlatformRes(d); };
    const calcLearning = async () => { const d = await post('/api/v5/health-econ/learning-curve', { initial_cost: 373000, learning_rate: 0.85, target_patients: 5000 }); if (d) setLearningRes(d); };
    const calcValue = async () => { const d = await post('/api/v5/health-econ/value-price-corridor', { qaly_gain: 3.5, wtp_low: 50000, wtp_high: 200000, comparator_cost: 150000 }); if (d) setValueRes(d); };
    const compareRegions = async () => { const d = await apiCall(`/api/v5/health-econ/compare-regions?platform=${platform}`); if (d) setRegionRes(d); };

    const fmt = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n.toFixed(0)}`;

    /* Tab config */
    const tabItems: { id: Tab; label: string }[] = [
        { id: 'cost', label: '💵 Treatment Cost' },
        { id: 'icer', label: '📊 ICER Analysis' },
        { id: 'market', label: '🌍 HTA Landscape' },
        { id: 'qaly', label: '📈 QALY Model' },
        { id: 'manufacturing', label: '🏭 Manufacturing' },
        { id: 'budget', label: '💰 Budget Impact' },
        { id: 'breakeven', label: '⚖️ Break-Even' },
        { id: 'outcomes', label: '📋 Outcomes Contract' },
        { id: 'platforms', label: '🔬 Platform Compare' },
    ];

    return (
        <div style={S.page}>
            <h1 style={S.h1}>💰 Health Economics Engine</h1>
            <p style={S.sub}>Cost-Effectiveness • Manufacturing • Budget Impact • Market Access • QALY Modeling</p>

            <div style={S.tabs}>
                {tabItems.map(t => (
                    <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
            </div>

            {error && <div style={S.err}>⚠️ {error}</div>}

            {/* Shared product/country controls */}
            {['cost', 'icer', 'budget', 'outcomes'].includes(tab) && (
                <div style={S.card}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <select style={{ ...S.input, maxWidth: 200 }} value={product} onChange={e => setProduct(e.target.value)}>
                            <option value="tisagenlecleucel">Kymriah</option><option value="axicabtagene">Yescarta</option>
                            <option value="idecabtagene">Abecma</option><option value="ciltacabtagene">Carvykti</option>
                        </select>
                        <select style={{ ...S.input, maxWidth: 100 }} value={target} onChange={e => setTarget(e.target.value)}>
                            <option value="cd19">CD19</option><option value="bcma">BCMA</option>
                        </select>
                        <select style={{ ...S.input, maxWidth: 120 }} value={country} onChange={e => setCountry(e.target.value)}>
                            {['US','UK','Germany','Japan','Canada','Australia','France','Switzerland'].map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={tab === 'cost' ? calcCost : tab === 'icer' ? calcICER : tab === 'budget' ? calcBudget : calcOutcomes} disabled={loading}>
                            {loading ? '⏳' : { cost: '💵 Calculate', icer: '📊 Analyze', budget: '💰 Budget Impact', outcomes: '📋 Simulate' }[tab]}
                        </button>
                    </div>
                    {tab === 'budget' && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <label style={{ fontSize: 12, color: C.muted }}>Eligible Patients:
                                <input type="number" value={eligiblePatients} onChange={e => setEligiblePatients(+e.target.value)} style={{ ...S.input, maxWidth: 100, marginLeft: 6 }} />
                            </label>
                            <label style={{ fontSize: 12, color: C.muted }}>Adoption Rate Y1:
                                <input type="number" step="0.05" value={adoptionRate} onChange={e => setAdoptionRate(+e.target.value)} style={{ ...S.input, maxWidth: 80, marginLeft: 6 }} />
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* ── COST ──────────────────────────────────────────────── */}
            {tab === 'cost' && costRes && (<>
                <div style={S.statG}>
                    <div style={S.stat(C.a1)}><span style={S.sv}>{fmt(costRes.total_cost)}</span><span style={S.sl}>Total Cost</span></div>
                    {Object.entries(costRes.category_breakdown || {}).map(([k, v]) => (
                        <div key={k} style={S.stat(C.a2)}><span style={S.sv}>{fmt(v as number)}</span><span style={S.sl}>{k.replace(/_/g, ' ')}</span></div>
                    ))}
                </div>
                <div style={S.card}>
                    <h3 style={S.sTitle}>📋 Itemized Breakdown</h3>
                    {Object.entries(costRes.itemized || {}).map(([name, item]: any) => (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.06)', fontSize: 12 }}>
                            <span style={{ color: C.muted }}>{name}</span>
                            <span style={{ fontWeight: 700, color: '#34d399' }}>{fmt(item.cost)}</span>
                        </div>
                    ))}
                </div>
            </>)}

            {/* ── ICER ──────────────────────────────────────────────── */}
            {tab === 'icer' && icerRes && (<>
                <div style={S.statG}>
                    <div style={S.stat(C.a3)}><span style={S.sv}>{fmt(icerRes.icer_per_qaly)}</span><span style={S.sl}>ICER/QALY</span></div>
                    <div style={S.stat(C.a1)}><span style={S.sv}>{fmt(icerRes.cart_cost)}</span><span style={S.sl}>CAR-T Cost</span></div>
                    <div style={S.stat(C.a2)}><span style={S.sv}>{fmt(icerRes.comparator_cost)}</span><span style={S.sl}>SOC Cost</span></div>
                    <div style={S.stat(C.a4)}><span style={S.sv}>{icerRes.incremental_qalys?.toFixed(2)}</span><span style={S.sl}>Δ QALYs</span></div>
                </div>
                <div style={S.card}>
                    <h3 style={S.sTitle}>💡 Cost-Effectiveness at WTP Thresholds</h3>
                    {Object.entries(icerRes.cost_effective_at || {}).map(([k, v]: any) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                            <span style={{ color: C.muted }}>{k.replace(/_/g, ' ')}</span>
                            <span style={S.badge(v ? '#22c55e' : '#ef4444')}>{v ? '✅ Cost-Effective' : '❌ Not CE'}</span>
                        </div>
                    ))}
                </div>
            </>)}

            {/* ── HTA ──────────────────────────────────────────────── */}
            {tab === 'market' && (<>
                <div style={S.card}><button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={loadHTA} disabled={loading}>{loading ? '⏳' : '🌍 Load HTA Landscape'}</button></div>
                {htaRes && htaRes.decisions?.map((d: any, i: number) => (
                    <div key={i} style={{ ...S.card, padding: 14, borderLeft: `3px solid ${d.decision.includes('Approved') ? '#22c55e' : C.a3}` }}>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 4 }}>{d.product}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{d.body} • {d.country} • {d.date}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <span style={S.badge(d.decision.includes('Approved') ? '#22c55e' : C.a3)}>{d.decision}</span>
                            <span style={S.badge(C.a6)}>{d.indication}</span>
                            {d.icer && <span style={S.badge(C.a4)}>ICER: {fmt(d.icer)}/QALY</span>}
                        </div>
                    </div>
                ))}
            </>)}

            {/* ── QALY ─────────────────────────────────────────────── */}
            {tab === 'qaly' && (<>
                <div style={S.card}><button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={runMarkov} disabled={loading}>{loading ? '⏳' : '📈 Run Markov Model'}</button></div>
                {markovRes && (<>
                    <div style={S.statG}>
                        <div style={S.stat(C.a1)}><span style={S.sv}>{markovRes.cart?.total_qalys?.toFixed(2)}</span><span style={S.sl}>CAR-T QALYs</span></div>
                        <div style={S.stat(C.a5)}><span style={S.sv}>{markovRes.soc?.total_qalys?.toFixed(2)}</span><span style={S.sl}>SOC QALYs</span></div>
                        <div style={S.stat(C.a3)}><span style={S.sv}>{fmt(markovRes.icer || 0)}</span><span style={S.sl}>ICER/QALY</span></div>
                        <div style={S.stat(C.a4)}><span style={S.sv}>{markovRes.incremental_qalys?.toFixed(2)}</span><span style={S.sl}>Δ QALYs</span></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {['cart', 'soc'].map(arm => (
                            <div key={arm} style={S.card}>
                                <h3 style={S.sTitle}>{arm === 'cart' ? '🧬 CAR-T' : '💊 SOC'}</h3>
                                <div style={{ fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>Total Cost</span><span style={{ fontWeight: 700, color: '#34d399' }}>{fmt(markovRes[arm]?.total_cost_with_upfront || 0)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>Life Years</span><span style={{ fontWeight: 700 }}>{markovRes[arm]?.total_life_years?.toFixed(2)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>Alive at 5yr</span><span style={{ fontWeight: 700 }}>{markovRes[arm]?.final_alive_pct}%</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>CR at 5yr</span><span style={{ fontWeight: 700, color: C.a2 }}>{markovRes[arm]?.final_cr_pct}%</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={S.card}>
                        <h3 style={S.sTitle}>💰 Net Monetary Benefit</h3>
                        <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                            <div>At $100K WTP: <strong style={{ color: markovRes.net_monetary_benefit_100k >= 0 ? '#22c55e' : C.a5 }}>{fmt(markovRes.net_monetary_benefit_100k)}</strong></div>
                            <div>At $150K WTP: <strong style={{ color: markovRes.net_monetary_benefit_150k >= 0 ? '#22c55e' : C.a5 }}>{fmt(markovRes.net_monetary_benefit_150k)}</strong></div>
                        </div>
                    </div>
                </>)}
            </>)}

            {/* ── MANUFACTURING ─────────────────────────────────────── */}
            {tab === 'manufacturing' && (<>
                <div style={S.card}>
                    <h3 style={S.sTitle}>🏭 Manufacturing Cost Estimator</h3>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                        <select style={{ ...S.input, maxWidth: 160 }} value={platform} onChange={e => setPlatform(e.target.value)}>
                            <option value="lentiviral">Lentiviral</option><option value="retroviral">Retroviral</option>
                            <option value="mrna">mRNA</option><option value="transposon">Transposon</option>
                        </select>
                        <select style={{ ...S.input, maxWidth: 200 }} value={facility} onChange={e => setFacility(e.target.value)}>
                            <option value="centralized_large">Centralized Large</option><option value="centralized_small">Centralized Small</option>
                            <option value="decentralized_hospital">Hospital-Based</option><option value="pod_based">Pod/Modular</option>
                        </select>
                        <select style={{ ...S.input, maxWidth: 100 }} value={country} onChange={e => setCountry(e.target.value)}>
                            {['US','EU','CN','IN','JP','KR','UK','BR'].map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={calcMfg} disabled={loading}>{loading ? '⏳' : '🏭 Estimate'}</button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ ...S.btn, background: 'linear-gradient(135deg,#f59e0b,#f97316)', fontSize: 12, padding: '8px 16px' }} onClick={calcLearning}>📉 Learning Curve</button>
                        <button style={{ ...S.btn, background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', fontSize: 12, padding: '8px 16px' }} onClick={calcValue}>💎 Value Corridor</button>
                        <button style={{ ...S.btn, background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', fontSize: 12, padding: '8px 16px' }} onClick={compareRegions}>🌍 Regional Compare</button>
                    </div>
                </div>
                {mfgRes && (<>
                    <div style={S.statG}>
                        <div style={S.stat(C.a1)}><span style={S.sv}>{fmt(mfgRes.total_cost_per_dose || 0)}</span><span style={S.sl}>Cost/Dose</span></div>
                        <div style={S.stat(C.a2)}><span style={S.sv}>{mfgRes.platform}</span><span style={S.sl}>Platform</span></div>
                        <div style={S.stat(C.a3)}><span style={S.sv}>{mfgRes.facility}</span><span style={S.sl}>Facility</span></div>
                        <div style={S.stat(C.a4)}><span style={S.sv}>{mfgRes.regional_multiplier?.toFixed(2)}x</span><span style={S.sl}>Region Factor</span></div>
                    </div>
                    {mfgRes.step_costs && (
                        <div style={S.card}>
                            <h3 style={S.sTitle}>📋 Manufacturing Steps</h3>
                            <HorizBar items={Object.entries(mfgRes.step_costs).map(([k, v]: any) => ({ label: k.replace(/_/g, ' '), value: v }))} color={C.a1} />
                        </div>
                    )}
                </>)}
                {learningRes && (
                    <div style={S.card}>
                        <h3 style={S.sTitle}>📉 Learning Curve Projection</h3>
                        <div style={S.statG}>
                            <div style={S.stat(C.a3)}><span style={S.sv}>{fmt(learningRes.initial_cost || 0)}</span><span style={S.sl}>Initial Cost</span></div>
                            <div style={S.stat(C.a1)}><span style={S.sv}>{fmt(learningRes.cost_at_target || 0)}</span><span style={S.sl}>At Target Vol</span></div>
                            <div style={S.stat(C.a2)}><span style={S.sv}>{learningRes.cost_reduction_pct?.toFixed(1)}%</span><span style={S.sl}>Cost Reduction</span></div>
                        </div>
                        {learningRes.milestones && (
                            <HorizBar items={learningRes.milestones.map((m: any) => ({ label: `${m.patients} patients`, value: m.cost }))} color={C.a3} />
                        )}
                    </div>
                )}
                {valueRes && (
                    <div style={S.card}>
                        <h3 style={S.sTitle}>💎 Value-Based Price Corridor</h3>
                        <div style={S.statG}>
                            <div style={S.stat(C.a6)}><span style={S.sv}>{fmt(valueRes.floor_price || 0)}</span><span style={S.sl}>Floor</span></div>
                            <div style={S.stat(C.a4)}><span style={S.sv}>{fmt(valueRes.ceiling_price || 0)}</span><span style={S.sl}>Ceiling</span></div>
                            <div style={S.stat(C.a1)}><span style={S.sv}>{fmt(valueRes.recommended_price || 0)}</span><span style={S.sl}>Recommended</span></div>
                        </div>
                    </div>
                )}
                {regionRes && regionRes.regions && (
                    <div style={S.card}>
                        <h3 style={S.sTitle}>🌍 Regional Cost Comparison</h3>
                        <HorizBar items={regionRes.regions.map((r: any) => ({ label: r.country || r.region, value: r.cost_per_dose || r.total_cost || 0 }))} color={C.a6} />
                    </div>
                )}
            </>)}

            {/* ── BUDGET IMPACT ─────────────────────────────────────── */}
            {tab === 'budget' && budgetRes && (<>
                <div style={S.statG}>
                    <div style={S.stat(C.a1)}><span style={S.sv}>{fmt(budgetRes.total_budget_impact || 0)}</span><span style={S.sl}>Total Impact</span></div>
                    <div style={S.stat(C.a2)}><span style={S.sv}>{budgetRes.patients_treated_year1 || 0}</span><span style={S.sl}>Patients Y1</span></div>
                    <div style={S.stat(C.a3)}><span style={S.sv}>{budgetRes.patients_treated_cumulative || 0}</span><span style={S.sl}>Cumulative</span></div>
                    <div style={S.stat(C.a4)}><span style={S.sv}>{fmt(budgetRes.cost_per_patient || 0)}</span><span style={S.sl}>Cost/Patient</span></div>
                </div>
                {budgetRes.yearly_breakdown && (
                    <div style={S.card}>
                        <h3 style={S.sTitle}>📊 Yearly Budget Breakdown</h3>
                        {budgetRes.yearly_breakdown.map((y: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(148,163,184,0.06)', fontSize: 12 }}>
                                <span style={{ color: C.muted }}>Year {y.year}</span>
                                <span style={{ color: C.a2 }}>{y.patients} patients</span>
                                <span style={{ fontWeight: 700, color: '#34d399' }}>{fmt(y.cost)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </>)}

            {/* ── BREAK-EVEN ───────────────────────────────────────── */}
            {tab === 'breakeven' && (<>
                <div style={S.card}>
                    <h3 style={S.sTitle}>⚖️ Break-Even Analysis</h3>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <label style={{ fontSize: 12, color: C.muted }}>CAR-T Cost:
                            <input type="number" value={cartCost} onChange={e => setCartCost(+e.target.value)} style={{ ...S.input, maxWidth: 120, marginLeft: 6 }} />
                        </label>
                        <label style={{ fontSize: 12, color: C.muted }}>SOC Annual:
                            <input type="number" value={socAnnualCost} onChange={e => setSocAnnualCost(+e.target.value)} style={{ ...S.input, maxWidth: 120, marginLeft: 6 }} />
                        </label>
                        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={calcBreakEven} disabled={loading}>{loading ? '⏳' : '⚖️ Calculate'}</button>
                    </div>
                </div>
                {breakEvenRes && (
                    <div style={S.statG}>
                        <div style={S.stat(C.a1)}><span style={S.sv}>{breakEvenRes.break_even_years?.toFixed(1) || '—'} yr</span><span style={S.sl}>Break-Even</span></div>
                        <div style={S.stat(C.a2)}><span style={S.sv}>{fmt(breakEvenRes.cart_lifetime_cost || 0)}</span><span style={S.sl}>CAR-T Lifetime</span></div>
                        <div style={S.stat(C.a5)}><span style={S.sv}>{fmt(breakEvenRes.soc_lifetime_cost || 0)}</span><span style={S.sl}>SOC Lifetime</span></div>
                        <div style={S.stat(breakEvenRes.cart_favourable ? '#22c55e' : C.a5)}><span style={S.sv}>{breakEvenRes.cart_favourable ? '✅' : '❌'}</span><span style={S.sl}>CAR-T Favourable</span></div>
                    </div>
                )}
            </>)}

            {/* ── OUTCOMES CONTRACT ─────────────────────────────────── */}
            {tab === 'outcomes' && outcomesRes && (<>
                <div style={S.statG}>
                    <div style={S.stat(C.a1)}><span style={S.sv}>{outcomesRes.responders || 0}</span><span style={S.sl}>Responders</span></div>
                    <div style={S.stat(C.a5)}><span style={S.sv}>{outcomesRes.non_responders || 0}</span><span style={S.sl}>Non-Responders</span></div>
                    <div style={S.stat(C.a3)}><span style={S.sv}>{fmt(outcomesRes.total_payer_cost || 0)}</span><span style={S.sl}>Payer Cost</span></div>
                    <div style={S.stat(C.a2)}><span style={S.sv}>{fmt(outcomesRes.manufacturer_rebate || 0)}</span><span style={S.sl}>Rebate</span></div>
                    <div style={S.stat(C.a4)}><span style={S.sv}>{fmt(outcomesRes.effective_price_per_responder || 0)}</span><span style={S.sl}>$/Responder</span></div>
                </div>
                {outcomesRes.recommendation && (
                    <div style={{ ...S.card, borderLeft: '3px solid #22c55e' }}>
                        <p style={{ color: C.text, fontSize: 13, margin: 0 }}>{outcomesRes.recommendation}</p>
                    </div>
                )}
            </>)}

            {/* ── PLATFORM COMPARE ──────────────────────────────────── */}
            {tab === 'platforms' && (<>
                <div style={S.card}>
                    <div style={{ display: 'flex', gap: 8-0 }}>
                        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={comparePlatforms} disabled={loading}>{loading ? '⏳' : '🔬 Compare Platforms'}</button>
                    </div>
                </div>
                {platformRes && platformRes.platforms && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {platformRes.platforms.map((p: any, i: number) => (
                            <div key={i} style={{ ...S.card, borderTop: `3px solid ${[C.a1, C.a2, C.a3, C.a4][i % 4]}` }}>
                                <h4 style={{ color: C.text, fontSize: 14, margin: '0 0 10px', fontWeight: 700 }}>{p.platform?.replace(/_/g, ' ').toUpperCase()}</h4>
                                <div style={{ fontSize: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>Cost/Dose</span><span style={{ fontWeight: 700, color: '#34d399' }}>{fmt(p.cost_per_dose || 0)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>Production Time</span><span style={{ fontWeight: 700 }}>{p.production_days || '—'} days</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>Scalability</span><span style={{ fontWeight: 700 }}>{p.scalability_score?.toFixed(1) || '—'}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}><span style={{ color: C.muted }}>QC Complexity</span><span style={{ fontWeight: 700 }}>{p.qc_complexity || '—'}</span></div>
                                </div>
                                {p.advantages && (
                                    <div style={{ marginTop: 8 }}>
                                        {p.advantages.slice(0, 3).map((a: string, j: number) => (
                                            <span key={j} style={S.badge('#22c55e')}>{a}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </>)}
        </div>
    );
}
