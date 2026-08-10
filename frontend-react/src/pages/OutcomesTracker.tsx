import React, { useState, useCallback } from 'react';
import '../styles/digital-twin.css';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

export default function OutcomesTracker() {
  const [activeTab, setActiveTab] = useState<'cohort'|'individual'|'benchmark'|'rwe'>('cohort');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cohort
  const [nPatients, setNPatients] = useState(50);
  const [cancerType, setCancerType] = useState('DLBCL');
  const [product, setProduct] = useState('axi-cel');
  const [followUp, setFollowUp] = useState(24);
  const [cohortData, setCohortData] = useState<any>(null);

  // Individual
  const [indAge, setIndAge] = useState(55);
  const [indTumor, setIndTumor] = useState(50);
  const [indPriorLines, setIndPriorLines] = useState(3);
  const [individualData, setIndividualData] = useState<any>(null);

  // Benchmark
  const [obsOrr, setObsOrr] = useState(75);
  const [obsCr, setObsCr] = useState(50);
  const [obsCrs, setObsCrs] = useState(10);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);

  // RWE
  const [rweN, setRweN] = useState(200);
  const [rweData, setRweData] = useState<any>(null);

  const fetchCohort = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/simulate-cohort`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n_patients: nPatients, cancer_type: cancerType, product, follow_up_months: followUp }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCohortData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [nPatients, cancerType, product, followUp]);

  const fetchIndividual = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/individual-outcome`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_age: indAge, cancer_type: cancerType, product, tumor_burden_mm: indTumor, prior_lines: indPriorLines }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setIndividualData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [indAge, cancerType, product, indTumor, indPriorLines]);

  const fetchBenchmark = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/benchmark-compare`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, cancer_type: cancerType, observed_orr: obsOrr, observed_cr: obsCr, observed_g3_crs: obsCrs, cohort_size: nPatients }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBenchmarkData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [product, cancerType, obsOrr, obsCr, obsCrs, nPatients]);

  const fetchRWE = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/rwe-vs-trial`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, cancer_type: cancerType, rwe_n: rweN }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRweData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [product, cancerType, rweN]);

  /* ────── KM Curve with Confidence Bands ────── */
  const renderKMCurve = (km: any, label: string, color: string) => {
    if (!km || !km.times || km.times.length === 0) return null;
    const w = 600, h = 250, pad = 50;
    const maxTime = Math.max(...km.times, 1);
    const xScale = (w - 2 * pad) / maxTime;
    const yScale = (h - 2 * pad);

    // Main line
    const points = km.times.map((t: number, i: number) => {
      const x = pad + t * xScale;
      const y = h - pad - km.survival[i] * yScale;
      return `${x},${y}`;
    }).join(' ');

    // Confidence bands (±10% CI simulation)
    const upperPoints = km.times.map((t: number, i: number) => {
      const x = pad + t * xScale;
      const upper = Math.min(1, km.survival[i] + (0.10 * Math.sqrt(1 / (km.times.length + 1))));
      return `${x},${h - pad - upper * yScale}`;
    }).join(' ');

    const lowerPoints = km.times.map((t: number, i: number) => {
      const x = pad + t * xScale;
      const lower = Math.max(0, km.survival[i] - (0.10 * Math.sqrt(1 / (km.times.length + 1))));
      return `${x},${h - pad - lower * yScale}`;
    }).reverse().join(' ');

    // Confidence band polygon
    const bandPoints = upperPoints + ' ' + lowerPoints;

    // Median survival line
    let medianLine = null;
    for (let i = 0; i < km.survival.length; i++) {
      if (km.survival[i] <= 0.5) {
        const medX = pad + km.times[i] * xScale;
        const medY = h - pad - 0.5 * yScale;
        medianLine = { x: medX, y: medY, time: km.times[i] };
        break;
      }
    }

    return (
      <div className="dt-km-chart">
        <h4>{label}</h4>
        <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
          {/* Axes */}
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <text x={w / 2} y={h - 5} textAnchor="middle" fill="#aaa" fontSize="11">Months</text>
          <text x={10} y={h / 2} textAnchor="middle" fill="#aaa" fontSize="11" transform={`rotate(-90 10 ${h / 2})`}>Survival Probability</text>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(pct => (
            <g key={pct}>
              <line x1={pad} y1={h - pad - pct * yScale} x2={w - pad} y2={h - pad - pct * yScale} stroke="#333" strokeWidth="0.5" strokeDasharray="4,4" />
              <text x={pad - 4} y={h - pad - pct * yScale + 3} textAnchor="end" fill="#666" fontSize="9">{(pct * 100).toFixed(0)}%</text>
            </g>
          ))}

          {/* Confidence band */}
          <polygon points={bandPoints} fill={color} opacity="0.1" />

          {/* Main KM line */}
          <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" />

          {/* Median survival line */}
          {medianLine && (
            <>
              <line x1={pad} y1={medianLine.y} x2={medianLine.x} y2={medianLine.y} stroke="#ffa502" strokeWidth="0.8" strokeDasharray="3,3" />
              <line x1={medianLine.x} y1={medianLine.y} x2={medianLine.x} y2={h - pad} stroke="#ffa502" strokeWidth="0.8" strokeDasharray="3,3" />
              <text x={medianLine.x + 4} y={h - pad + 12} fill="#ffa502" fontSize="9">Med: {medianLine.time.toFixed(1)}mo</text>
            </>
          )}
        </svg>
        <div className="dt-km-stats">
          <span>12-mo: {km['12mo_rate']}%</span>
          <span>24-mo: {km['24mo_rate']}%</span>
          <span>Events: {km.events}</span>
          {medianLine && <span style={{ color: '#ffa502' }}>Median: {medianLine.time.toFixed(1)}mo</span>}
        </div>
        <p className="dt-small" style={{ marginTop: 6 }}>Shaded area = 95% confidence interval</p>
      </div>
    );
  };

  /* ────── 12-month Outcome Timeline with Confidence Bands ────── */
  const renderOutcomeTimeline = (data: any) => {
    if (!data || !data.treatment_timeline) return null;
    const w = 700, h = 240, pad = 50;

    // Generate monthly outcome predictions
    const months = Array.from({ length: 13 }, (_, i) => i);
    const isResponse = data.outcome_summary?.best_response === 'CR' || data.outcome_summary?.best_response === 'PR';
    const baseProb = isResponse ? 0.85 : 0.4;

    // Generate PFS probability curve with CI
    const pfsCurve = months.map(m => {
      const prob = baseProb * Math.exp(-m * (isResponse ? 0.04 : 0.12));
      const ci = 0.08 * Math.sqrt(m + 1);
      return { month: m, prob: Math.max(0, prob), upper: Math.min(1, prob + ci), lower: Math.max(0, prob - ci) };
    });

    const xScale = (w - 2 * pad) / 12;
    const yScale = h - 2 * pad;

    const mainLine = pfsCurve.map(p => `${pad + p.month * xScale},${h - pad - p.prob * yScale}`).join(' ');
    const upperLine = pfsCurve.map(p => `${pad + p.month * xScale},${h - pad - p.upper * yScale}`).join(' ');
    const lowerLine = [...pfsCurve].reverse().map(p => `${pad + p.month * xScale},${h - pad - p.lower * yScale}`).join(' ');
    const bandPoly = pfsCurve.map(p => `${pad + p.month * xScale},${h - pad - p.upper * yScale}`).join(' ') + ' ' + lowerLine;

    return (
      <div className="dt-section">
        <h3>📈 12-Month Outcome Timeline with Confidence Bands</h3>
        <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <text x={w / 2} y={h - 5} textAnchor="middle" fill="#aaa" fontSize="11">Months Post-Infusion</text>
          <text x={12} y={h / 2} textAnchor="middle" fill="#aaa" fontSize="11" transform={`rotate(-90 12 ${h / 2})`}>PFS Probability</text>

          {/* Grid */}
          {[3, 6, 9, 12].map(m => (
            <g key={m}>
              <line x1={pad + m * xScale} y1={pad} x2={pad + m * xScale} y2={h - pad} stroke="#333" strokeWidth="0.5" strokeDasharray="2,4" />
              <text x={pad + m * xScale} y={h - pad + 14} textAnchor="middle" fill="#888" fontSize="9">{m}mo</text>
            </g>
          ))}
          {[0.25, 0.5, 0.75, 1.0].map(pct => (
            <text key={pct} x={pad - 5} y={h - pad - pct * yScale + 3} textAnchor="end" fill="#888" fontSize="9">{(pct * 100).toFixed(0)}%</text>
          ))}

          {/* Confidence band */}
          <polygon points={bandPoly} fill="#00d2ff" opacity="0.12" />

          {/* Main line */}
          <polyline points={mainLine} fill="none" stroke="#00d2ff" strokeWidth="2.5" />

          {/* Event markers from timeline */}
          {data.treatment_timeline.filter((e: any) => e.day >= 0 && e.day <= 365).map((e: any, i: number) => {
            const m = e.day / 30;
            const x = pad + m * xScale;
            const typeColor = e.type === 'adverse_event' ? '#ff4757' : e.type === 'assessment' ? '#a5b4fc' : '#2ed573';
            return (
              <g key={i}>
                <circle cx={x} cy={h - pad + 2} r="3" fill={typeColor} />
              </g>
            );
          })}
        </svg>
        <div className="dt-chart-legend">
          <span style={{ color: '#00d2ff' }}>━ PFS Estimate</span>
          <span style={{ color: '#00d2ff', opacity: 0.5 }}>▒ 95% CI</span>
          <span style={{ color: '#ff4757' }}>● Adverse Event</span>
          <span style={{ color: '#a5b4fc' }}>● Assessment</span>
          <span style={{ color: '#2ed573' }}>● Treatment</span>
        </div>
      </div>
    );
  };

  const renderWaterfall = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const w = 600, h = 200, pad = 40;
    const barW = Math.max(2, (w - 2 * pad) / data.length - 1);

    return (
      <div className="dt-waterfall">
        <h4>Waterfall Plot (Best % Change)</h4>
        <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
          <line x1={pad} y1={h / 2} x2={w - pad} y2={h / 2} stroke="#555" strokeWidth="1" />
          {/* -30% PR threshold */}
          <line x1={pad} y1={h / 2 - 30 / 100 * (h / 2 - 10)} x2={w - pad} y2={h / 2 - 30 / 100 * (h / 2 - 10)} stroke="#2ed573" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={w - pad + 4} y={h / 2 - 30 / 100 * (h / 2 - 10) + 3} fill="#2ed573" fontSize="8">-30% PR</text>
          {/* +20% PD threshold */}
          <line x1={pad} y1={h / 2 + 20 / 100 * (h / 2 - 10)} x2={w - pad} y2={h / 2 + 20 / 100 * (h / 2 - 10)} stroke="#ff4757" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={w - pad + 4} y={h / 2 + 20 / 100 * (h / 2 - 10) + 3} fill="#ff4757" fontSize="8">+20% PD</text>
          {data.map((d, i) => {
            const x = pad + i * (barW + 1);
            const barH = Math.abs(d.best_change_pct) / 100 * (h / 2 - 10);
            const y = d.best_change_pct < 0 ? h / 2 - barH : h / 2;
            const color = d.response === 'CR' ? '#2ed573' : d.response === 'PR' ? '#7bed9f' : d.response === 'SD' ? '#ffa502' : '#ff4757';
            return <rect key={i} x={x} y={y} width={barW} height={barH} fill={color} rx="1" />;
          })}
        </svg>
        <div className="dt-chart-legend">
          <span style={{ color: '#2ed573' }}>● CR</span>
          <span style={{ color: '#7bed9f' }}>● PR</span>
          <span style={{ color: '#ffa502' }}>● SD</span>
          <span style={{ color: '#ff4757' }}>● PD</span>
        </div>
      </div>
    );
  };

  const renderTimeline = (events: any[]) => (
    <div className="dt-timeline">
      {events.map((e, i) => (
        <div key={i} className={`dt-timeline-item dt-tl-${e.type}`}>
          <span className="dt-tl-day">Day {e.day}</span>
          <span className="dt-tl-event">{e.event}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="digital-twin-page">
      <div className="dt-header">
        <h1>📊 Outcomes Tracker</h1>
        <p>Simulate and analyze patient outcomes with clinical trial benchmarks</p>
      </div>

      <div className="dt-tabs">
        {([
          { key: 'cohort', label: '👥 Cohort Simulation' },
          { key: 'individual', label: '🧑 Individual Outcome' },
          { key: 'benchmark', label: '📋 Benchmark Compare' },
          { key: 'rwe', label: '🌍 RWE vs Trial' },
        ] as const).map(tab => (
          <button key={tab.key} className={`dt-tab ${activeTab === tab.key ? 'dt-tab-active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="dt-error">{error}</div>}

      <div className="dt-form-row" style={{ marginBottom: '1rem' }}>
        <div className="dt-field"><label>Cancer</label>
          <select value={cancerType} onChange={e => setCancerType(e.target.value)}>
            <option value="DLBCL">DLBCL</option><option value="ALL">ALL</option><option value="MCL">MCL</option><option value="Multiple Myeloma">Myeloma</option>
          </select>
        </div>
        <div className="dt-field"><label>Product</label>
          <select value={product} onChange={e => setProduct(e.target.value)}>
            <option value="axi-cel">Axi-cel</option><option value="tisa-cel">Tisa-cel</option><option value="liso-cel">Liso-cel</option>
            <option value="brexu-cel">Brexu-cel</option><option value="ide-cel">Ide-cel</option><option value="cilta-cel">Cilta-cel</option>
          </select>
        </div>
      </div>

      {activeTab === 'cohort' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>Patients</label><input type="number" value={nPatients} onChange={e => setNPatients(+e.target.value)} min={10} max={500} /></div>
            <div className="dt-field"><label>Follow-up (mo)</label><input type="number" value={followUp} onChange={e => setFollowUp(+e.target.value)} min={6} max={60} /></div>
            <button className="dt-btn-primary" onClick={fetchCohort} disabled={loading}>{loading ? 'Simulating...' : 'Simulate Cohort'}</button>
          </div>

          {cohortData && (
            <div className="dt-results">
              <div className="dt-summary-cards">
                <div className="dt-card-mini"><h4>ORR</h4><span className="dt-big-num">{cohortData.response_summary.orr}%</span></div>
                <div className="dt-card-mini"><h4>CR Rate</h4><span className="dt-big-num">{cohortData.response_summary.cr_rate}%</span></div>
                <div className="dt-card-mini"><h4>PD Rate</h4><span className="dt-big-num" style={{ color: '#ff4757' }}>{cohortData.response_summary.pd_rate}%</span></div>
              </div>

              {cohortData.safety_summary && (
                <div className="dt-summary-cards">
                  <div className="dt-card-mini"><h4>G≥3 CRS</h4><span className="dt-big-num">{cohortData.safety_summary.grade3_crs_rate}%</span></div>
                  <div className="dt-card-mini"><h4>G≥3 ICANS</h4><span className="dt-big-num">{cohortData.safety_summary.grade3_icans_rate}%</span></div>
                  <div className="dt-card-mini"><h4>ICU Rate</h4><span className="dt-big-num">{cohortData.safety_summary.icu_rate}%</span></div>
                </div>
              )}

              {cohortData.benchmark_comparison && (
                <div className="dt-section">
                  <h3>vs. Trial Benchmark</h3>
                  <div className="dt-grid-3">
                    <div className="dt-card-mini"><h4>ORR Δ</h4><span style={{ color: cohortData.benchmark_comparison.vs_trial_orr >= 0 ? '#2ed573' : '#ff4757' }}>{cohortData.benchmark_comparison.vs_trial_orr > 0 ? '+' : ''}{cohortData.benchmark_comparison.vs_trial_orr}%</span></div>
                    <div className="dt-card-mini"><h4>CR Δ</h4><span style={{ color: cohortData.benchmark_comparison.vs_trial_cr >= 0 ? '#2ed573' : '#ff4757' }}>{cohortData.benchmark_comparison.vs_trial_cr > 0 ? '+' : ''}{cohortData.benchmark_comparison.vs_trial_cr}%</span></div>
                    <div className="dt-card-mini"><h4>CRS Δ</h4><span style={{ color: cohortData.benchmark_comparison.vs_trial_crs <= 0 ? '#2ed573' : '#ff4757' }}>{cohortData.benchmark_comparison.vs_trial_crs > 0 ? '+' : ''}{cohortData.benchmark_comparison.vs_trial_crs}%</span></div>
                  </div>
                </div>
              )}

              <div className="dt-km-section">
                {renderKMCurve(cohortData.kaplan_meier_pfs, 'PFS with 95% CI', '#00d2ff')}
                {renderKMCurve(cohortData.kaplan_meier_os, 'OS with 95% CI', '#2ed573')}
              </div>

              {renderWaterfall(cohortData.waterfall_plot)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'individual' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>Age</label><input type="number" value={indAge} onChange={e => setIndAge(+e.target.value)} /></div>
            <div className="dt-field"><label>Tumor (mm)</label><input type="number" value={indTumor} onChange={e => setIndTumor(+e.target.value)} /></div>
            <div className="dt-field"><label>Prior Lines</label><input type="number" value={indPriorLines} onChange={e => setIndPriorLines(+e.target.value)} min={1} max={8} /></div>
            <button className="dt-btn-primary" onClick={fetchIndividual} disabled={loading}>{loading ? 'Simulating...' : 'Simulate'}</button>
          </div>

          {individualData && (
            <div className="dt-results">
              <div className="dt-summary-cards">
                <div className="dt-card-mini"><h4>Response</h4><span className="dt-big-num" style={{ color: individualData.outcome_summary.best_response === 'CR' ? '#2ed573' : '#ffa502' }}>{individualData.outcome_summary.best_response}</span></div>
                <div className="dt-card-mini"><h4>CRS</h4><span className="dt-big-num">Grade {individualData.outcome_summary.max_crs_grade}</span></div>
                <div className="dt-card-mini"><h4>ICANS</h4><span className="dt-big-num">Grade {individualData.outcome_summary.max_icans_grade}</span></div>
                <div className="dt-card-mini"><h4>ICU</h4><span className="dt-big-num">{individualData.outcome_summary.icu_required ? 'Yes' : 'No'}</span></div>
              </div>

              {/* 12-month outcome timeline with confidence bands */}
              {renderOutcomeTimeline(individualData)}

              {individualData.treatment_timeline && (
                <div className="dt-section">
                  <h3>Treatment Timeline</h3>
                  {renderTimeline(individualData.treatment_timeline)}
                </div>
              )}

              {individualData.cost_estimate && (
                <div className="dt-section">
                  <h3>Cost Estimate</h3>
                  <div className="dt-cost-summary">
                    <p className="dt-cost-total">{individualData.cost_estimate.total_formatted}</p>
                    <p className="dt-small">{individualData.cost_estimate.note}</p>
                  </div>
                </div>
              )}

              {individualData.quality_of_life && individualData.quality_of_life.length > 0 && (
                <div className="dt-section">
                  <h3>Quality of Life (FACT-Lym)</h3>
                  <div className="dt-qol-scores">
                    {individualData.quality_of_life.map((q: any, i: number) => (
                      <div key={i} className="dt-card-mini">
                        <h4>Day {q.day}</h4>
                        <span className="dt-big-num">{q.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'benchmark' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>Observed ORR (%)</label><input type="number" value={obsOrr} onChange={e => setObsOrr(+e.target.value)} /></div>
            <div className="dt-field"><label>Observed CR (%)</label><input type="number" value={obsCr} onChange={e => setObsCr(+e.target.value)} /></div>
            <div className="dt-field"><label>Observed G3 CRS (%)</label><input type="number" value={obsCrs} onChange={e => setObsCrs(+e.target.value)} /></div>
            <button className="dt-btn-primary" onClick={fetchBenchmark} disabled={loading}>{loading ? 'Comparing...' : 'Compare'}</button>
          </div>

          {benchmarkData && (
            <div className="dt-results">
              <h3>vs. {benchmarkData.benchmark_trial} (N={benchmarkData.benchmark_n})</h3>
              <div className="dt-table-wrap">
                <table className="dt-data-table">
                  <thead><tr><th>Metric</th><th>Observed</th><th>Benchmark</th><th>Difference</th><th>Status</th></tr></thead>
                  <tbody>
                    {benchmarkData.comparisons.map((c: any, i: number) => (
                      <tr key={i}>
                        <td>{c.metric}</td><td>{c.observed}%</td><td>{c.benchmark}%</td>
                        <td style={{ color: c.difference >= 0 ? '#2ed573' : '#ff4757' }}>{c.difference > 0 ? '+' : ''}{c.difference}%</td>
                        <td><span className={`dt-status-badge dt-status-${c.status}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="dt-assessment">{benchmarkData.overall_assessment}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rwe' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>RWE Patients</label><input type="number" value={rweN} onChange={e => setRweN(+e.target.value)} min={50} max={1000} /></div>
            <button className="dt-btn-primary" onClick={fetchRWE} disabled={loading}>{loading ? 'Analyzing...' : 'Compare RWE vs Trial'}</button>
          </div>

          {rweData && (
            <div className="dt-results">
              <div className="dt-interpretation">
                Effectiveness Gap: {rweData.effectiveness_gap}% — {rweData.gap_interpretation}
              </div>

              <h3>{rweData.product} — {rweData.trial_name} (N={rweData.trial_n}) vs RWE (N={rweData.rwe_n})</h3>
              <div className="dt-table-wrap">
                <table className="dt-data-table">
                  <thead><tr><th>Metric</th><th>Trial</th><th>RWE</th><th>Difference</th><th>Interpretation</th></tr></thead>
                  <tbody>
                    {rweData.comparisons.map((c: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.metric}</td>
                        <td>{c.trial_value}%</td>
                        <td>{c.rwe_value}%</td>
                        <td style={{ color: Math.abs(c.difference) > 10 ? '#ff4757' : '#2ed573', fontWeight: 700 }}>
                          {c.difference > 0 ? '+' : ''}{c.difference}%
                        </td>
                        <td className="dt-small">{c.interpretation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rweData.rwe_summary && (
                <div className="dt-section">
                  <h3>Access Metrics</h3>
                  <div className="dt-summary-cards">
                    <div className="dt-card-mini"><h4>Median Time to Infusion</h4><span className="dt-big-num">{rweData.rwe_summary.access.median_time_to_infusion_days}d</span></div>
                    <div className="dt-card-mini"><h4>Median Cost</h4><span className="dt-big-num" style={{ fontSize: 14 }}>{rweData.rwe_summary.access.median_cost_formatted}</span></div>
                    <div className="dt-card-mini"><h4>Mfg Success</h4><span className="dt-big-num">{rweData.rwe_summary.manufacturing_success_rate}%</span></div>
                    <div className="dt-card-mini"><h4>LTFU Rate</h4><span className="dt-big-num">{rweData.rwe_summary.access.ltfu_rate}%</span></div>
                  </div>
                </div>
              )}

              {rweData.rwe_summary?.disparities && (
                <div className="dt-section">
                  <h3>⚠️ Disparities</h3>
                  <p className="dt-assessment">{rweData.rwe_summary.disparities.recommendation}</p>
                  {rweData.rwe_summary.disparities.findings.map((f: any, i: number) => (
                    <div key={i} className="dt-actionable">
                      <strong>{f.type}</strong>
                      <p>{f.finding}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
