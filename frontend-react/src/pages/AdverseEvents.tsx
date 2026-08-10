import React, { useState, useCallback } from 'react';
import '../styles/digital-twin.css';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

export default function AdverseEvents() {
  const [activeTab, setActiveTab] = useState<'predict'|'crs_kinetics'|'cytopenia'>('predict');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prediction form
  const [age, setAge] = useState(55);
  const [cancerType, setCancerType] = useState('DLBCL');
  const [tumorBurden, setTumorBurden] = useState(50);
  const [product, setProduct] = useState('axi-cel');
  const [ecog, setEcog] = useState(1);
  const [ldh, setLdh] = useState<number | undefined>(undefined);
  const [ferritin, setFerritin] = useState<number | undefined>(undefined);
  const [prediction, setPrediction] = useState<any>(null);

  // CRS kinetics
  const [crsCostim, setCrsCostim] = useState('CD28');
  const [crsDays, setCrsDays] = useState(30);
  const [crsKinetics, setCrsKinetics] = useState<any>(null);

  // Cytopenia
  const [cytoBaseAnc, setCytoBaseAnc] = useState(4.0);
  const [cytoBasePlt, setCytoBasePlt] = useState(200);
  const [cytoBaseHgb, setCytoBaseHgb] = useState(12);
  const [cytoDays, setCytoDays] = useState(120);
  const [cytoData, setCytoData] = useState<any>(null);

  const fetchPrediction = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/predict-adverse-events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_age: age, cancer_type: cancerType, tumor_burden_mm: tumorBurden, car_t_product: product, ecog, ldh, ferritin }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPrediction(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [age, cancerType, tumorBurden, product, ecog, ldh, ferritin]);

  const fetchCrsKinetics = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/crs-kinetics`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_age: age, tumor_burden_mm: tumorBurden, costimulatory: crsCostim, days: crsDays }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCrsKinetics(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [age, tumorBurden, crsCostim, crsDays]);

  const fetchCytopenia = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/cytopenia-recovery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_age: age, baseline_anc: cytoBaseAnc, baseline_platelets: cytoBasePlt, baseline_hgb: cytoBaseHgb, days: cytoDays }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCytoData(await res.json());
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [age, cytoBaseAnc, cytoBasePlt, cytoBaseHgb, cytoDays]);

  const riskColor = (level: string) => {
    if (level === 'high') return '#ff4757';
    if (level === 'moderate') return '#ffa502';
    if (level === 'low') return '#2ed573';
    return '#a0a0b0';
  };

  const renderRiskCard = (title: string, data: any) => (
    <div className="dt-card-mini">
      <h4>{title}</h4>
      <span className="dt-big-num" style={{ color: riskColor(data.risk_level) }}>
        {typeof data.risk_score === 'number' ? `${(data.risk_score * 100).toFixed(0)}%` : data.risk_level}
      </span>
      <p className="dt-label">{data.risk_level}</p>
      {data.predicted_max_grade !== undefined && <p>Max grade: {data.predicted_max_grade}</p>}
      {data.grade3_plus_probability !== undefined && <p>Grade ≥3: {(data.grade3_plus_probability * 100).toFixed(0)}%</p>}
    </div>
  );

  const renderKineticsChart = (data: any) => {
    const tl = data.timeline;
    const w = 700, h = 300, pad = 50;
    const xStep = (w - 2 * pad) / Math.max(1, tl.days.length - 1);
    const maxIl6 = Math.max(...tl.il6_pg_ml, 1);

    const il6Line = tl.days.map((d: number, i: number) => {
      const x = pad + i * xStep;
      const y = h - pad - (tl.il6_pg_ml[i] / maxIl6) * (h - 2 * pad);
      return `${x},${Math.max(pad, y)}`;
    }).join(' ');

    const tempLine = tl.days.map((d: number, i: number) => {
      const x = pad + i * xStep;
      const y = h - pad - ((tl.temperature_c[i] - 36) / 5.5) * (h - 2 * pad);
      return `${x},${Math.max(pad, y)}`;
    }).join(' ');

    return (
      <div className="dt-chart-container">
        <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <text x={w / 2} y={h - 5} textAnchor="middle" fill="#aaa" fontSize="12">Days</text>
          <polyline points={il6Line} fill="none" stroke="#ff6b6b" strokeWidth="2" />
          <polyline points={tempLine} fill="none" stroke="#ffa502" strokeWidth="2" />
          {/* Grade bars at bottom */}
          {tl.days.map((d: number, i: number) => {
            const grade = tl.crs_grade[i];
            const x = pad + i * xStep;
            if (grade === 0) return null;
            const barH = (grade / 4) * 20;
            return <rect key={i} x={x - 2} y={h - pad + 2} width={4} height={barH} fill={grade >= 3 ? '#ff4757' : grade >= 2 ? '#ffa502' : '#2ed573'} opacity={0.7} />;
          })}
        </svg>
        <div className="dt-chart-legend">
          <span style={{ color: '#ff6b6b' }}>● IL-6</span>
          <span style={{ color: '#ffa502' }}>● Temperature</span>
          <span style={{ color: '#ff4757' }}>■ CRS Grade</span>
        </div>
        <div className="dt-summary-grid">
          <div className="dt-stat"><span className="dt-stat-value">{data.summary.peak_il6}</span><span className="dt-stat-label">Peak IL-6 (pg/mL)</span></div>
          <div className="dt-stat"><span className="dt-stat-value">{data.summary.max_crs_grade}</span><span className="dt-stat-label">Max CRS Grade</span></div>
          <div className="dt-stat"><span className="dt-stat-value">{data.summary.peak_temperature}°C</span><span className="dt-stat-label">Peak Temp</span></div>
          <div className="dt-stat"><span className="dt-stat-value">{data.summary.crs_duration_days}d</span><span className="dt-stat-label">CRS Duration</span></div>
          <div className="dt-stat"><span className="dt-stat-value">{data.summary.peak_ferritin}</span><span className="dt-stat-label">Peak Ferritin</span></div>
        </div>
      </div>
    );
  };

  const renderCytoChart = (data: any) => {
    const tl = data.timeline;
    const w = 700, h = 300, pad = 50;
    const xStep = (w - 2 * pad) / Math.max(1, tl.days.length - 1);
    const maxAnc = Math.max(...tl.anc, 1);
    const maxPlt = Math.max(...tl.platelets, 1);

    const ancLine = tl.days.map((d: number, i: number) => {
      const x = pad + i * xStep;
      const y = h - pad - (tl.anc[i] / maxAnc) * (h - 2 * pad);
      return `${x},${Math.max(pad, y)}`;
    }).join(' ');

    const hgbLine = tl.days.map((d: number, i: number) => {
      const x = pad + i * xStep;
      const y = h - pad - (tl.hemoglobin[i] / 16) * (h - 2 * pad);
      return `${x},${Math.max(pad, y)}`;
    }).join(' ');

    return (
      <div className="dt-chart-container">
        <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth="1" />
          <polyline points={ancLine} fill="none" stroke="#00d2ff" strokeWidth="2" />
          <polyline points={hgbLine} fill="none" stroke="#ff6b6b" strokeWidth="2" />
        </svg>
        <div className="dt-chart-legend">
          <span style={{ color: '#00d2ff' }}>● ANC (×10⁹/L)</span>
          <span style={{ color: '#ff6b6b' }}>● Hemoglobin (g/dL)</span>
        </div>
        {data.summary && (
          <div className="dt-summary-grid">
            <div className="dt-stat"><span className="dt-stat-value">{data.summary.anc_nadir}</span><span className="dt-stat-label">ANC Nadir</span></div>
            <div className="dt-stat"><span className="dt-stat-value">Day {data.summary.anc_nadir_day}</span><span className="dt-stat-label">ANC Nadir Day</span></div>
            <div className="dt-stat"><span className="dt-stat-value">{data.summary.anc_recovery_day ? `Day ${data.summary.anc_recovery_day}` : 'Pending'}</span><span className="dt-stat-label">ANC Recovery</span></div>
            <div className="dt-stat"><span className="dt-stat-value">{data.summary.platelet_nadir}</span><span className="dt-stat-label">Plt Nadir</span></div>
            <div className="dt-stat"><span className="dt-stat-value" style={{ color: data.summary.febrile_neutropenia_risk === 'high' ? '#ff4757' : '#2ed573' }}>{data.summary.febrile_neutropenia_risk}</span><span className="dt-stat-label">FN Risk</span></div>
            <div className="dt-stat"><span className="dt-stat-value">{data.summary.gcsf_recommended ? 'Yes' : 'No'}</span><span className="dt-stat-label">G-CSF Rec.</span></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="digital-twin-page">
      <div className="dt-header">
        <h1>⚠️ Adverse Event Predictor</h1>
        <p>Predict and manage CAR-T therapy adverse events</p>
      </div>

      <div className="dt-tabs">
        {(['predict', 'crs_kinetics', 'cytopenia'] as const).map(tab => (
          <button key={tab} className={`dt-tab ${activeTab === tab ? 'dt-tab-active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'predict' ? '🎯 AE Prediction' : tab === 'crs_kinetics' ? '🌡️ CRS Kinetics' : '🩸 Cytopenia Recovery'}
          </button>
        ))}
      </div>

      {error && <div className="dt-error">{error}</div>}

      {activeTab === 'predict' && (
        <div className="dt-panel">
          <div className="dt-form-grid">
            <div className="dt-field"><label>Age</label><input type="number" value={age} onChange={e => setAge(+e.target.value)} /></div>
            <div className="dt-field"><label>Cancer</label>
              <select value={cancerType} onChange={e => setCancerType(e.target.value)}>
                <option value="DLBCL">DLBCL</option><option value="ALL">ALL</option><option value="MCL">MCL</option><option value="Multiple Myeloma">Multiple Myeloma</option>
              </select>
            </div>
            <div className="dt-field"><label>Tumor Burden (mm)</label><input type="number" value={tumorBurden} onChange={e => setTumorBurden(+e.target.value)} /></div>
            <div className="dt-field"><label>Product</label>
              <select value={product} onChange={e => setProduct(e.target.value)}>
                <option value="axi-cel">Axi-cel</option><option value="tisa-cel">Tisa-cel</option><option value="liso-cel">Liso-cel</option>
                <option value="brexu-cel">Brexu-cel</option><option value="ide-cel">Ide-cel</option><option value="cilta-cel">Cilta-cel</option>
              </select>
            </div>
            <div className="dt-field"><label>ECOG</label><input type="number" value={ecog} onChange={e => setEcog(+e.target.value)} min={0} max={4} /></div>
            <div className="dt-field"><label>LDH (U/L)</label><input type="number" value={ldh || ''} onChange={e => setLdh(+e.target.value || undefined)} placeholder="Optional" /></div>
          </div>
          <button className="dt-btn-primary" onClick={fetchPrediction} disabled={loading}>{loading ? 'Predicting...' : 'Predict AEs'}</button>

          {prediction && (
            <div className="dt-results">
              <div className="dt-overall-risk">
                <h3>Overall Toxicity Risk</h3>
                <span className="dt-big-num" style={{ color: riskColor(prediction.overall_risk_level) }}>
                  {(prediction.overall_toxicity_risk * 100).toFixed(0)}%
                </span>
                <p>ICU Probability: {(prediction.icu_probability * 100).toFixed(0)}%</p>
              </div>
              <div className="dt-ae-cards">
                {renderRiskCard('CRS', prediction.cytokine_release_syndrome)}
                {renderRiskCard('ICANS', prediction.neurotoxicity_icans)}
                {renderRiskCard('Cytopenias', prediction.cytopenias)}
                {renderRiskCard('Infections', prediction.infections)}
                {renderRiskCard('MAS/HLH', prediction.macrophage_activation_syndrome)}
                {renderRiskCard('TLS', prediction.tumor_lysis_syndrome)}
              </div>

              {prediction.cytokine_release_syndrome.management && (
                <div className="dt-section">
                  <h3>CRS Management (Grade {prediction.cytokine_release_syndrome.predicted_max_grade})</h3>
                  <p>{prediction.cytokine_release_syndrome.management.description}</p>
                  <p><strong>Management:</strong> {prediction.cytokine_release_syndrome.management.management}</p>
                </div>
              )}

              {prediction.premedication_recommendations && (
                <div className="dt-section">
                  <h3>Pre-medication</h3>
                  <ul>{prediction.premedication_recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}

              {prediction.organ_toxicity && (
                <div className="dt-section">
                  <h3>Organ Toxicity</h3>
                  <div className="dt-grid-4">
                    {Object.entries(prediction.organ_toxicity).filter(([k]) => k !== 'overall_risk').map(([k, v]: [string, any]) => (
                      <div key={k} className="dt-card-mini"><h4>{k}</h4><p>Risk: {(v.risk * 100).toFixed(0)}%</p><p className="dt-small">{v.monitoring}</p></div>
                    ))}
                  </div>
                </div>
              )}

              {prediction.long_term_complications && (
                <div className="dt-section">
                  <h3>Long-term Complications</h3>
                  <div className="dt-grid-3">
                    {Object.entries(prediction.long_term_complications).map(([k, v]: [string, any]) => (
                      <div key={k} className="dt-card-mini"><h4>{k.replace(/_/g, ' ')}</h4><p>Risk: {(v.risk * 100).toFixed(0)}%</p><p className="dt-small">{v.management || v.note}</p></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'crs_kinetics' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>Costimulatory</label>
              <select value={crsCostim} onChange={e => setCrsCostim(e.target.value)}>
                <option value="CD28">CD28</option><option value="4-1BB">4-1BB</option>
              </select>
            </div>
            <div className="dt-field"><label>Days</label><input type="number" value={crsDays} onChange={e => setCrsDays(+e.target.value)} min={7} max={60} /></div>
            <button className="dt-btn-primary" onClick={fetchCrsKinetics} disabled={loading}>{loading ? 'Simulating...' : 'Simulate'}</button>
          </div>
          {crsKinetics && renderKineticsChart(crsKinetics)}
        </div>
      )}

      {activeTab === 'cytopenia' && (
        <div className="dt-panel">
          <div className="dt-form-row">
            <div className="dt-field"><label>Baseline ANC</label><input type="number" value={cytoBaseAnc} onChange={e => setCytoBaseAnc(+e.target.value)} step={0.5} /></div>
            <div className="dt-field"><label>Baseline Plt</label><input type="number" value={cytoBasePlt} onChange={e => setCytoBasePlt(+e.target.value)} /></div>
            <div className="dt-field"><label>Baseline Hgb</label><input type="number" value={cytoBaseHgb} onChange={e => setCytoBaseHgb(+e.target.value)} step={0.5} /></div>
            <div className="dt-field"><label>Days</label><input type="number" value={cytoDays} onChange={e => setCytoDays(+e.target.value)} /></div>
            <button className="dt-btn-primary" onClick={fetchCytopenia} disabled={loading}>{loading ? 'Simulating...' : 'Simulate'}</button>
          </div>
          {cytoData && renderCytoChart(cytoData)}
        </div>
      )}
    </div>
  );
}
