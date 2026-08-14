import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import api from '../api/client';
import { runODESimulation } from '../utils/bioSimulationEngine';
import '../styles/digital-twin.css';

/* ═══════════════════════════════════════════════════════════════════════════════
   CARVanta – Patient Digital Twin v5
   Full-featured frontend surfacing ALL backend engines:
     1. Immune Simulation (tumor regression, T-cell expansion, IL-6)
     2. CRS Risk Assessment (multi-factor scoring)
     3. Cancer-Specific Profiles (TME, clonal evolution)
     4. PK/PD Engine (compartmental pharmacokinetics)
     5. CAR-T Product Comparison (FDA-approved products)
     6. Biomarker Trajectory Predictions (6 organ systems)
   ═══════════════════════════════════════════════════════════════════════════════ */

const PRESETS = [
    { name: '👶 Pediatric ALL (5yo)', params: { patient_age: 5, cancer_stage: 'II', tumor_burden_mm: 25, antigen_expression: 0.9, prior_car_t: false, cancer_type: 'B-cell ALL' } },
    { name: '🧑 Adult DLBCL (45yo)', params: { patient_age: 45, cancer_stage: 'III', tumor_burden_mm: 60, antigen_expression: 0.75, prior_car_t: false, cancer_type: 'DLBCL' } },
    { name: '👴 Relapsed Myeloma (62yo)', params: { patient_age: 62, cancer_stage: 'IV', tumor_burden_mm: 90, antigen_expression: 0.6, prior_car_t: true, cancer_type: 'Multiple Myeloma', ldh: 450 } },
    { name: '⚠️ Aggressive MCL (58yo)', params: { patient_age: 58, cancer_stage: 'IV', tumor_burden_mm: 120, antigen_expression: 0.8, prior_car_t: false, cancer_type: 'Mantle Cell Lymphoma', ldh: 600 } },
];

type TabKey = 'body' | 'setup' | 'results' | 'crs' | 'cancer' | 'pkpd' | 'products' | 'biomarkers';

