import React, { useState, useCallback, useRef } from 'react';
import '../styles/digital-twin.css';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

type WizardStep = 'demographics' | 'disease' | 'genomics' | 'treatment' | 'labs' | 'review' | 'results';

interface FormData {
  // Demographics
  age: number; sex: string; weight_kg: number; height_cm: number;
  // Disease
  cancer_type: string; cancer_stage: string; tumor_burden_mm: number;
  ecog: number; extranodal_sites: number; bone_marrow: boolean; cns: boolean;
  // Genomics
  tp53_mutated: boolean; double_hit: boolean; molecular_subtype: string;
  // Treatment
  prior_lines: number; prior_car_t: boolean; prior_sct: boolean;
  product: string; bridging: string;
  // Labs
  ldh: number; ferritin: number; crp: number; il6: number;
  alc: number; platelets: number; hemoglobin: number;
}

const STEPS: { key: WizardStep; icon: string; label: string }[] = [
  { key: 'demographics', icon: '👤', label: 'Demographics' },
  { key: 'disease', icon: '🦠', label: 'Disease' },
  { key: 'genomics', icon: '🧬', label: 'Genomics' },
  { key: 'treatment', icon: '💊', label: 'Treatment' },
  { key: 'labs', icon: '🧪', label: 'Labs' },
  { key: 'review', icon: '📋', label: 'Review' },
  { key: 'results', icon: '📊', label: 'Results' },
];

const DEFAULT_FORM: FormData = {
  age: 55, sex: 'M', weight_kg: 70, height_cm: 170,
  cancer_type: 'DLBCL', cancer_stage: 'III', tumor_burden_mm: 50,
  ecog: 1, extranodal_sites: 1, bone_marrow: false, cns: false,
  tp53_mutated: false, double_hit: false, molecular_subtype: 'Unclassified',
  prior_lines: 3, prior_car_t: false, prior_sct: false,
  product: 'axi-cel', bridging: 'none',
  ldh: 250, ferritin: 400, crp: 15, il6: 8,
  alc: 1.2, platelets: 180, hemoglobin: 11.5,
};

