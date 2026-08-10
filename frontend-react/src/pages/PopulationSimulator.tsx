import React, { useState, useCallback } from 'react';
import '../styles/digital-twin.css';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

export default function PopulationSimulator() {
  const [activeTab, setActiveTab] = useState<'simulate'|'sensitivity'|'compare'>('simulate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Common
  const [cancerType, setCancerType] = useState('DLBCL');
  const [product, setProduct] = useState('axi-cel');

  // Population sim
  const [nPatients, setNPatients] = useState(500);
  const [followUp, setFollowUp] = useState(24);
  const [simData, setSimData] = useState<any>(null);

  // Sensitivity
  const [parameter, setParameter] = useState('tumor_burden');
  const [nSens, setNSens] = useState(200);
  const [sensData, setSensData] = useState<any>(null);

  // Compare products
  const [compareProducts, setCompareProducts] = useState(['axi-cel', 'tisa-cel', 'liso-cel']);
  const [nCompare, setNCompare] = useState(300);
  const [compareData, setCompareData] = useState<any>(null);

  const fetchSimulation = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/population-simulation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n_patients: nPatients, cancer_type: cancerType, product, follow_up_months: followUp }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSimData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [nPatients, cancerType, product, followUp]);

  const fetchSensitivity = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/sensitivity-analysis`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parameter, cancer_type: cancerType, product, n_simulations: nSens }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSensData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [parameter, cancerType, product, nSens]);

  const fetchCompare = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/compare-products-population`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancer_type: cancerType, products: compareProducts, n_simulations: nCompare }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCompareData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [cancerType, compareProducts, nCompare]);

  const renderBarChart = (data: any[], valueKey: string, label: string, color: string) => {
    if (!data || data.length === 0) return null;
    const w = 600, h = 200, pad = 50;
    const maxVal = Math.max(...data.map(d => d[valueKey]), 1);
    const barW = Math.max(10, (w - 2 * pad) / data.length - 5);

    return (
      <div className="dt-bar-chart">
        <h4>{label}</h4>
        <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          {data.map((d, i) => {
            const x = pad + i * (barW + 5);
            const barH = (d[valueKey] / maxVal) * (h - 2 * pad);
            return (
              <g key={i}>
                <rect x={x} y={h - pad - barH} width={barW} height={barH} fill={color} rx="3" opacity={0.8} />
                <text x={x + barW / 2} y={h - pad + 15} textAnchor="middle" fill="#aaa" fontSize="9">{d.parameter_value || d.product || ''}</text>
                <text x={x + barW / 2} y={h - pad - barH - 5} textAnchor="middle" fill="#ddd" fontSize="9">{typeof d[valueKey] === 'number' ? d[valueKey].toFixed(1) : d[valueKey]}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderHistogram = (hist: any, title: string, color: string) => {
    if (!hist || !hist.bins || hist.bins.length === 0) return null;
    const w = 300, h = 150, pad = 30;
    const maxCount = Math.max(...hist.counts, 1);
    const barW = (w - 2 * pad) / hist.bins.length;

    return (
      <div className="dt-histogram">
        <h4>{title}</h4>
        <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          {hist.bins.map((b: number, i: number) => {
            const barH = (hist.counts[i] / maxCount) * (h - 2 * pad);
            return <rect key={i} x={pad + i * barW} y={h - pad - barH} width={barW - 1} height={barH} fill={color} rx="2" opacity={0.7} />;
          })}
        </svg>
      </div>
    );
  };

  const renderSubgroups = (subgroups: any) => {
    if (!subgroups) return null;
    return (
      <div className="dt-subgroups">
        {Object.entries(subgroups).map(([category, groups]: [string, any]) => (
          <div key={category} className="dt-subgroup-category">
            <h4>{category.replace(/_/g, ' ').toUpperCase()}</h4>
            <div className="dt-table-wrap">
              <table className="dt-data-table">
                <thead><tr><th>Subgroup</th><th>N</th><th>ORR</th><th>CR</th><th>PFS</th><th>G3 CRS</th></tr></thead>
                <tbody>
                  {Object.entries(groups).map(([name, stats]: [string, any]) => (
                    <tr key={name}>
                      <td>{name}</td><td>{stats.n}</td>
                      <td>{stats.orr}%</td><td>{stats.cr_rate}%</td>
                      <td>{stats.median_pfs}mo</td><td>{stats.grade3_crs}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="digital-twin-page">
      <div className="dt-header">
        <h1>🌍 Population Simulator</h1>
        <p>Monte Carlo simulation for population-level CAR-T outcomes</p>
      </div>

      <div className="dt-tabs">
        {(['simulate', 'sensitivity', 'compare'] as const).map(tab => (
          <button key={tab} className={`dt-tab ${activeTab === tab ? 'dt-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'simulate' ? '🎲 Simulation' : tab === 'sensitivity' ? '📊 Sensitivity' : '⚔️ Product Compare'}
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
      </div>

      {activeTab === 'simulate' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>Product</label>
              <select value={product} onChange={e => setProduct(e.target.value)}>
                <option value="axi-cel">Axi-cel</option><option value="tisa-cel">Tisa-cel</option><option value="liso-cel">Liso-cel</option>
                <option value="brexu-cel">Brexu-cel</option><option value="ide-cel">Ide-cel</option><option value="cilta-cel">Cilta-cel</option>
              </select>
            </div>
            <div className="dt-field"><label>Patients</label><input type="number" value={nPatients} onChange={e => setNPatients(+e.target.value)} min={50} max={5000} /></div>
            <div className="dt-field"><label>Follow-up</label><input type="number" value={followUp} onChange={e => setFollowUp(+e.target.value)} /></div>
            <button className="dt-btn-primary" onClick={fetchSimulation} disabled={loading}>{loading ? 'Running...' : 'Run Simulation'}</button>
          </div>

          {simData && (
            <div className="dt-results">
              <div className="dt-summary-cards">
                <div className="dt-card-mini"><h4>ORR</h4><span className="dt-big-num">{simData.summary.response.orr}%</span></div>
                <div className="dt-card-mini"><h4>CR Rate</h4><span className="dt-big-num">{simData.summary.response.cr_rate}%</span></div>
                <div className="dt-card-mini"><h4>Median PFS</h4><span className="dt-big-num">{simData.summary.survival.median_pfs_months}mo</span></div>
                <div className="dt-card-mini"><h4>12-mo PFS</h4><span className="dt-big-num">{simData.summary.survival['12mo_pfs_rate']}%</span></div>
                <div className="dt-card-mini"><h4>G≥3 CRS</h4><span className="dt-big-num">{simData.summary.safety.grade3_crs_rate}%</span></div>
                <div className="dt-card-mini"><h4>ICU Rate</h4><span className="dt-big-num">{simData.summary.safety.icu_rate}%</span></div>
              </div>

              {simData.cost_effectiveness && (
                <div className="dt-section">
                  <h3>Cost-Effectiveness</h3>
                  <div className="dt-summary-cards">
                    <div className="dt-card-mini"><h4>Cost/Patient</h4><p>{simData.cost_effectiveness.mean_cost_formatted}</p></div>
                    <div className="dt-card-mini"><h4>NNT (Response)</h4><span className="dt-big-num">{simData.cost_effectiveness.nnt_response}</span></div>
                    <div className="dt-card-mini"><h4>NNT (CR)</h4><span className="dt-big-num">{simData.cost_effectiveness.nnt_cr}</span></div>
                    <div className="dt-card-mini"><h4>QALY Gained</h4><span className="dt-big-num">{simData.cost_effectiveness.qaly_gained}</span></div>
                    <div className="dt-card-mini"><h4>Cost/QALY</h4><p>{simData.cost_effectiveness.cost_per_qaly_formatted}</p></div>
                    <div className="dt-card-mini"><h4>Cost-Effective?</h4><span className="dt-big-num" style={{ color: simData.cost_effectiveness.cost_effective ? '#2ed573' : '#ff4757' }}>{simData.cost_effectiveness.cost_effective ? 'Yes' : 'No'}</span></div>
                  </div>
                </div>
              )}

              {simData.capacity_planning && (
                <div className="dt-section">
                  <h3>India Capacity Planning</h3>
                  <div className="dt-summary-cards">
                    <div className="dt-card-mini"><h4>Annual Cases</h4><span className="dt-big-num">{simData.capacity_planning.annual_incident_cases.toLocaleString()}</span></div>
                    <div className="dt-card-mini"><h4>CAR-T Eligible</h4><span className="dt-big-num">{simData.capacity_planning.car_t_eligible.toLocaleString()}</span></div>
                    <div className="dt-card-mini"><h4>Centers Needed</h4><span className="dt-big-num">{simData.capacity_planning.centers_needed}</span></div>
                    <div className="dt-card-mini"><h4>Current Centers</h4><span className="dt-big-num">{simData.capacity_planning.current_centers_india}</span></div>
                    <div className="dt-card-mini"><h4>Capacity Gap</h4><span className="dt-big-num" style={{ color: '#ff4757' }}>{simData.capacity_planning.capacity_gap}</span></div>
                  </div>
                </div>
              )}

              {simData.distribution_data && (
                <div className="dt-section">
                  <h3>Distribution Data</h3>
                  <div className="dt-grid-2">
                    {renderHistogram(simData.distribution_data.age_distribution, 'Age Distribution', '#00d2ff')}
                    {renderHistogram(simData.distribution_data.tumor_burden_distribution, 'Tumor Burden', '#ff6b6b')}
                    {renderHistogram(simData.distribution_data.pfs_distribution, 'PFS (months)', '#2ed573')}
                    {renderHistogram(simData.distribution_data.cost_distribution_millions, 'Cost (₹M)', '#ffa502')}
                  </div>
                </div>
              )}

              {simData.subgroup_analysis && (
                <div className="dt-section">
                  <h3>Subgroup Analysis</h3>
                  {renderSubgroups(simData.subgroup_analysis)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sensitivity' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>Parameter</label>
              <select value={parameter} onChange={e => setParameter(e.target.value)}>
                <option value="tumor_burden">Tumor Burden</option><option value="age">Age</option>
                <option value="prior_lines">Prior Lines</option><option value="double_hit_rate">Double-Hit Rate</option>
              </select>
            </div>
            <div className="dt-field"><label>Product</label>
              <select value={product} onChange={e => setProduct(e.target.value)}>
                <option value="axi-cel">Axi-cel</option><option value="tisa-cel">Tisa-cel</option><option value="liso-cel">Liso-cel</option>
              </select>
            </div>
            <div className="dt-field"><label>N per point</label><input type="number" value={nSens} onChange={e => setNSens(+e.target.value)} min={50} max={1000} /></div>
            <button className="dt-btn-primary" onClick={fetchSensitivity} disabled={loading}>{loading ? 'Running...' : 'Run Analysis'}</button>
          </div>

          {sensData && (
            <div className="dt-results">
              <p className="dt-interpretation">{sensData.interpretation}</p>
              {renderBarChart(sensData.results, 'orr', `ORR by ${parameter}`, '#00d2ff')}
              {renderBarChart(sensData.results, 'cr_rate', `CR Rate by ${parameter}`, '#2ed573')}
              {renderBarChart(sensData.results, 'grade3_crs_rate', `G≥3 CRS by ${parameter}`, '#ff4757')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>N per product</label><input type="number" value={nCompare} onChange={e => setNCompare(+e.target.value)} min={50} max={1000} /></div>
            <button className="dt-btn-primary" onClick={fetchCompare} disabled={loading}>{loading ? 'Comparing...' : 'Compare Products'}</button>
          </div>

          {compareData && (
            <div className="dt-results">
              <div className="dt-section">
                <h3>Head-to-Head Comparison</h3>
                <div className="dt-table-wrap">
                  <table className="dt-data-table">
                    <thead><tr><th>Product</th><th>ORR</th><th>CR</th><th>PFS</th><th>G3 CRS</th><th>G3 ICANS</th><th>ICU</th></tr></thead>
                    <tbody>
                      {compareData.comparisons.map((c: any, i: number) => (
                        <tr key={i} className={i === 0 ? 'dt-winner-row' : ''}>
                          <td><strong>{c.product}</strong>{i === 0 ? ' 🏆' : ''}</td>
                          <td>{c.orr}%</td><td>{c.cr_rate}%</td><td>{c.median_pfs}mo</td>
                          <td>{c.grade3_crs}%</td><td>{c.grade3_icans}%</td><td>{c.icu_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>Efficacy winner: <strong>{compareData.winner_efficacy}</strong> | Safety winner: <strong>{compareData.winner_safety}</strong></p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