export default function DigitalTwin() {
    // ─── State: Patient Parameters ────────────────────────────────────────
    const [params, setParams] = useState<any>({
        patient_age: 45, patient_weight: 70, cancer_type: 'B-cell Lymphoma',
        cancer_stage: 'III', tumor_burden_mm: 50, t_cell_dose: 1e8,
        antigen_expression: 0.7, prior_car_t: false, lymphodepletion: true,
        alc: null, ldh: null, days: 365,
    });

    // ─── State: Results ───────────────────────────────────────────────────
    const [result, setResult] = useState<any>(null);
    const [crsRisk, setCrsRisk] = useState<any>(null);
    const [cancerProfiles, setCancerProfiles] = useState<any[]>([]);
    const [cancerSim, setCancerSim] = useState<any>(null);
    const [pkResult, setPkResult] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [productOutcome, setProductOutcome] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState('axi-cel');
    const [biomarkers, setBiomarkers] = useState<any>(null);

    // ─── State: UI & Human Body Twin ──────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<TabKey>('body');
    const [simDay, setSimDay] = useState<number>(5);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [selectedOrgan, setSelectedOrgan] = useState<string>('');

    // ─── 3D Biological Twin State ─────────────────────────────────────────
    const [showBloodFlow, setShowBloodFlow] = useState(true);
    const [showCarTCells, setShowCarTCells] = useState(true);
    const [showCytokines, setShowCytokines] = useState(true);
    const [showImmuneNet, setShowImmuneNet] = useState(true);
    const canvasRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<any>(null);

    // ─── Load reference data & Auto-run simulation on mount ───────────────
    useEffect(() => {
        loadReferenceData();
        runInitialSimulation();
    }, []);

    // ─── Real-Time PK/PD & Tumor-Immune ODE Simulation Engine ─────────────
    const odeSimResult = useMemo(() => {
        return runODESimulation(params, selectedProduct);
    }, [params, selectedProduct]);

    // Play/Pause animation timer — advances through full ODE trajectory
    const maxSimDay = odeSimResult.trajectory.length - 1;
    useEffect(() => {
        let interval: any = null;
        if (isPlaying) {
            interval = setInterval(() => {
                setSimDay(prev => (prev >= maxSimDay ? 0 : prev + 1));
            }, 120);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isPlaying, maxSimDay]);

    const runInitialSimulation = async () => {
        setLoading(true);
        try {
            const [simRes, crsRes] = await Promise.all([
                api.post('/api/v5/twin/simulate', params),
                api.post('/api/v5/twin/crs-risk', {
                    tumor_burden: params.tumor_burden_mm,
                    cancer_stage: params.cancer_stage,
                    ldh: params.ldh, prior_car_t: params.prior_car_t,
                    patient_age: params.patient_age,
                }),
            ]);
            setResult(simRes.data);
            setCrsRisk(crsRes.data);
        } catch (e: any) {
            console.error('Initial twin simulation load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadReferenceData = async () => {
        try {
            const [profilesRes, productsRes] = await Promise.allSettled([
                api.get('/api/v5/twin/cancer-profiles'),
                api.get('/api/v5/twin/products'),
            ]);
            if (profilesRes.status === 'fulfilled') {
                const data = profilesRes.value.data;
                setCancerProfiles(Array.isArray(data) ? data : data?.profiles || []);
            }
            if (productsRes.status === 'fulfilled') {
                const data = productsRes.value.data;
                setProducts(Array.isArray(data) ? data : data?.products || []);
            }
        } catch (e) { console.error(e); }
    };

    // ─── Run Full Simulation ──────────────────────────────────────────────
    const runSimulation = async () => {
        setLoading(true); setError('');
        try {
            const [simRes, crsRes] = await Promise.all([
                api.post('/api/v5/twin/simulate', params),
                api.post('/api/v5/twin/crs-risk', {
                    tumor_burden: params.tumor_burden_mm,
                    cancer_stage: params.cancer_stage,
                    ldh: params.ldh, prior_car_t: params.prior_car_t,
                    patient_age: params.patient_age,
                }),
            ]);
            setResult(simRes.data);
            setCrsRisk(crsRes.data);
            setActiveTab('results');
        } catch (e: any) { setError(e.message || 'Simulation failed'); }
        finally { setLoading(false); }
    };

    // ─── Run Cancer-Specific Simulation ───────────────────────────────────
    const runCancerSim = async (targetCancerType?: string) => {
        const typeToSim = targetCancerType || params.cancer_type;
        setLoading(true); setError('');
        try {
            const res = await api.post('/api/v5/twin/simulate-cancer', {
                cancer_type: typeToSim,
                days: params.days,
                tumor_burden_mm: params.tumor_burden_mm,
                patient_age: params.patient_age,
                prior_lines: 2,
                ecog_status: 1,
            });
            if (res.data?.error) {
                setError(res.data.error);
                setCancerSim(null);
            } else {
                setCancerSim(res.data);
            }
            setActiveTab('cancer');
        } catch (e: any) {
            console.error('Cancer sim error:', e);
            setError(e.message || 'Cancer sim failed');
            setCancerSim(null);
        } finally {
            setLoading(false);
        }
    };

    // ─── Run PK/PD Simulation ─────────────────────────────────────────────
    const runPKSimulation = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.post('/api/v5/twin/pk-simulation', {
                days: 60,
                infusion_dose: params.t_cell_dose,
                patient_weight: params.patient_weight,
                tumor_burden_ml: params.tumor_burden_mm,
                cancer_category: 'hematologic',
                lymphodepletion: params.lymphodepletion,
            });
            setPkResult(res.data);
            setActiveTab('pkpd');
        } catch (e: any) { setError(e.message || 'PK simulation failed'); }
        finally { setLoading(false); }
    };

    // ─── Run Product Outcome Prediction ───────────────────────────────────
    const runProductPrediction = async (productKey: string) => {
        setLoading(true); setError('');
        setSelectedProduct(productKey);
        try {
            const res = await api.post('/api/v5/twin/predict-product-outcome', {
                product_key: productKey,
                patient_age: params.patient_age,
                cancer_stage: params.cancer_stage,
                tumor_burden_mm: params.tumor_burden_mm,
                prior_lines: 3,
                ecog: 1,
                ldh: params.ldh,
            });
            setProductOutcome(res.data);
            setActiveTab('products');
        } catch (e: any) { setError(e.message || 'Product prediction failed'); }
        finally { setLoading(false); }
    };

    // ─── Run Biomarker Prediction ─────────────────────────────────────────
    const runBiomarkerPrediction = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.post('/api/v5/twin/biomarkers', {
                days: 90,
                cancer_type: params.cancer_type,
                car_t_target: 'CD19',
                crs_severity: 0.5,
                patient_age: params.patient_age,
            });
            setBiomarkers(res.data);
            setActiveTab('biomarkers');
        } catch (e: any) { setError(e.message || 'Biomarker prediction failed'); }
        finally { setLoading(false); }
    };

    const applyPreset = (preset: any) => setParams((p: any) => ({ ...p, ...preset.params }));
    const upd = (field: string, val: any) => setParams((p: any) => ({ ...p, [field]: val }));

    const s = result?.summary;
    const t = result?.timeline;

    // ─── Chart Renderer ───────────────────────────────────────────────────
    const renderChart = (data: number[], color: string, label: string, maxVal?: number) => {
        if (!data || data.length === 0) return null;
        const max = maxVal || Math.max(...data, 1);
        const min = Math.min(...data);
        const w = 640, h = 180;
        const padL = 55, padR = 15, padT = 10, padB = 28;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;

        const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
        const toY = (v: number) => padT + chartH - (v / max) * chartH;

        const points = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
        const areaPoints = `${padL},${padT + chartH} ${points} ${padL + chartW},${padT + chartH}`;

        // Grid: 4 horizontal lines
        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
            const yPos = padT + chartH - frac * chartH;
            const val = (frac * max);
            return { y: yPos, label: val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val >= 1 ? val.toFixed(0) : val.toFixed(2) };
        });

        // X-axis: 5 evenly spaced day labels
        const totalDays = data.length * Math.floor(params.days / data.length);
        const xTicks = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
            x: padL + frac * chartW,
            label: `D${Math.round(frac * totalDays)}`,
        }));

        // Key data points: peak, minimum, last
        const peakIdx = data.indexOf(Math.max(...data));
        const minIdx = data.indexOf(Math.min(...data));
        const lastIdx = data.length - 1;
        const keyPoints = [
            { idx: peakIdx, val: data[peakIdx], type: 'peak' },
            { idx: minIdx, val: data[minIdx], type: 'min' },
            { idx: lastIdx, val: data[lastIdx], type: 'last' },
        ].filter((p, i, arr) => arr.findIndex(a => a.idx === p.idx) === i); // deduplicate

        return (
            <div className="twin-chart">
                <div className="twin-chart-label">{label}</div>
                <svg viewBox={`0 0 ${w} ${h}`} className="twin-svg">
                    <defs>
                        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {gridLines.map((g, i) => (
                        <g key={i}>
                            <line x1={padL} y1={g.y} x2={padL + chartW} y2={g.y}
                                stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
                            <text x={padL - 8} y={g.y + 3} textAnchor="end"
                                fill="#64748b" fontSize="9" fontFamily="monospace">{g.label}</text>
                        </g>
                    ))}

                    {/* X-axis ticks */}
                    {xTicks.map((xt, i) => (
                        <text key={i} x={xt.x} y={h - 5} textAnchor="middle"
                            fill="#64748b" fontSize="9" fontFamily="monospace">{xt.label}</text>
                    ))}

                    {/* Area fill */}
                    <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />

                    {/* Main line */}
                    <polyline points={points} fill="none" stroke={color} strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round" />

                    {/* Key data points */}
                    {keyPoints.map((p, i) => (
                        <g key={i}>
                            <circle cx={toX(p.idx)} cy={toY(p.val)} r="4"
                                fill={color} stroke="#0f172a" strokeWidth="1.5" />
                            <text x={toX(p.idx)} y={toY(p.val) - 8} textAnchor="middle"
                                fill={color} fontSize="9" fontWeight="700">
                                {p.val >= 1e9 ? `${(p.val / 1e9).toFixed(1)}B` :
                                    p.val >= 1e6 ? `${(p.val / 1e6).toFixed(1)}M` :
                                        p.val >= 1000 ? `${(p.val / 1000).toFixed(0)}k` :
                                            p.val >= 1 ? p.val.toFixed(0) : p.val.toFixed(2)}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    // ─── Multi-line Chart ─────────────────────────────────────────────────
    const renderMultiChart = (datasets: { data: number[], color: string, label: string }[], title: string) => {
        const w = 640, h = 180;
        const padL = 55, padR = 15, padT = 10, padB = 28;
        const chartW = w - padL - padR;
        const chartH = h - padT - padB;
        const allVals = datasets.flatMap(d => d.data);
        const max = Math.max(...allVals, 1);

        const toX = (i: number, len: number) => padL + (i / (len - 1)) * chartW;
        const toY = (v: number) => padT + chartH - (v / max) * chartH;

        const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
            y: padT + chartH - frac * chartH,
            label: (frac * max) >= 1000 ? `${((frac * max) / 1000).toFixed(0)}k` : (frac * max).toFixed(0),
        }));

        return (
            <div className="twin-chart">
                <div className="twin-chart-label">{title}</div>
                <svg viewBox={`0 0 ${w} ${h}`} className="twin-svg">
                    {gridLines.map((g, i) => (
                        <g key={i}>
                            <line x1={padL} y1={g.y} x2={padL + chartW} y2={g.y}
                                stroke="rgba(148,163,184,0.12)" strokeWidth="0.5" />
                            <text x={padL - 8} y={g.y + 3} textAnchor="end"
                                fill="#64748b" fontSize="9" fontFamily="monospace">{g.label}</text>
                        </g>
                    ))}
                    {datasets.map((ds, idx) => {
                        if (!ds.data || ds.data.length === 0) return null;
                        const pts = ds.data.map((v, i) =>
                            `${toX(i, ds.data.length)},${toY(v)}`
                        ).join(' ');
                        return (
                            <polyline key={idx} points={pts} fill="none" stroke={ds.color} strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"
                                strokeDasharray={idx > 0 ? "6 3" : "none"} />
                        );
                    })}
                </svg>
                <div className="twin-chart-legend">
                    {datasets.map((ds, i) => (
                        <span key={i} className="legend-item">
                            <span className="legend-swatch" style={{ background: ds.color }} />
                            {ds.label}
                        </span>
                    ))}
                </div>
            </div>
        );
    };


    // ─── 3D Biological Simulation Data ──────────────────────────────────────
    const getSimValues = useCallback((day: number) => {
        const traj = odeSimResult.trajectory;
        const d = Math.max(0, Math.min(day, traj.length - 1));
        const step = traj[d] || traj[0];
        return {
            d,
            tumorMm: step.tumorMm,
            tumorCells: step.tumorCells,
            tCells: step.tCells,
            il6: step.il6,
            crsGrade: step.crsGrade,
            bodyTemp: step.bodyTemp,
            heartRate: step.heartRate,
            spO2: step.spO2,
            exhaustion: step.exhaustion,
            response: step.response,
        };
    }, [odeSimResult]);

    const getOrganDetails = useCallback((day: number) => {
        const { d, tumorMm, tCells, il6, crsGrade, bodyTemp, heartRate, spO2 } = getSimValues(day);
        const brainColor = il6 > 200 ? '#ef4444' : il6 > 80 ? '#f59e0b' : '#10b981';
        const lungsColor = il6 > 150 ? '#ef4444' : il6 > 60 ? '#f59e0b' : '#10b981';
        const heartColor = il6 > 180 ? '#f59e0b' : '#10b981';
        const liverColor = il6 > 120 ? '#f59e0b' : '#10b981';
        const tumorColor = tumorMm > (params.tumor_burden_mm * 0.5) ? '#ef4444' : tumorMm > 5 ? '#f59e0b' : '#10b981';
        const spleenColor = '#818cf8';
        const marrowColor = d < 10 ? '#f59e0b' : '#10b981';
        const kidneyColor = il6 > 200 ? '#f59e0b' : '#10b981';

        return {
            brain: { name: 'Brain (ICANS & Neurobiology)', icon: '🧠', color: brainColor, risk: il6 > 200 ? 'High Neurotoxicity Risk' : il6 > 80 ? 'Moderate ICANS Risk' : 'Normal / Low Risk', riskClass: il6 > 200 ? '#ef4444' : il6 > 80 ? '#f59e0b' : '#10b981', metrics: [{ name: 'CSF IL-6', val: `${(il6 * 0.15).toFixed(1)} pg/mL` }, { name: 'BBB Permeability', val: il6 > 100 ? '2.8× baseline' : '1.1× baseline' }, { name: 'ICANS Grade', val: crsGrade >= 3 ? 'Grade 2' : crsGrade >= 1 ? 'Grade 1' : 'Grade 0' }, { name: 'Astrocyte Stress', val: il6 > 100 ? 'Elevated' : 'Normal' }], mechanism: 'Circulating systemic cytokines (IL-6, IL-1b, TNF-alpha) breach the blood-brain barrier during peak CAR-T proliferation, activating CNS microglia and astrocytes.', protocol: crsGrade >= 2 ? 'Initiate Dexamethasone 10mg IV q6h. Continuous neuro checks & EEG monitoring.' : 'Standard neurological assessments q4h.' },
            lungs: { name: 'Lungs (Pulmonary & Capillary Leak)', icon: '🫁', color: lungsColor, risk: il6 > 150 ? 'Capillary Leak Risk' : il6 > 60 ? 'Mild Infiltrate' : 'Normal Respiration', riskClass: il6 > 150 ? '#ef4444' : il6 > 60 ? '#f59e0b' : '#10b981', metrics: [{ name: 'Capillary Leak Index', val: (1.0 + il6 / 150).toFixed(2) }, { name: 'SpO2 Baseline', val: `${spO2}%` }, { name: 'Respiration Rate', val: `${Math.min(32, 16 + Math.round(il6 / 25))} bpm` }, { name: 'Alveolar Fluid', val: il6 > 150 ? 'Moderate Edema' : 'Clear' }], mechanism: 'Endothelial activation by circulating inflammatory mediators increases microvascular permeability in pulmonary capillaries.', protocol: il6 > 150 ? 'Administer supplemental O2. Give Tocilizumab 8mg/kg IV infusion.' : 'Routine SpO2 telemetry monitoring.' },
            heart: { name: 'Heart (Cardiovascular Hemodynamics)', icon: '🫀', color: heartColor, risk: il6 > 180 ? 'Tachycardia / High Output' : 'Stable Hemodynamics', riskClass: il6 > 180 ? '#f59e0b' : '#10b981', metrics: [{ name: 'Heart Rate', val: `${heartRate} bpm` }, { name: 'Troponin-I', val: `${(0.01 + (il6 > 200 ? 0.12 : 0.01)).toFixed(2)} ng/mL` }, { name: 'Cardiac Output', val: `${(5.0 + il6 / 100).toFixed(1)} L/min` }, { name: 'Vascular Resistance', val: il6 > 150 ? 'Decreased (SVR)' : 'Normal' }], mechanism: 'Hyperdynamic circulatory response secondary to systemic inflammatory vasodilation during cytokine release syndrome.', protocol: il6 > 180 ? 'Continuous cardiac telemetry, maintain fluid resuscitation, order ECG & Troponin.' : 'Standard vital sign monitoring.' },
            liver: { name: 'Liver (Hepatic Clearance & Metabolism)', icon: '🫁', color: liverColor, risk: il6 > 120 ? 'Transaminitis Risk' : 'Normal Function', riskClass: il6 > 120 ? '#f59e0b' : '#10b981', metrics: [{ name: 'ALT', val: `${Math.round(25 + il6 * 0.4)} U/L` }, { name: 'AST', val: `${Math.round(22 + il6 * 0.45)} U/L` }, { name: 'Bilirubin', val: `${(0.6 + il6 / 200).toFixed(1)} mg/dL` }, { name: 'Sinusoidal Stress', val: il6 > 150 ? 'Moderate' : 'Low' }], mechanism: 'Hepatic endothelial and Kupffer cell activation as liver processes immune complexes and cell lysis byproducts.', protocol: il6 > 120 ? 'Monitor LFTs daily. Avoid hepatotoxic concomitant medications.' : 'Baseline weekly LFT screen.' },
            spleen: { name: 'Spleen & Lymphatics (CAR-T Proliferation Hub)', icon: '🛡️', color: spleenColor, risk: 'Active T-Cell Expansion', riskClass: '#818cf8', metrics: [{ name: 'CAR-T Expansion', val: `${(tCells / 1e8).toFixed(1)}× dose` }, { name: 'Proliferation Index', val: d <= 14 ? 'Peak (95th%)' : 'Memory Phase' }, { name: 'Nodal Diameter', val: `${Math.max(8, Math.round(25 - (d / 180) * 15))} mm` }, { name: 'Memory Fraction', val: d > 30 ? '35% Central Memory' : '5% Memory' }], mechanism: 'Secondary lymphoid organs serve as the primary anatomical niche for CAR-T cell secondary stimulation and memory formation.', protocol: 'Confirm adequate pre-infusion lymphodepletion regimen (Fludarabine + Cyclophosphamide).' },
            tumor: { name: `Primary Tumor Site (${params.cancer_type})`, icon: '🎯', color: tumorColor, risk: tumorMm > (params.tumor_burden_mm * 0.5) ? 'Active Tumor Mass' : tumorMm > 5 ? 'Partial Regression' : 'Complete Clearance (CR)', riskClass: tumorMm > (params.tumor_burden_mm * 0.5) ? '#ef4444' : tumorMm > 5 ? '#f59e0b' : '#10b981', metrics: [{ name: 'Tumor Burden', val: `${tumorMm.toFixed(1)} mm` }, { name: 'Tumor Reduction', val: `${Math.max(0, Math.min(100, (((params.tumor_burden_mm - tumorMm) / params.tumor_burden_mm) * 100))).toFixed(0)}%` }, { name: 'Cell Lysis Rate', val: d <= 14 ? '1.2×10⁸ cells/day' : '0.05×10⁸ cells/day' }, { name: 'Antigen Density', val: `${(params.antigen_expression * 100).toFixed(0)}%` }], mechanism: 'Perforin- and granzyme-mediated apoptosis triggered by CAR synthetic receptor binding to target surface antigen.', protocol: 'Schedule Day 30 and Day 90 PET/CT scans to document clinical response (Lugano criteria).' },
            kidney: { name: 'Kidneys (Renal Clearance & Filtration)', icon: '🩺', color: kidneyColor, risk: il6 > 200 ? 'Prerenal Azotemia Risk' : 'Normal GFR', riskClass: il6 > 200 ? '#f59e0b' : '#10b981', metrics: [{ name: 'GFR', val: `${Math.max(60, 110 - Math.round(il6 / 10))} mL/min` }, { name: 'Creatinine', val: `${(0.9 + il6 / 250).toFixed(2)} mg/dL` }, { name: 'Perfusion Index', val: il6 > 150 ? 'Mild Hypoperfusion' : 'Optimal' }, { name: 'Urine Output', val: 'Normal (>0.5 mL/kg/hr)' }], mechanism: 'Transient decrease in renal perfusion possible during high-grade fever and capillary leak syndrome.', protocol: 'Maintain IV hydration at 150-200 mL/hr. Monitor fluid intake/output hourly during CRS.' },
            marrow: { name: 'Bone Marrow (Hematopoiesis & Cytopenias)', icon: '🦴', color: marrowColor, risk: d < 14 ? 'Post-Lymphodepletion Nadir' : 'Hematopoietic Recovery', riskClass: d < 14 ? '#f59e0b' : '#10b981', metrics: [{ name: 'ANC', val: `${(Math.max(0.4, 2.5 - Math.exp(-d / 10) * 1.8)).toFixed(1)} ×10⁹/L` }, { name: 'Platelets', val: `${Math.round(Math.max(30, 210 - Math.exp(-d / 14) * 150))} k/µL` }, { name: 'ALC', val: `${(0.3 + (d / 180) * 1.2).toFixed(1)} ×10⁹/L` }, { name: 'Cytopenia Grade', val: d < 10 ? 'Grade 3 Neutropenia' : 'Grade 0-1' }], mechanism: 'Chemotherapy-induced hematopoietic stem cell suppression followed by marrow recovery and CAR-T memory persistence.', protocol: d < 10 ? 'Neutropenic precautions. Administer G-CSF (Filgrastim 5mcg/kg/day) if ANC < 0.5×10⁹/L.' : 'Routine complete blood count (CBC) monitoring.' },
        };
    }, [getSimValues, params]);

    // ─── Three.js Scene Setup ──────────────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'body' || !canvasRef.current) return;
        const container = canvasRef.current;
        // Prevent re-init
        if (sceneRef.current?.renderer) {
            container.appendChild(sceneRef.current.renderer.domElement);
            return;
        }

        const w = container.clientWidth, h = container.clientHeight;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050510, 0.003);

        const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
        camera.position.set(0, 10, 120);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.setClearColor(0x050510);
        renderer.domElement.className = 'bio-sim-canvas';
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 50;
        controls.maxDistance = 250;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;

        // ── Ambient + point lights ──
        scene.add(new THREE.AmbientLight(0x1a1a3e, 0.6));
        const pointLight = new THREE.PointLight(0x6366f1, 1.5, 300);
        pointLight.position.set(20, 60, 80);
        scene.add(pointLight);
        const pointLight2 = new THREE.PointLight(0x4ECDC4, 0.8, 250);
        pointLight2.position.set(-40, -20, 60);
        scene.add(pointLight2);

        // ── Organ positions (anatomical 3D layout) ──
        const ORGANS: Record<string, { pos: THREE.Vector3; color: number; label: string; baseRadius: number }> = {
            brain:  { pos: new THREE.Vector3(0, 45, 0),     color: 0x10b981, label: 'BRAIN',  baseRadius: 4.5 },
            lungs:  { pos: new THREE.Vector3(-12, 25, 3),   color: 0x10b981, label: 'LUNGS',  baseRadius: 4 },
            heart:  { pos: new THREE.Vector3(5, 22, 8),     color: 0x10b981, label: 'HEART',  baseRadius: 3.5 },
            liver:  { pos: new THREE.Vector3(-10, 12, 5),   color: 0x10b981, label: 'LIVER',  baseRadius: 4 },
            spleen: { pos: new THREE.Vector3(12, 15, 4),    color: 0x818cf8, label: 'LYMPH',  baseRadius: 3 },
            tumor:  { pos: new THREE.Vector3(0, 5, 6),      color: 0xef4444, label: 'TUMOR',  baseRadius: 5 },
            kidney: { pos: new THREE.Vector3(-8, -2, 2),    color: 0x10b981, label: 'KIDNEYS', baseRadius: 2.8 },
            marrow: { pos: new THREE.Vector3(0, -25, 0),    color: 0x10b981, label: 'MARROW', baseRadius: 3 },
        };

        // ── Create organ meshes ──
        const organMeshes: Record<string, THREE.Mesh> = {};
        const organGlows: Record<string, THREE.Mesh> = {};

        Object.entries(ORGANS).forEach(([key, org]) => {
            // Core sphere
            const geo = new THREE.SphereGeometry(org.baseRadius, 32, 32);
            const mat = new THREE.MeshPhongMaterial({
                color: org.color,
                emissive: org.color,
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.9,
                shininess: 80,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(org.pos);
            (mesh as any).organKey = key;
            scene.add(mesh);
            organMeshes[key] = mesh;

            // Glow sphere
            const glowGeo = new THREE.SphereGeometry(org.baseRadius * 1.8, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: org.color,
                transparent: true,
                opacity: 0.08,
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.copy(org.pos);
            scene.add(glow);
            organGlows[key] = glow;
        });

        // ── Vascular connections ──
        const CONNECTIONS: [string, string][] = [
            ['brain', 'heart'], ['heart', 'lungs'], ['heart', 'liver'],
            ['heart', 'spleen'], ['heart', 'tumor'], ['heart', 'kidney'],
            ['spleen', 'tumor'], ['liver', 'kidney'], ['kidney', 'marrow'],
            ['brain', 'lungs'], ['marrow', 'tumor'], ['spleen', 'marrow'],
        ];

        const connectionLines: THREE.Line[] = [];
        CONNECTIONS.forEach(([a, b]) => {
            const pa = ORGANS[a].pos, pb = ORGANS[b].pos;
            const mid = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5);
            mid.z += 4 + Math.random() * 4;
            const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb);
            const points = curve.getPoints(30);
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const mat = new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.08 });
            const line = new THREE.Line(geo, mat);
            scene.add(line);
            connectionLines.push(line);
        });

        // ── Blood flow particles ──
        const BLOOD_COUNT = 300;
        const bloodGeo = new THREE.BufferGeometry();
        const bloodPositions = new Float32Array(BLOOD_COUNT * 3);
        const bloodProgress = new Float32Array(BLOOD_COUNT); // 0-1 progress along path
        const bloodPaths: THREE.QuadraticBezierCurve3[] = [];
        const bloodPathIdx = new Uint16Array(BLOOD_COUNT);

        // Create paths from connections
        CONNECTIONS.forEach(([a, b]) => {
            const pa = ORGANS[a].pos, pb = ORGANS[b].pos;
            const mid = new THREE.Vector3().addVectors(pa, pb).multiplyScalar(0.5);
            mid.z += 4 + Math.random() * 4;
            bloodPaths.push(new THREE.QuadraticBezierCurve3(pa, mid, pb));
        });

        for (let i = 0; i < BLOOD_COUNT; i++) {
            bloodProgress[i] = Math.random();
            bloodPathIdx[i] = Math.floor(Math.random() * bloodPaths.length);
            const pt = bloodPaths[bloodPathIdx[i]].getPoint(bloodProgress[i]);
            bloodPositions[i * 3] = pt.x + (Math.random() - 0.5) * 1.5;
            bloodPositions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 1.5;
            bloodPositions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 1.5;
        }
        bloodGeo.setAttribute('position', new THREE.BufferAttribute(bloodPositions, 3));
        const bloodMat = new THREE.PointsMaterial({ color: 0xef4444, size: 0.6, transparent: true, opacity: 0.7, sizeAttenuation: true });
        const bloodPoints = new THREE.Points(bloodGeo, bloodMat);
        scene.add(bloodPoints);

        // ── CAR-T cell particles ──
        const CART_COUNT = 150;
        const cartGeo = new THREE.BufferGeometry();
        const cartPositions = new Float32Array(CART_COUNT * 3);
        const cartVelocities = new Float32Array(CART_COUNT * 3);
        for (let i = 0; i < CART_COUNT; i++) {
            const src = ORGANS.spleen.pos;
            cartPositions[i * 3] = src.x + (Math.random() - 0.5) * 20;
            cartPositions[i * 3 + 1] = src.y + (Math.random() - 0.5) * 20;
            cartPositions[i * 3 + 2] = src.z + (Math.random() - 0.5) * 15;
            cartVelocities[i * 3] = (Math.random() - 0.5) * 0.1;
            cartVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            cartVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        cartGeo.setAttribute('position', new THREE.BufferAttribute(cartPositions, 3));
        const cartMat = new THREE.PointsMaterial({ color: 0x00f5e9, size: 1.0, transparent: true, opacity: 0.85, sizeAttenuation: true });
        const cartPoints = new THREE.Points(cartGeo, cartMat);
        scene.add(cartPoints);

        // ── Cytokine / CRS particles ──
        const CYTO_COUNT = 100;
        const cytoGeo = new THREE.BufferGeometry();
        const cytoPositions = new Float32Array(CYTO_COUNT * 3);
        const cytoSpeeds = new Float32Array(CYTO_COUNT * 3);
        for (let i = 0; i < CYTO_COUNT; i++) {
            const center = ORGANS.tumor.pos;
            cytoPositions[i * 3] = center.x + (Math.random() - 0.5) * 6;
            cytoPositions[i * 3 + 1] = center.y + (Math.random() - 0.5) * 6;
            cytoPositions[i * 3 + 2] = center.z + (Math.random() - 0.5) * 6;
            const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            cytoSpeeds[i * 3] = dir.x * 0.15;
            cytoSpeeds[i * 3 + 1] = dir.y * 0.15;
            cytoSpeeds[i * 3 + 2] = dir.z * 0.15;
        }
        cytoGeo.setAttribute('position', new THREE.BufferAttribute(cytoPositions, 3));
        const cytoMat = new THREE.PointsMaterial({ color: 0xfbbf24, size: 0.8, transparent: true, opacity: 0.7, sizeAttenuation: true });
        const cytoPoints = new THREE.Points(cytoGeo, cytoMat);
        scene.add(cytoPoints);

        // ── Background star field ──
        const STAR_COUNT = 500;
        const starGeo = new THREE.BufferGeometry();
        const starPos = new Float32Array(STAR_COUNT * 3);
        for (let i = 0; i < STAR_COUNT; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 400;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0x4a4a6a, size: 0.3, transparent: true, opacity: 0.4 });
        scene.add(new THREE.Points(starGeo, starMat));

        // ── Raycaster for click interaction ──
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const organMeshArray = Object.values(organMeshes);

        const onCanvasClick = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(organMeshArray);
            if (intersects.length > 0) {
                const hit = intersects[0].object as any;
                if (hit.organKey) {
                    // Dispatch a custom event so React can pick it up
                    const ev = new CustomEvent('organ-click', { detail: hit.organKey });
                    container.dispatchEvent(ev);
                    // Zoom camera toward the organ
                    const targetPos = hit.position.clone();
                    const camTarget = targetPos.clone().add(new THREE.Vector3(0, 5, 40));
                    controls.autoRotate = false;
                    const startPos = camera.position.clone();
                    let t = 0;
                    const zoomAnim = () => {
                        t += 0.02;
                        if (t >= 1) return;
                        camera.position.lerpVectors(startPos, camTarget, t);
                        controls.target.lerp(targetPos, 0.02);
                        requestAnimationFrame(zoomAnim);
                    };
                    zoomAnim();
                }
            }
        };
        renderer.domElement.addEventListener('click', onCanvasClick);

        // ── Animation loop ──
        let animId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const time = clock.elapsedTime;
            controls.update();

            // Animate blood flow
            const bPos = bloodGeo.getAttribute('position') as THREE.BufferAttribute;
            for (let i = 0; i < BLOOD_COUNT; i++) {
                bloodProgress[i] += delta * (0.15 + Math.sin(i) * 0.05);
                if (bloodProgress[i] > 1) {
                    bloodProgress[i] = 0;
                    bloodPathIdx[i] = Math.floor(Math.random() * bloodPaths.length);
                }
                const pt = bloodPaths[bloodPathIdx[i]].getPoint(bloodProgress[i]);
                bPos.setXYZ(i, pt.x + Math.sin(time + i) * 0.3, pt.y + Math.cos(time + i) * 0.3, pt.z);
            }
            bPos.needsUpdate = true;

            // Animate CAR-T cells drifting toward tumor
            const cPos = cartGeo.getAttribute('position') as THREE.BufferAttribute;
            const tumorP = ORGANS.tumor.pos;
            for (let i = 0; i < CART_COUNT; i++) {
                const x = cPos.getX(i), y = cPos.getY(i), z = cPos.getZ(i);
                const dx = tumorP.x - x, dy = tumorP.y - y, dz = tumorP.z - z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const attraction = 0.02;
                const nx = x + (dx / dist) * attraction + Math.sin(time * 2 + i * 0.3) * 0.08;
                const ny = y + (dy / dist) * attraction + Math.cos(time * 2 + i * 0.4) * 0.08;
                const nz = z + (dz / dist) * attraction * 0.5 + Math.sin(time + i) * 0.05;
                if (dist < 4) {
                    // Respawn from spleen
                    const sp = ORGANS.spleen.pos;
                    cPos.setXYZ(i, sp.x + (Math.random() - 0.5) * 10, sp.y + (Math.random() - 0.5) * 10, sp.z + (Math.random() - 0.5) * 8);
                } else {
                    cPos.setXYZ(i, nx, ny, nz);
                }
            }
            cPos.needsUpdate = true;

            // Animate cytokine particles radiating outward
            const yPos = cytoGeo.getAttribute('position') as THREE.BufferAttribute;
            const tc = ORGANS.tumor.pos;
            for (let i = 0; i < CYTO_COUNT; i++) {
                const x = yPos.getX(i), y = yPos.getY(i), z = yPos.getZ(i);
                const ddx = x - tc.x, ddy = y - tc.y, ddz = z - tc.z;
                const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
                if (dist > 40) {
                    yPos.setXYZ(i, tc.x + (Math.random() - 0.5) * 4, tc.y + (Math.random() - 0.5) * 4, tc.z + (Math.random() - 0.5) * 4);
                } else {
                    yPos.setXYZ(i,
                        x + cytoSpeeds[i * 3] + Math.sin(time * 3 + i) * 0.02,
                        y + cytoSpeeds[i * 3 + 1] + Math.cos(time * 3 + i) * 0.02,
                        z + cytoSpeeds[i * 3 + 2]
                    );
                }
            }
            yPos.needsUpdate = true;

            // Pulse organ glows
            Object.values(organGlows).forEach((g, i) => {
                (g.material as THREE.MeshBasicMaterial).opacity = 0.06 + 0.04 * Math.sin(time * 2 + i);
                g.scale.setScalar(1.0 + 0.08 * Math.sin(time * 1.5 + i * 0.7));
            });

            // Pulse connection lines
            connectionLines.forEach((line, i) => {
                (line.material as THREE.LineBasicMaterial).opacity = 0.06 + 0.04 * Math.sin(time + i * 0.5);
            });

            renderer.render(scene, camera);
        };
        animate();

        // ── Handle resize ──
        const onResize = () => {
            const nw = container.clientWidth, nh = container.clientHeight;
            camera.aspect = nw / nh;
            camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        };
        window.addEventListener('resize', onResize);

        // Store refs
        sceneRef.current = {
            scene, camera, renderer, controls, organMeshes, organGlows,
            bloodPoints, cartPoints, cytoPoints, connectionLines,
            ORGANS,
        };

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            renderer.domElement.removeEventListener('click', onCanvasClick);
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            sceneRef.current = null;
        };
    }, [activeTab]);

    // ── Sync Three.js scene with React state (simDay, layer toggles) ──
    useEffect(() => {
        if (!sceneRef.current) return;
        const s = sceneRef.current;
        const { il6, tumorMm, tCells } = getSimValues(simDay);

        // Update organ colors based on simulation day
        const details = getOrganDetails(simDay);
        Object.entries(details).forEach(([key, org]) => {
            const mesh = s.organMeshes[key];
            if (!mesh) return;
            const color = new THREE.Color(org.color);
            (mesh.material as THREE.MeshPhongMaterial).color.copy(color);
            (mesh.material as THREE.MeshPhongMaterial).emissive.copy(color);
            const glow = s.organGlows[key];
            if (glow) (glow.material as THREE.MeshBasicMaterial).color.copy(color);
        });

        // Tumor size scales with simulation
        const tumorScale = Math.max(0.3, tumorMm / params.tumor_burden_mm);
        if (s.organMeshes.tumor) s.organMeshes.tumor.scale.setScalar(tumorScale);
        if (s.organGlows.tumor) s.organGlows.tumor.scale.setScalar(tumorScale * 1.8);

        // CAR-T visibility and intensity
        const cartActive = tCells > 1e7;
        s.cartPoints.visible = showCarTCells && cartActive;
        (s.cartPoints.material as THREE.PointsMaterial).opacity = Math.min(0.9, tCells / 1e10);
        (s.cartPoints.material as THREE.PointsMaterial).size = cartActive ? Math.min(1.5, 0.5 + tCells / 5e9) : 0.5;

        // Cytokine visibility — only during CRS peak
        const cytoActive = il6 > 30;
        s.cytoPoints.visible = showCytokines && cytoActive;
        (s.cytoPoints.material as THREE.PointsMaterial).opacity = Math.min(0.9, il6 / 300);

        // Blood flow visibility
        s.bloodPoints.visible = showBloodFlow;

        // Immune network brightness
        s.connectionLines.forEach((line: THREE.Line) => {
            const baseBright = showImmuneNet ? (0.05 + Math.min(0.2, il6 / 500)) : 0.02;
            (line.material as THREE.LineBasicMaterial).opacity = baseBright;
        });
    }, [simDay, showBloodFlow, showCarTCells, showCytokines, showImmuneNet, getSimValues, getOrganDetails, params]);

    // ── Listen for organ-click custom events from Three.js ──
    useEffect(() => {
        if (!canvasRef.current) return;
        const el = canvasRef.current;
        const handler = (e: Event) => {
            const key = (e as CustomEvent).detail;
            setSelectedOrgan(prev => prev === key ? '' : key);
        };
        el.addEventListener('organ-click', handler);
        return () => el.removeEventListener('organ-click', handler);
    }, []);

    // ─── Render 3D Biological Twin View ────────────────────────────────────
    const render3DBiologicalTwin = () => {
        const sv = getSimValues(simDay);
        const { d, tumorMm, tCells, il6, crsGrade, bodyTemp, heartRate, spO2, exhaustion, response } = sv as any;
        const organDetails = getOrganDetails(simDay);
        const currentOrganData = selectedOrgan ? organDetails[selectedOrgan] : null;

        // Simulation phase label — derived from actual ODE computed state
        const respLabel = response || 'SD';
        const exh = exhaustion || 0;
        let phaseLabel = 'MONITORING';
        if (d === 0) phaseLabel = 'BASELINE — PRE-INFUSION';
        else if (crsGrade >= 3) phaseLabel = `CRS PEAK — GRADE ${crsGrade}`;
        else if (crsGrade >= 1) phaseLabel = `CRS ACTIVE — GRADE ${crsGrade}`;
        else if (respLabel === 'CR') phaseLabel = 'COMPLETE RESPONSE';
        else if (respLabel === 'PR') phaseLabel = 'PARTIAL RESPONSE';
        else if (respLabel === 'PD') phaseLabel = 'PROGRESSIVE DISEASE';
        else if (exh > 0.5) phaseLabel = 'T-CELL EXHAUSTION';
        else if (d <= 14) phaseLabel = 'ACTIVE LYSIS';
        else if (d <= 30) phaseLabel = 'ENGRAFTMENT';
        else if (d <= 60) phaseLabel = 'RESPONSE ASSESSMENT';
        else if (d <= 180) phaseLabel = 'MONITORING';
        else phaseLabel = 'LONG-TERM FOLLOW-UP';

        const responseColorMap: any = { CR: '#10b981', PR: '#6366f1', SD: '#f59e0b', PD: '#ef4444' };

        return (
            <div className="bio-sim-container">
                {/* Three.js canvas mount point */}
                <div ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

                {/* Status badge */}
                <div className="bio-status-badge">
                    <span className="pulse-dot" />
                    IN-SILICO SIMULATION — {phaseLabel}
                </div>

                {/* HUD Vitals */}
                <div className="bio-hud-overlay">
                    <div className="bio-vital-chip">
                        <span className="bio-vital-label">Body Temp</span>
                        <span className="bio-vital-value" style={{ color: +bodyTemp > 38 ? '#ef4444' : '#10b981' }}>{bodyTemp}°C</span>
                        <span className="bio-vital-sub">{+bodyTemp > 38 ? 'Fever / CRS' : 'Normal'}</span>
                    </div>
                    <div className="bio-vital-chip">
                        <span className="bio-vital-label">Heart Rate</span>
                        <span className="bio-vital-value" style={{ color: heartRate > 100 ? '#f59e0b' : '#e2e8f0' }}>{heartRate} bpm</span>
                        <span className="bio-vital-sub">{heartRate > 100 ? 'Tachycardia' : 'Resting'}</span>
                    </div>
                    <div className="bio-vital-chip">
                        <span className="bio-vital-label">SpO2</span>
                        <span className="bio-vital-value" style={{ color: spO2 < 95 ? '#ef4444' : '#10b981' }}>{spO2}%</span>
                        <span className="bio-vital-sub">{spO2 < 95 ? 'Hypoxia' : 'Optimal'}</span>
                    </div>
                    <div className="bio-vital-chip">
                        <span className="bio-vital-label">CAR-T Cells</span>
                        <span className="bio-vital-value" style={{ color: '#00f5e9' }}>{(tCells / 1e9).toFixed(1)}B</span>
                        <span className="bio-vital-sub">Exhaustion: {(exh * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bio-vital-chip">
                        <span className="bio-vital-label">Tumor</span>
                        <span className="bio-vital-value" style={{ color: tumorMm < 10 ? '#10b981' : '#f59e0b' }}>{tumorMm.toFixed(1)} mm</span>
                        <span className="bio-vital-sub">{respLabel === 'CR' ? 'Complete Response' : respLabel === 'PR' ? 'Partial Response' : respLabel === 'PD' ? 'Progressing' : 'Stable'}</span>
                    </div>
                    <div className="bio-vital-chip">
                        <span className="bio-vital-label">CRS Grade</span>
                        <span className="bio-vital-value" style={{ color: crsColor[crsGrade] }}>Grade {crsGrade}</span>
                        <span className="bio-vital-sub">IL-6: {il6.toFixed(0)} pg/mL</span>
                    </div>
                    <div className="bio-vital-chip">
                        <span className="bio-vital-label">Response</span>
                        <span className="bio-vital-value" style={{ color: responseColorMap[respLabel] || '#94a3b8' }}>{respLabel}</span>
                        <span className="bio-vital-sub">Day {d}</span>
                    </div>
                </div>

                {/* Layer toggles */}
                <div className="bio-toggle-bar">
                    <button className={`bio-toggle-pill ${showBloodFlow ? 'active' : ''}`} onClick={() => setShowBloodFlow(!showBloodFlow)}>
                        <span className="toggle-dot" style={showBloodFlow ? { background: '#ef4444', boxShadow: '0 0 6px #ef4444' } : {}} />
                        Blood Flow
                    </button>
                    <button className={`bio-toggle-pill ${showCarTCells ? 'active' : ''}`} onClick={() => setShowCarTCells(!showCarTCells)}>
                        <span className="toggle-dot" style={showCarTCells ? { background: '#00f5e9', boxShadow: '0 0 6px #00f5e9' } : {}} />
                        CAR-T Cells
                    </button>
                    <button className={`bio-toggle-pill ${showCytokines ? 'active' : ''}`} onClick={() => setShowCytokines(!showCytokines)}>
                        <span className="toggle-dot" style={showCytokines ? { background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' } : {}} />
                        Cytokines
                    </button>
                    <button className={`bio-toggle-pill ${showImmuneNet ? 'active' : ''}`} onClick={() => setShowImmuneNet(!showImmuneNet)}>
                        <span className="toggle-dot" style={showImmuneNet ? { background: '#818cf8', boxShadow: '0 0 6px #818cf8' } : {}} />
                        Immune Net
                    </button>
                </div>

                {/* Organ inspector panel */}
                {selectedOrgan && currentOrganData && (
                    <div className="bio-organ-panel">
                        <button className="bio-panel-close" onClick={() => {
                            setSelectedOrgan('');
                            if (sceneRef.current?.controls) {
                                sceneRef.current.controls.autoRotate = true;
                                sceneRef.current.camera.position.set(0, 10, 120);
                                sceneRef.current.controls.target.set(0, 10, 0);
                            }
                        }}>×</button>
                        <div className="bio-panel-header">
                            <span className="bio-panel-icon">{currentOrganData.icon}</span>
                            <div>
                                <div className="bio-panel-title">{currentOrganData.name}</div>
                                <div className="bio-panel-subtitle">Physiological readout · Day {d}</div>
                            </div>
                        </div>
                        <div className="bio-risk-tag" style={{ background: `${currentOrganData.riskClass}18`, color: currentOrganData.riskClass, border: `1px solid ${currentOrganData.riskClass}40` }}>
                            {currentOrganData.risk}
                        </div>
                        <div className="bio-metrics-grid">
                            {currentOrganData.metrics.map((m: any, i: number) => (
                                <div key={i} className="bio-metric-cell">
                                    <div className="bio-metric-name">{m.name}</div>
                                    <div className="bio-metric-val">{m.val}</div>
                                </div>
                            ))}
                        </div>
                        <div className="bio-mechanism-box">
                            <strong>Mechanism:</strong> {currentOrganData.mechanism}
                        </div>
                        <div className="bio-protocol-box">
                            <strong>Protocol:</strong> {currentOrganData.protocol}
                        </div>
                    </div>
                )}

                {/* Timeline bar */}
                <div className="bio-timeline-bar">
                    <div className="bio-timeline-day">Day {d} <span>/ {params.days}</span></div>
                    <input
                        type="range" min="0" max={maxSimDay} step="1"
                        value={d}
                        onChange={e => { setIsPlaying(false); setSimDay(+e.target.value); }}
                        className="bio-timeline-slider"
                    />
                    <button className="bio-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <div className="bio-milestones">
                        {[{ d: 0, l: 'D0' }, { d: 5, l: 'D5 CRS' }, { d: 14, l: 'D14' }, { d: 60, l: 'D60' }, { d: 180, l: 'D180' }, ...(maxSimDay > 180 ? [{ d: maxSimDay, l: `D${maxSimDay}` }] : [])].map(m => (
                            <button key={m.d} className={`bio-milestone ${d === m.d ? 'active' : ''}`}
                                onClick={() => { setIsPlaying(false); setSimDay(m.d); }}>{m.l}</button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const responseColor: any = { CR: '#10b981', PR: '#6366f1', SD: '#f59e0b', PD: '#ef4444' };
    const crsColor: any = { 0: '#10b981', 1: '#6366f1', 2: '#f59e0b', 3: '#f97316', 4: '#ef4444' };

    // ─── Tab Configuration ────────────────────────────────────────────────
    const tabs: { key: TabKey; icon: string; label: string; disabled?: boolean }[] = [
        { key: 'body', icon: '🫀', label: 'Human Body Twin' },
        { key: 'setup', icon: '🩺', label: 'Patient Setup' },
        { key: 'results', icon: '📊', label: 'Simulation', disabled: !result },
        { key: 'crs', icon: '⚠️', label: 'CRS Risk', disabled: !crsRisk },
        { key: 'cancer', icon: '🧬', label: 'Cancer Profiles' },
        { key: 'pkpd', icon: '💊', label: 'PK/PD' },
        { key: 'products', icon: '🏥', label: 'CAR-T Products' },
        { key: 'biomarkers', icon: '🔬', label: 'Biomarkers' },
    ];

    return (
        <div className="twin-page">
            <div className="twin-header">
                <h1>🧑‍⚕️ Patient Digital Twin</h1>
                <p className="page-subtitle">Simulate CAR-T treatment outcomes with 6 prediction engines</p>
            </div>

            {/* ─── Tab Bar ──────────────────────────────────────────────── */}
            <div className="twin-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={activeTab === tab.key ? 'active' : ''}
                        onClick={() => setActiveTab(tab.key)}
                        disabled={tab.disabled}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {error && <div className="twin-error">{error}</div>}

            {/* ═══ TAB 0: Anatomical Human Body Twin ══════════════════════ */}
            {activeTab === 'body' && render3DBiologicalTwin()}

            {/* ═══ TAB 1: Patient Setup ═══════════════════════════════════ */}
            {activeTab === 'setup' && (
                <div className="twin-setup">
                    <div className="card">
                        <h3>Quick Start — Patient Presets</h3>
                        <div className="twin-presets">
                            {PRESETS.map(p => (
                                <button key={p.name} className="twin-preset-btn" onClick={() => applyPreset(p)}>{p.name}</button>
                            ))}
                        </div>
                    </div>

                    <div className="twin-form-grid">
                        <div className="card">
                            <h3>👤 Demographics</h3>
                            <div className="twin-fields">
                                <label>Age <input type="number" value={params.patient_age} onChange={e => upd('patient_age', +e.target.value)} /></label>
                                <label>Weight (kg) <input type="number" value={params.patient_weight} onChange={e => upd('patient_weight', +e.target.value)} /></label>
                                <label>Cancer Type <input type="text" value={params.cancer_type} onChange={e => upd('cancer_type', e.target.value)} /></label>
                                <label>Stage
                                    <select value={params.cancer_stage} onChange={e => upd('cancer_stage', e.target.value)}>
                                        <option value="I">Stage I</option>
                                        <option value="II">Stage II</option>
                                        <option value="III">Stage III</option>
                                        <option value="IV">Stage IV</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                        <div className="card">
                            <h3>🎯 Tumor & Target</h3>
                            <div className="twin-fields">
                                <label>Tumor Burden (mm) <input type="number" value={params.tumor_burden_mm} onChange={e => upd('tumor_burden_mm', +e.target.value)} /></label>
                                <label>Antigen Expression
                                    <input type="range" min="0.1" max="1.0" step="0.05" value={params.antigen_expression} onChange={e => upd('antigen_expression', +e.target.value)} />
                                    <span className="range-val">{(params.antigen_expression * 100).toFixed(0)}%</span>
                                </label>
                                <label>T-Cell Dose
                                    <select value={params.t_cell_dose} onChange={e => upd('t_cell_dose', +e.target.value)}>
                                        <option value={5e7}>5×10⁷ (Low)</option>
                                        <option value={1e8}>1×10⁸ (Standard)</option>
                                        <option value={2e8}>2×10⁸ (High)</option>
                                        <option value={5e8}>5×10⁸ (Max)</option>
                                    </select>
                                </label>
                                <label className="twin-check">
                                    <input type="checkbox" checked={params.prior_car_t} onChange={e => upd('prior_car_t', e.target.checked)} />
                                    Prior CAR-T therapy
                                </label>
                                <label className="twin-check">
                                    <input type="checkbox" checked={params.lymphodepletion} onChange={e => upd('lymphodepletion', e.target.checked)} />
                                    Lymphodepletion
                                </label>
                            </div>
                        </div>
                        <div className="card">
                            <h3>🧪 Lab Values (Optional)</h3>
                            <div className="twin-fields">
                                <label>ALC (×10⁹/L) <input type="number" step="0.1" placeholder="e.g. 1.2" onChange={e => upd('alc', e.target.value ? +e.target.value : null)} /></label>
                                <label>LDH (U/L) <input type="number" placeholder="e.g. 250" onChange={e => upd('ldh', e.target.value ? +e.target.value : null)} /></label>
                                <label>Simulation Days
                                    <select value={params.days} onChange={e => upd('days', +e.target.value)}>
                                        <option value={90}>90 days</option>
                                        <option value={180}>180 days</option>
                                        <option value={365}>365 days (1 yr)</option>
                                        <option value={730}>730 days (2 yr)</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="twin-action-bar">
                        <button className="twin-run-btn primary" onClick={runSimulation} disabled={loading}>
                            {loading ? '⏳ Running...' : '🧬 Run Full Simulation'}
                        </button>
                        <button className="twin-run-btn secondary" onClick={runCancerSim} disabled={loading}>
                            🧫 Cancer-Specific Sim
                        </button>
                        <button className="twin-run-btn secondary" onClick={runPKSimulation} disabled={loading}>
                            💊 PK/PD Analysis
                        </button>
                        <button className="twin-run-btn secondary" onClick={runBiomarkerPrediction} disabled={loading}>
                            🔬 Biomarker Forecast
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ TAB 2: Simulation Results ══════════════════════════════ */}
            {activeTab === 'results' && result && s && t && (
                <div className="twin-results">
                    <div className="twin-summary-grid">
                        <div className="twin-summary-card">
                            <div className="twin-summary-value" style={{ color: responseColor[s.best_response] || '#e2e8f0' }}>{s.best_response}</div>
                            <div className="twin-summary-label">Best Response</div>
                        </div>
                        <div className="twin-summary-card">
                            <div className="twin-summary-value">{s.tumor_reduction_pct}%</div>
                            <div className="twin-summary-label">Tumor Reduction</div>
                        </div>
                        <div className="twin-summary-card">
                            <div className="twin-summary-value" style={{ color: crsColor[s.max_crs_grade] }}>{s.max_crs_grade}</div>
                            <div className="twin-summary-label">Max CRS Grade</div>
                        </div>
                        <div className="twin-summary-card">
                            <div className="twin-summary-value">{s.progression_free_survival_days}d</div>
                            <div className="twin-summary-label">PFS</div>
                        </div>
                        <div className="twin-summary-card">
                            <div className="twin-summary-value">{s.duration_of_response_days}d</div>
                            <div className="twin-summary-label">Duration of Response</div>
                        </div>
                        <div className="twin-summary-card">
                            <div className="twin-summary-value">{(s.peak_t_cells / 1e9).toFixed(1)}B</div>
                            <div className="twin-summary-label">Peak T-cells (Day {s.peak_t_cell_day})</div>
                        </div>
                    </div>

                    <div className="card">
                        <h3>📈 Tumor Regression Timeline</h3>
                        {renderChart(t.tumor_mm, '#ff6b6b', `Tumor Size (mm) — Nadir: ${s.nadir_tumor_mm}mm on Day ${s.nadir_tumor_day}`)}
                    </div>
                    <div className="card">
                        <h3>🧬 CAR-T Cell Expansion</h3>
                        {renderChart(t.t_cells, '#818cf8', `T-Cell Count — Peak: ${(s.peak_t_cells / 1e9).toFixed(1)}B on Day ${s.peak_t_cell_day}`)}
                    </div>
                    <div className="card">
                        <h3>🧪 IL-6 Cytokine Levels</h3>
                        {renderChart(t.il6, '#fbbf24', 'IL-6 (pg/mL) — CRS Biomarker')}
                    </div>
                    {t.crs_grade && (
                        <div className="card">
                            <h3>⚠️ CRS Grade Over Time</h3>
                            {renderChart(t.crs_grade, '#fb923c', 'CRS Grade (0-4)', 4)}
                        </div>
                    )}

                    {/* AI Clinical Insight */}
                    {result.ai_insight && (
                        <div className="card" style={{ borderLeft: `4px solid ${result.ai_insight_source === 'llm' ? '#10b981' : '#8b5cf6'}` }}>
                            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🤖 AI Clinical Interpretation</span>
                                <span style={{
                                    fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                                    background: result.ai_insight_source === 'llm' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                                    color: result.ai_insight_source === 'llm' ? '#10b981' : '#8b5cf6',
                                }}>
                                    {result.ai_insight_source === 'llm' ? '🤖 LLM Generated' : '📐 Rule-Based'}
                                </span>
                            </h3>
                            <div style={{
                                fontSize: 13, lineHeight: 1.7, color: '#cbd5e1',
                                padding: '12px 16px', borderRadius: 8,
                                background: result.ai_insight_source === 'llm' ? 'rgba(16,185,129,0.04)' : 'rgba(139,92,246,0.04)',
                            }}
                                dangerouslySetInnerHTML={{ __html: result.ai_insight.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f1f5f9">$1</strong>').replace(/\n/g, '<br/>') }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB 3: CRS Risk Assessment ════════════════════════════ */}
            {activeTab === 'crs' && crsRisk && (
                <div className="twin-crs">
                    <div className="card" style={{ textAlign: 'center' }}>
                        <h3>⚠️ Cytokine Release Syndrome Risk Assessment</h3>
                        <div className="crs-gauge">
                            <div className="crs-gauge-fill" style={{
                                width: `${crsRisk.risk_score}%`,
                                background: crsRisk.risk_level === 'high' ? '#ef4444' : crsRisk.risk_level === 'moderate' ? '#f59e0b' : '#10b981'
                            }} />
                        </div>
                        <div className="crs-score">{crsRisk.risk_score}/100</div>
                        <div className="crs-severity" style={{
                            color: crsRisk.risk_level === 'high' ? '#ef4444' : crsRisk.risk_level === 'moderate' ? '#f59e0b' : '#10b981'
                        }}>
                            Grade {crsRisk.predicted_max_crs_grade} — {crsRisk.severity}
                        </div>
                        <div className="crs-management">{crsRisk.management_recommendation}</div>
                    </div>
                    <div className="card">
                        <h3>🔍 Risk Factor Breakdown</h3>
                        <div className="crs-factors">
                            {crsRisk.risk_factors?.map((f: any, i: number) => (
                                <div key={i} className={`crs-factor crs-${f.impact}`}>
                                    <span className="crs-factor-name">{f.factor}</span>
                                    <span className="crs-factor-pts">{f.points > 0 ? '+' : ''}{f.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {crsRisk.interventions && (
                        <div className="card">
                            <h3>💉 Recommended Interventions</h3>
                            <div className="interventions-list">
                                {crsRisk.interventions.map((int: any, i: number) => (
                                    <div key={i} className="intervention-item">
                                        <span className="intervention-name">{int.name || int}</span>
                                        {int.timing && <span className="intervention-timing">{int.timing}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB 4: Cancer-Specific Profiles ═══════════════════════ */}
            {activeTab === 'cancer' && (
                <div className="twin-cancer">
                    {/* Available Cancer Profiles Grid */}
                    {(!cancerSim || cancerSim?.error) && (
                        <div className="card">
                            <h3>🧫 Available Cancer Profiles</h3>
                            <p className="card-desc">Click any cancer profile to simulate microenvironment dynamics, CAR-T antigen response, and historical outcomes.</p>
                            {cancerProfiles.length > 0 ? (
                                <div className="cancer-profiles-grid">
                                    {cancerProfiles.map((prof: any, i: number) => {
                                        const name = prof.name || prof.cancer_type || prof.code || `Profile ${i + 1}`;
                                        const key = prof.key || prof.cancer_type || prof.name || prof.code;
                                        const target = prof.primary_target || (prof.antigen_targets && prof.antigen_targets[0]) || 'CD19';
                                        const responseRate = prof.typical_response_rate || prof.car_t_orr || '75%';
                                        const pfsMonths = prof.median_pfs_months || '12.0';

                                        return (
                                            <div key={key || i} className="cancer-profile-card" onClick={() => {
                                                try {
                                                    upd('cancer_type', name);
                                                    runCancerSim(key);
                                                } catch (err) {
                                                    console.error('Error on profile click:', err);
                                                }
                                            }}>
                                                <h4>{name}</h4>
                                                <div className="profile-stat">
                                                    <span>Response Rate</span>
                                                    <span className="stat-val">{typeof responseRate === 'number' ? `${responseRate}%` : responseRate}</span>
                                                </div>
                                                <div className="profile-stat">
                                                    <span>Primary Target</span>
                                                    <span className="stat-val">{target}</span>
                                                </div>
                                                <div className="profile-stat">
                                                    <span>Median PFS</span>
                                                    <span className="stat-val">{typeof pfsMonths === 'number' ? `${pfsMonths} mo` : `${pfsMonths} mo`}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                    Loading cancer profiles...
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cancer Simulation Result View */}
                    {cancerSim && !cancerSim.error && (
                        <>
                            <button className="twin-back-btn" onClick={() => setCancerSim(null)}>← Back to Profiles</button>
                            <div className="card">
                                <h3>🧬 Cancer-Specific Simulation: {cancerSim.cancer_type || cancerSim.cancer_profile?.name || params.cancer_type}</h3>
                                {cancerSim.summary ? (
                                    <div className="twin-summary-grid">
                                        {Object.entries(cancerSim.summary).slice(0, 8).map(([key, val]: any) => (
                                            <div key={key} className="twin-summary-card">
                                                <div className="twin-summary-value">{typeof val === 'number' ? (val.toFixed?.(1) || val) : String(val ?? 'N/A')}</div>
                                                <div className="twin-summary-label">{key.replace(/_/g, ' ')}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8', padding: '10px 0' }}>No data available for this profile yet.</p>
                                )}
                            </div>

                            {cancerSim.timeline && (
                                <div className="card">
                                    <h3>📈 Tumor Dynamics</h3>
                                    {Array.isArray(cancerSim.timeline.tumor_mm) && renderChart(cancerSim.timeline.tumor_mm, '#ef4444', 'Tumor Size')}
                                    {Array.isArray(cancerSim.timeline.t_cells) && renderChart(cancerSim.timeline.t_cells, '#6366f1', 'CAR-T Cells')}
                                </div>
                            )}

                            {cancerSim.tme && (
                                <div className="card">
                                    <h3>🧫 Tumor Microenvironment</h3>
                                    <div className="tme-grid">
                                        {Object.entries(cancerSim.tme).map(([key, val]: any) => (
                                            <div key={key} className="tme-item">
                                                <span className="tme-label">{key.replace(/_/g, ' ')}</span>
                                                <span className="tme-value">{typeof val === 'number' ? val.toFixed(2) : String(val ?? 'N/A')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ═══ TAB 5: PK/PD Analysis ══════════════════════════════════ */}
            {activeTab === 'pkpd' && (
                <div className="twin-pkpd">
                    {!pkResult ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <h3>💊 Pharmacokinetic / Pharmacodynamic Analysis</h3>
                            <p>Model CAR-T cell distribution across body compartments, cytokine kinetics, and drug interactions.</p>
                            <button className="twin-run-btn primary" onClick={runPKSimulation} disabled={loading}>
                                {loading ? '⏳ Running...' : '💊 Run PK/PD Simulation'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* PK Summary */}
                            {pkResult.summary && (
                                <div className="twin-summary-grid">
                                    {Object.entries(pkResult.summary).slice(0, 8).map(([key, val]: any) => (
                                        <div key={key} className="twin-summary-card">
                                            <div className="twin-summary-value">
                                                {typeof val === 'number' ? (val > 1e6 ? `${(val / 1e9).toFixed(1)}B` : val.toFixed(1)) : String(val)}
                                            </div>
                                            <div className="twin-summary-label">{key.replace(/_/g, ' ')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Compartmental Charts */}
                            {pkResult.compartments && (
                                <div className="card">
                                    <h3>🫀 Compartmental Distribution</h3>
                                    {renderMultiChart(
                                        Object.entries(pkResult.compartments)
                                            .filter(([_, v]: any) => Array.isArray(v))
                                            .slice(0, 4)
                                            .map(([name, data]: any, i: number) => ({
                                                data, label: name.replace(/_/g, ' '),
                                                color: ['#6366f1', '#ef4444', '#10b981', '#f59e0b'][i % 4],
                                            })),
                                        'CAR-T Cells by Compartment'
                                    )}
                                </div>
                            )}

                            {/* Timeline */}
                            {pkResult.timeline && (
                                <div className="card">
                                    <h3>📈 PK Timeline</h3>
                                    {pkResult.timeline.blood && renderChart(pkResult.timeline.blood, '#ef4444', 'Blood Concentration')}
                                    {pkResult.timeline.tumor && renderChart(pkResult.timeline.tumor, '#6366f1', 'Tumor Infiltration')}
                                </div>
                            )}

                            <button className="twin-run-btn secondary" onClick={runPKSimulation} disabled={loading}>
                                ↻ Re-run PK/PD
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ═══ TAB 6: CAR-T Products ══════════════════════════════════ */}
            {activeTab === 'products' && (
                <div className="twin-products">
                    <div className="card">
                        <h3>🏥 FDA-Approved CAR-T Products</h3>
                        <p className="card-desc">Click a product to predict personalized outcomes for this patient.</p>
                        <div className="products-grid">
                            {products.map((prod: any, i: number) => (
                                <div
                                    key={i}
                                    className={`product-card ${selectedProduct === (prod.key || prod.product_key) ? 'selected' : ''}`}
                                    onClick={() => runProductPrediction(prod.key || prod.product_key)}
                                >
                                    <h4>{prod.name || prod.product_name}</h4>
                                    <div className="product-meta">
                                        {prod.manufacturer && <span>{prod.manufacturer}</span>}
                                        {prod.target && <span>Target: {prod.target}</span>}
                                        {prod.indications && <span>{prod.indications}</span>}
                                    </div>
                                    {prod.approval_year && <span className="product-year">FDA {prod.approval_year}</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Outcome */}
                    {productOutcome && (
                        <div className="card">
                            <h3>📊 Predicted Outcome: {productOutcome.product_name || selectedProduct}</h3>
                            {productOutcome.prediction && (
                                <div className="twin-summary-grid">
                                    {Object.entries(productOutcome.prediction).slice(0, 8).map(([key, val]: any) => (
                                        <div key={key} className="twin-summary-card">
                                            <div className="twin-summary-value">
                                                {typeof val === 'number' ? val.toFixed(1) : String(val)}
                                            </div>
                                            <div className="twin-summary-label">{key.replace(/_/g, ' ')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {productOutcome.clinical_context && (
                                <div className="clinical-context">
                                    <h4>📚 Clinical Context</h4>
                                    <p>{productOutcome.clinical_context}</p>
                                </div>
                            )}
                            {productOutcome.risk_factors && (
                                <div className="product-risks">
                                    <h4>⚠️ Risk Factors for This Patient</h4>
                                    {productOutcome.risk_factors.map((rf: any, i: number) => (
                                        <div key={i} className="risk-item">
                                            <span>{rf.factor || rf}</span>
                                            {rf.impact && <span className={`risk-impact ${rf.impact}`}>{rf.impact}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {products.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <p>Loading CAR-T product database...</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB 7: Biomarker Predictions ══════════════════════════ */}
            {activeTab === 'biomarkers' && (
                <div className="twin-biomarkers">
                    {!biomarkers ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <h3>🔬 Biomarker Trajectory Predictions</h3>
                            <p>Predict post-infusion biomarker changes across 6 organ systems: CBC, immune, hepatic, renal, cardiac, inflammatory.</p>
                            <button className="twin-run-btn primary" onClick={runBiomarkerPrediction} disabled={loading}>
                                {loading ? '⏳ Running...' : '🔬 Generate Biomarker Report'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Biomarker system cards */}
                            {biomarkers.systems && Object.entries(biomarkers.systems).map(([system, data]: any) => (
                                <div key={system} className="card">
                                    <h3>{systemIcon(system)} {system.replace(/_/g, ' ')} Panel</h3>
                                    {data.markers && (
                                        <div className="biomarker-grid">
                                            {Object.entries(data.markers).map(([marker, vals]: any) => (
                                                <div key={marker} className="biomarker-item">
                                                    <div className="biomarker-name">{marker.replace(/_/g, ' ')}</div>
                                                    {Array.isArray(vals) && renderChart(vals, systemColor(system), marker.replace(/_/g, ' '))}
                                                    {typeof vals === 'object' && !Array.isArray(vals) && vals.trajectory && renderChart(vals.trajectory, systemColor(system), marker.replace(/_/g, ' '))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!data.markers && data.trajectory && renderChart(data.trajectory, systemColor(system), system)}
                                </div>
                            ))}

                            {/* Flat biomarker data */}
                            {!biomarkers.systems && Object.entries(biomarkers).filter(([k]) => k !== 'metadata' && k !== 'patient').map(([key, val]: any) => (
                                <div key={key} className="card">
                                    <h3>{systemIcon(key)} {key.replace(/_/g, ' ')}</h3>
                                    {typeof val === 'object' && Object.entries(val).map(([sub, subVal]: any) => (
                                        <div key={sub} className="biomarker-item">
                                            <div className="biomarker-name">{sub.replace(/_/g, ' ')}</div>
                                            {Array.isArray(subVal) && renderChart(subVal, systemColor(key), sub.replace(/_/g, ' '))}
                                        </div>
                                    ))}
                                </div>
                            ))}

                            <button className="twin-run-btn secondary" onClick={runBiomarkerPrediction} disabled={loading}>
                                ↻ Re-run Biomarker Prediction
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function systemIcon(system: string): string {
    const icons: Record<string, string> = {
        cbc: '🩸', hematologic: '🩸', immune: '🛡️', immune_recovery: '🛡️',
        hepatic: '🫁', liver: '🫁', renal: '🫘', kidney: '🫘',
        cardiac: '🫀', heart: '🫀', inflammatory: '🔥', cytokine: '🔥',
        coagulation: '💉', metabolic: '⚡',
    };
    const key = system.toLowerCase();
    for (const [k, v] of Object.entries(icons)) {
        if (key.includes(k)) return v;
    }
    return '📊';
}

function systemColor(system: string): string {
    const colors: Record<string, string> = {
        cbc: '#ef4444', hematologic: '#ef4444', immune: '#6366f1', immune_recovery: '#6366f1',
        hepatic: '#f59e0b', liver: '#f59e0b', renal: '#10b981', kidney: '#10b981',
        cardiac: '#f97316', heart: '#f97316', inflammatory: '#e11d48', cytokine: '#e11d48',
    };
    const key = system.toLowerCase();
    for (const [k, v] of Object.entries(colors)) {
        if (key.includes(k)) return v;
    }
    return '#6366f1';
}