export default function PatientWizard() {
  const [step, setStep] = useState<WizardStep>('demographics');
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [tumorAnim, setTumorAnim] = useState<number[]>([]);
  const animRef = useRef<number | null>(null);

  const update = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const stepIndex = () => STEPS.findIndex(s => s.key === step);
  const goNext = () => {
    const idx = stepIndex();
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };
  const goPrev = () => {
    const idx = stepIndex();
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  const submitReport = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/v5/twin/generate-report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReportData(data);
      setStep('results');
      // Start tumor animation
      startTumorAnimation(data.treatment_simulation.tumor_trajectory);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [form]);

  const startTumorAnimation = (trajectory: any[]) => {
    const sizes = trajectory.map((t: any) => t.size_mm);
    let idx = 0;
    setTumorAnim([sizes[0]]);
    const animate = () => {
      idx++;
      if (idx < sizes.length) {
        setTumorAnim(prev => [...prev, sizes[idx]]);
        animRef.current = window.setTimeout(animate, 300);
      }
    };
    animRef.current = window.setTimeout(animate, 500);
  };

  const downloadHTML = async () => {
    try {
      const res = await fetch(`${API}/api/v5/twin/generate-report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, format: 'html' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CARVanta_Report_${reportData?.report_id || 'report'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setError(e.message); }
  };

  const renderProgressBar = () => (
    <div className="dt-wizard-progress">
      {STEPS.map((s, i) => {
        const current = stepIndex();
        const isCompleted = i < current;
        const isCurrent = i === current;
        return (
          <div key={s.key} className={`dt-wizard-step ${isCompleted ? 'dt-step-done' : ''} ${isCurrent ? 'dt-step-active' : ''}`} onClick={() => { if (i <= current || isCompleted) setStep(s.key); }}>
            <span className="dt-step-icon">{isCompleted ? '✓' : s.icon}</span>
            <span className="dt-step-label">{s.label}</span>
          </div>
        );
      })}
    </div>
  );

  const renderTumorAnimation = () => {
    if (tumorAnim.length === 0) return null;
    const maxSize = Math.max(...tumorAnim, form.tumor_burden_mm);
    const w = 600, h = 280, pad = 50;

    // Animated tumor circle
    const currentSize = tumorAnim[tumorAnim.length - 1];
    const ratio = currentSize / maxSize;
    const tumorRadius = 15 + ratio * 60;
    const tumorColor = ratio > 0.7 ? '#ff4757' : ratio > 0.3 ? '#ffa502' : ratio > 0.05 ? '#2ed573' : '#6366f1';

    // Trajectory line
    const xStep = (w - 2 * pad) / 12;
    const points = tumorAnim.map((size, i) => {
      const x = pad + i * xStep;
      const y = h - pad - (size / maxSize) * (h - 2 * pad);
      return `${x},${Math.max(pad, y)}`;
    }).join(' ');

    return (
      <div className="dt-tumor-animation">
        <div className="dt-tumor-viz-row">
          <div className="dt-tumor-circle-container">
            <div className="dt-tumor-circle" style={{
              width: `${tumorRadius * 2}px`, height: `${tumorRadius * 2}px`,
              background: `radial-gradient(circle, ${tumorColor}88, ${tumorColor}33)`,
              border: `2px solid ${tumorColor}`,
              borderRadius: '50%',
              transition: 'all 0.3s ease',
            }}>
              <span className="dt-tumor-size">{currentSize.toFixed(1)}mm</span>
            </div>
            <p className="dt-small" style={{ textAlign: 'center', marginTop: 8 }}>
              {ratio < 0.05 ? 'Complete Response' : ratio < 0.3 ? 'Partial Response' : ratio < 0.8 ? 'Stable' : 'Disease'}
            </p>
          </div>
          <div className="dt-tumor-chart">
            <svg viewBox={`0 0 ${w} ${h}`} className="dt-svg-chart">
              <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#555" strokeWidth="1" />
              <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#555" strokeWidth="1" />
              <text x={w / 2} y={h - 5} textAnchor="middle" fill="#aaa" fontSize="11">Months</text>
              <text x={12} y={h / 2} textAnchor="middle" fill="#aaa" fontSize="11" transform={`rotate(-90 12 ${h / 2})`}>Tumor (mm)</text>
              {/* Baseline reference */}
              <line x1={pad} y1={h - pad - (form.tumor_burden_mm / maxSize) * (h - 2 * pad)} x2={w - pad} y2={h - pad - (form.tumor_burden_mm / maxSize) * (h - 2 * pad)} stroke="#ff4757" strokeWidth="0.5" strokeDasharray="4,4" />
              <polyline points={points} fill="none" stroke="#00d2ff" strokeWidth="2.5" />
              {/* Current point */}
              {tumorAnim.length > 0 && (
                <circle cx={pad + (tumorAnim.length - 1) * xStep} cy={h - pad - (currentSize / maxSize) * (h - 2 * pad)} r="5" fill="#00d2ff" />
              )}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const riskColor = (level: string) => level === 'high' || level === 'very_high' ? '#ff4757' : level === 'moderate' ? '#ffa502' : '#2ed573';

  return (
    <div className="digital-twin-page">
      <div className="dt-header">
        <h1>🧑‍⚕️ Patient Profile Wizard</h1>
        <p>Step-by-step intake form for CAR-T treatment simulation</p>
      </div>

      {renderProgressBar()}
      {error && <div className="dt-error">{error}</div>}

      {/* Step 1: Demographics */}
      {step === 'demographics' && (
        <div className="dt-panel dt-wizard-panel">
          <h2 className="dt-wizard-title">👤 Patient Demographics</h2>
          <div className="dt-form-grid">
            <div className="dt-field"><label>Age</label><input type="number" value={form.age} onChange={e => update('age', +e.target.value)} min={1} max={100} /></div>
            <div className="dt-field"><label>Sex</label>
              <select value={form.sex} onChange={e => update('sex', e.target.value)}><option value="M">Male</option><option value="F">Female</option></select>
            </div>
            <div className="dt-field"><label>Weight (kg)</label><input type="number" value={form.weight_kg} onChange={e => update('weight_kg', +e.target.value)} /></div>
            <div className="dt-field"><label>Height (cm)</label><input type="number" value={form.height_cm} onChange={e => update('height_cm', +e.target.value)} /></div>
          </div>
          <div className="dt-wizard-nav"><button className="dt-btn-primary" onClick={goNext}>Next →</button></div>
        </div>
      )}

      {/* Step 2: Disease */}
      {step === 'disease' && (
        <div className="dt-panel dt-wizard-panel">
          <h2 className="dt-wizard-title">🦠 Disease Information</h2>
          <div className="dt-form-grid">
            <div className="dt-field"><label>Cancer Type</label>
              <select value={form.cancer_type} onChange={e => update('cancer_type', e.target.value)}>
                <option value="DLBCL">DLBCL</option><option value="ALL">ALL</option><option value="MCL">MCL</option><option value="Multiple Myeloma">Multiple Myeloma</option><option value="FL">Follicular Lymphoma</option>
              </select>
            </div>
            <div className="dt-field"><label>Stage</label>
              <select value={form.cancer_stage} onChange={e => update('cancer_stage', e.target.value)}>
                <option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option>
              </select>
            </div>
            <div className="dt-field"><label>Tumor Burden (mm)</label>
              <input type="range" min={5} max={200} value={form.tumor_burden_mm} onChange={e => update('tumor_burden_mm', +e.target.value)} />
              <span className="dt-range-val">{form.tumor_burden_mm} mm</span>
            </div>
            <div className="dt-field"><label>ECOG Score</label>
              <select value={form.ecog} onChange={e => update('ecog', +e.target.value)}>
                <option value={0}>0 — Fully active</option><option value={1}>1 — Restricted</option>
                <option value={2}>2 — Ambulatory</option><option value={3}>3 — Limited self-care</option>
              </select>
            </div>
            <div className="dt-field"><label>Extranodal Sites</label><input type="number" value={form.extranodal_sites} onChange={e => update('extranodal_sites', +e.target.value)} min={0} max={10} /></div>
            <div className="dt-field dt-checkbox"><label><input type="checkbox" checked={form.bone_marrow} onChange={e => update('bone_marrow', e.target.checked)} /> Bone Marrow Involved</label></div>
            <div className="dt-field dt-checkbox"><label><input type="checkbox" checked={form.cns} onChange={e => update('cns', e.target.checked)} /> CNS Involvement</label></div>
          </div>
          <div className="dt-wizard-nav"><button className="dt-btn-secondary" onClick={goPrev}>← Back</button><button className="dt-btn-primary" onClick={goNext}>Next →</button></div>
        </div>
      )}

      {/* Step 3: Genomics */}
      {step === 'genomics' && (
        <div className="dt-panel dt-wizard-panel">
          <h2 className="dt-wizard-title">🧬 Genomic Profile</h2>
          <div className="dt-form-grid">
            <div className="dt-field"><label>Molecular Subtype</label>
              <select value={form.molecular_subtype} onChange={e => update('molecular_subtype', e.target.value)}>
                <option value="Unclassified">Unclassified</option><option value="GCB">GCB</option><option value="ABC">ABC</option>
              </select>
            </div>
            <div className="dt-field dt-checkbox"><label><input type="checkbox" checked={form.tp53_mutated} onChange={e => update('tp53_mutated', e.target.checked)} /> TP53 Mutated</label></div>
            <div className="dt-field dt-checkbox"><label><input type="checkbox" checked={form.double_hit} onChange={e => update('double_hit', e.target.checked)} /> Double-Hit (MYC + BCL2/BCL6)</label></div>
          </div>
          {(form.tp53_mutated || form.double_hit) && (
            <div className="dt-warning-box">⚠️ High-risk genomic features detected — outcomes may be affected</div>
          )}
          <div className="dt-wizard-nav"><button className="dt-btn-secondary" onClick={goPrev}>← Back</button><button className="dt-btn-primary" onClick={goNext}>Next →</button></div>
        </div>
      )}

      {/* Step 4: Treatment */}
      {step === 'treatment' && (
        <div className="dt-panel dt-wizard-panel">
          <h2 className="dt-wizard-title">💊 Treatment History</h2>
          <div className="dt-form-grid">
            <div className="dt-field"><label>Prior Lines of Therapy</label><input type="number" value={form.prior_lines} onChange={e => update('prior_lines', +e.target.value)} min={0} max={10} /></div>
            <div className="dt-field"><label>CAR-T Product</label>
              <select value={form.product} onChange={e => update('product', e.target.value)}>
                <option value="axi-cel">Axi-cel (Yescarta)</option><option value="tisa-cel">Tisa-cel (Kymriah)</option>
                <option value="liso-cel">Liso-cel (Breyanzi)</option><option value="brexu-cel">Brexu-cel (Tecartus)</option>
                <option value="ide-cel">Ide-cel (Abecma)</option><option value="cilta-cel">Cilta-cel (Carvykti)</option>
              </select>
            </div>
            <div className="dt-field dt-checkbox"><label><input type="checkbox" checked={form.prior_car_t} onChange={e => update('prior_car_t', e.target.checked)} /> Prior CAR-T Therapy</label></div>
            <div className="dt-field dt-checkbox"><label><input type="checkbox" checked={form.prior_sct} onChange={e => update('prior_sct', e.target.checked)} /> Prior Stem Cell Transplant</label></div>
            <div className="dt-field"><label>Bridging Therapy</label>
              <select value={form.bridging} onChange={e => update('bridging', e.target.value)}>
                <option value="none">None</option><option value="radiation">Radiation</option><option value="chemotherapy">Chemotherapy</option>
                <option value="targeted">Targeted Therapy</option><option value="steroids">Steroids only</option>
              </select>
            </div>
          </div>
          <div className="dt-wizard-nav"><button className="dt-btn-secondary" onClick={goPrev}>← Back</button><button className="dt-btn-primary" onClick={goNext}>Next →</button></div>
        </div>
      )}

      {/* Step 5: Labs */}
      {step === 'labs' && (
        <div className="dt-panel dt-wizard-panel">
          <h2 className="dt-wizard-title">🧪 Baseline Labs</h2>
          <div className="dt-form-grid">
            <div className="dt-field"><label>LDH (U/L)</label><input type="number" value={form.ldh} onChange={e => update('ldh', +e.target.value)} /></div>
            <div className="dt-field"><label>Ferritin (ng/mL)</label><input type="number" value={form.ferritin} onChange={e => update('ferritin', +e.target.value)} /></div>
            <div className="dt-field"><label>CRP (mg/L)</label><input type="number" value={form.crp} onChange={e => update('crp', +e.target.value)} /></div>
            <div className="dt-field"><label>IL-6 (pg/mL)</label><input type="number" value={form.il6} onChange={e => update('il6', +e.target.value)} /></div>
            <div className="dt-field"><label>ALC (×10⁹/L)</label><input type="number" value={form.alc} onChange={e => update('alc', +e.target.value)} step={0.1} /></div>
            <div className="dt-field"><label>Platelets (×10⁹/L)</label><input type="number" value={form.platelets} onChange={e => update('platelets', +e.target.value)} /></div>
            <div className="dt-field"><label>Hemoglobin (g/dL)</label><input type="number" value={form.hemoglobin} onChange={e => update('hemoglobin', +e.target.value)} step={0.5} /></div>
          </div>
          <div className="dt-wizard-nav"><button className="dt-btn-secondary" onClick={goPrev}>← Back</button><button className="dt-btn-primary" onClick={goNext}>Next →</button></div>
        </div>
      )}

      {/* Step 6: Review */}
      {step === 'review' && (
        <div className="dt-panel dt-wizard-panel">
          <h2 className="dt-wizard-title">📋 Review & Generate</h2>
          <div className="dt-review-grid">
            <div className="dt-review-section">
              <h4>Demographics</h4>
              <p>{form.age}yo {form.sex}, {form.weight_kg}kg, {form.height_cm}cm</p>
            </div>
            <div className="dt-review-section">
              <h4>Disease</h4>
              <p>{form.cancer_type} Stage {form.cancer_stage}, ECOG {form.ecog}</p>
              <p>Tumor burden: {form.tumor_burden_mm}mm</p>
            </div>
            <div className="dt-review-section">
              <h4>Genomics</h4>
              <p>TP53: {form.tp53_mutated ? '⚠️ Mutated' : '✅ Wild-type'}</p>
              <p>Double-hit: {form.double_hit ? '⚠️ Yes' : '✅ No'}</p>
            </div>
            <div className="dt-review-section">
              <h4>Treatment</h4>
              <p>{form.prior_lines} prior lines → {form.product}</p>
              <p>Prior CAR-T: {form.prior_car_t ? 'Yes' : 'No'}</p>
            </div>
            <div className="dt-review-section">
              <h4>Key Labs</h4>
              <p>LDH: {form.ldh} | Ferritin: {form.ferritin} | CRP: {form.crp}</p>
              <p>ALC: {form.alc} | Plt: {form.platelets} | Hgb: {form.hemoglobin}</p>
            </div>
          </div>
          <div className="dt-wizard-nav">
            <button className="dt-btn-secondary" onClick={goPrev}>← Back</button>
            <button className="dt-btn-primary dt-btn-large" onClick={submitReport} disabled={loading}>
              {loading ? '🔬 Generating Simulation...' : '🚀 Generate Report'}
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Results */}
      {step === 'results' && reportData && (
        <div className="dt-panel dt-wizard-panel">
          <h2 className="dt-wizard-title">📊 Simulation Results</h2>

          {/* Risk & Response */}
          <div className="dt-summary-cards">
            <div className="dt-card-mini">
              <h4>Risk Level</h4>
              <span className="dt-big-num" style={{ color: riskColor(reportData.risk_assessment.risk_level) }}>
                {reportData.risk_assessment.risk_level.toUpperCase()}
              </span>
              <p>Score: {reportData.risk_assessment.overall_risk_score}</p>
            </div>
            <div className="dt-card-mini">
              <h4>Predicted Response</h4>
              <span className="dt-big-num" style={{ color: reportData.treatment_simulation.predicted_response === 'CR' ? '#2ed573' : reportData.treatment_simulation.predicted_response === 'PR' ? '#7bed9f' : '#ff4757' }}>
                {reportData.treatment_simulation.predicted_response}
              </span>
            </div>
            <div className="dt-card-mini"><h4>ORR Probability</h4><span className="dt-big-num">{reportData.treatment_simulation.orr_probability}%</span></div>
            <div className="dt-card-mini"><h4>Est. PFS</h4><span className="dt-big-num">{reportData.treatment_simulation.predicted_pfs_months}mo</span></div>
            <div className="dt-card-mini"><h4>Max CRS</h4><span className="dt-big-num">Grade {reportData.adverse_events.crs.max_grade}</span></div>
            <div className="dt-card-mini"><h4>Total Cost</h4><span className="dt-big-num" style={{ fontSize: 16 }}>{reportData.cost_estimate.total.formatted}</span></div>
          </div>

          {/* Animated Tumor Visualization */}
          <div className="dt-section">
            <h3>🫘 Tumor Regression (Animated)</h3>
            {renderTumorAnimation()}
          </div>

          {/* Risk Factors */}
          {reportData.risk_assessment.factors.length > 0 && (
            <div className="dt-section">
              <h3>Risk Factors</h3>
              {reportData.risk_assessment.factors.map((f: any, i: number) => (
                <div key={i} className="dt-risk-factor-row">
                  <span>{f.factor}</span>
                  <span className={`dt-risk-badge dt-risk-${f.impact}`}>+{f.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Adverse Events */}
          <div className="dt-section">
            <h3>Adverse Events</h3>
            <p className="dt-small"><strong>CRS:</strong> {reportData.adverse_events.crs.management}</p>
            <p className="dt-small"><strong>ICANS:</strong> {reportData.adverse_events.icans.management}</p>
          </div>

          {/* Recommendations */}
          <div className="dt-section">
            <h3>📌 Recommendations</h3>
            <ul className="dt-rec-list">
              {reportData.recommendations.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="dt-wizard-nav">
            <button className="dt-btn-secondary" onClick={() => { setStep('demographics'); setReportData(null); setTumorAnim([]); }}>🔄 New Patient</button>
            <button className="dt-btn-primary" onClick={downloadHTML}>📥 Download Report (HTML)</button>
          </div>
        </div>
      )}
    </div>
  );
}
