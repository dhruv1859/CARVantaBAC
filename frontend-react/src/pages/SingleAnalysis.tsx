import { useState, useEffect } from 'react';
import { scoreAntigen, fetchAntigens, fetchDrugInteractions, fetchExplanation, fetchCitation, fetchFHIR, fetchPatents, fetchGeneIds, fetchScoreHistory, recordSnapshot, fetchCancerTypes } from '../api/client';
import { TierBadge, DataSourceBadge, ScoreCircle, FeatureBar, Loading, ErrorMsg } from '../components/UIComponents';
import PipelineVisualizer from '../components/PipelineVisualizer';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function SingleAnalysis() {
    const [antigens, setAntigens] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pipelineRunning, setPipelineRunning] = useState(false);
    const [cancerTypes, setCancerTypes] = useState<string[]>([]);
    const [cancerType, setCancerType] = useState('');

    // v5 state
    const [drugData, setDrugData] = useState<any>(null);
    const [shapData, setShapData] = useState<any>(null);
    const [citationData, setCitationData] = useState<any>(null);
    const [patentData, setPatentData] = useState<any>(null);
    const [geneIdData, setGeneIdData] = useState<any>(null);
    const [historyData, setHistoryData] = useState<any>(null);
    const [showCiteModal, setShowCiteModal] = useState(false);
    const [copiedFormat, setCopiedFormat] = useState('');

    useEffect(() => {
        fetchAntigens(search, 50)
            .then(setAntigens)
            .catch(() => setAntigens([]));
    }, [search]);

    useEffect(() => {
        fetchCancerTypes()
            .then((data: any) => setCancerTypes(data?.cancer_types || []))
            .catch(() => setCancerTypes([]));
    }, []);

    const handleScore = async () => {
        if (!selected) return;
        setLoading(true); setError(''); setResult(null);
        setPipelineRunning(true);
        setDrugData(null); setShapData(null); setCitationData(null);
        setPatentData(null); setGeneIdData(null); setHistoryData(null);

        try {
            const data = await scoreAntigen(selected, cancerType || undefined);
            setResult(data);

            // Fire v5 enrichments in parallel
            Promise.allSettled([
                fetchDrugInteractions(selected).then(setDrugData),
                fetchExplanation(selected).then(setShapData),
                fetchPatents(selected).then(setPatentData),
                fetchGeneIds(selected).then(setGeneIdData),
                fetchScoreHistory(selected).then(setHistoryData),
            ]);
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to score antigen');
        } finally { setLoading(false); setPipelineRunning(false); }
    };

    const handleCite = async () => {
        const data = await fetchCitation(selected);
        setCitationData(data);
        setShowCiteModal(true);
    };

    const handleFHIRDownload = async () => {
        const data = await fetchFHIR(selected);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `carvanta_${selected}_fhir.json`;
        a.click(); URL.revokeObjectURL(url);
    };

    const handleSnapshot = async () => {
        await recordSnapshot(selected);
        const updated = await fetchScoreHistory(selected);
        setHistoryData(updated);
    };

    const copyToClipboard = (text: string, format: string) => {
        navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(''), 2000);
    };

    const radarData = result ? {
        labels: ['Tumor Spec.', 'Safety', 'Stability', 'Evidence', 'Immunogen.', 'Surface', 'Tissue Risk', 'Protein Val.'],
        datasets: [{
            label: selected,
            data: [
                result.features?.tumor_specificity ?? 0,
                result.features?.safety ?? 0,
                result.features?.stability ?? 0,
                result.features?.evidence ?? 0,
                result.features?.immunogenicity ?? 0,
                result.features?.surface_accessibility ?? 0,
                1 - (result.features?.tissue_risk ?? 0),
                result.features?.protein_validation ?? 0,
            ],
            backgroundColor: 'rgba(59,130,246,0.15)',
            borderColor: '#3B82F6',
            borderWidth: 2,
            pointBackgroundColor: '#3B82F6',
        }]
    } : null;

    const radarOpts = {
        scales: {
            r: {
                beginAtZero: true, max: 1,
                ticks: { color: '#64748B', backdropColor: 'transparent', stepSize: 0.25 },
                pointLabels: { color: '#94A3B8', font: { size: 11 } },
                grid: { color: 'rgba(30,41,59,0.6)' },
                angleLines: { color: 'rgba(30,41,59,0.6)' },
            }
        },
        plugins: { legend: { display: false } },
        maintainAspectRatio: true,
    };

    const ftoColors = { good: '#10B981', moderate: '#F59E0B', limited: '#EF4444', uncharted: '#8B5CF6' };

    return (
        <>
            <div className="page-header">
                <h2>🔬 Single Antigen Analysis</h2>
                <p>Score any antigen using CARVanta v5 Adaptive ML-Driven scoring with Explainable AI</p>
            </div>

            <div className="card">
                <div className="input-row">
                    <div className="form-group">
                        <label>Search Antigens</label>
                        <input className="form-control" placeholder="Type to search..." value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Select Antigen</label>
                        <select className="form-control" value={selected} onChange={e => setSelected(e.target.value)}>
                            <option value="">-- select --</option>
                            {antigens.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Cancer Context <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(optional)</span></label>
                        <select className="form-control" value={cancerType} onChange={e => setCancerType(e.target.value)}>
                            <option value="">All (Global Score)</option>
                            {cancerTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={handleScore} disabled={!selected || loading}>
                        {loading ? 'Scoring...' : 'Score Antigen'}
                    </button>
                </div>
            </div>

            <ErrorMsg msg={error} />
            <PipelineVisualizer isRunning={pipelineRunning} antigenName={selected} />

            {result && (
                <>
                    {/* ── Gene Identifiers Badge ───────────────────────── */}
                    {geneIdData?.has_identifiers && (
                        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>🧬 {geneIdData.hugo_symbol}</span>
                            <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                                HUGO: {geneIdData.hugo_symbol}
                            </span>
                            <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                                NCBI: {geneIdData.ncbi_gene_id}
                            </span>
                            <span className="badge" style={{ background: 'rgba(6,182,212,0.12)', color: '#06B6D4' }}>
                                UniProt: {geneIdData.uniprot_id}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {geneIdData.hugo_name} · Chr {geneIdData.chromosome}
                            </span>
                            {geneIdData.external_links && (
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                    <a href={geneIdData.external_links.ncbi_gene} target="_blank" rel="noreferrer"
                                       style={{ fontSize: 11, color: 'var(--accent-blue)' }}>NCBI →</a>
                                    <a href={geneIdData.external_links.uniprot} target="_blank" rel="noreferrer"
                                       style={{ fontSize: 11, color: 'var(--accent-blue)' }}>UniProt →</a>
                                    <a href={geneIdData.external_links.ensembl} target="_blank" rel="noreferrer"
                                       style={{ fontSize: 11, color: 'var(--accent-blue)' }}>Ensembl →</a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Score Summary + Radar ────────────────────────── */}
                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header">Score Summary</div>
                            <div className="score-display">
                                <ScoreCircle score={result.CVS} tier={result.tier} />
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{result.antigen}</div>
                                    <TierBadge tier={result.tier} />
                                    <DataSourceBadge source={result.data_source} />
                                    <div style={{ marginTop: 8, fontSize: 12, color: '#94A3B8' }}>
                                        ML Score: <strong>{result.ml_score?.toFixed(3)}</strong> &nbsp;·&nbsp;
                                        Confidence: <strong>{result.confidence_label}</strong>
                                    </div>
                                    {result.source_database && (
                                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                                            Source: {result.source_database} · Evidence: {result.evidence_level}
                                        </div>
                                    )}
                                    {/* Action buttons */}
                                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button className="btn btn-secondary" onClick={handleCite} style={{ fontSize: 11, padding: '6px 12px' }}>
                                            📝 Cite
                                        </button>
                                        <button className="btn btn-secondary" onClick={handleFHIRDownload} style={{ fontSize: 11, padding: '6px 12px' }}>
                                            🏥 FHIR Export
                                        </button>
                                        <button className="btn btn-secondary" onClick={handleSnapshot} style={{ fontSize: 11, padding: '6px 12px' }}>
                                            📸 Save Snapshot
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">Radar Profile</div>
                            {radarData && <Radar data={radarData} options={radarOpts} />}
                        </div>
                    </div>

                    {/* ── AI Insight (LLM-Generated) ─────────────────────── */}
                    {result.ai_insight && (
                        <div className="card" style={{
                            borderLeft: `4px solid ${result.ai_insight_source === 'llm' ? '#10B981' : '#8B5CF6'}`,
                        }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🤖 AI Clinical Insight</span>
                                <span className="badge" style={{
                                    background: result.ai_insight_source === 'llm' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
                                    color: result.ai_insight_source === 'llm' ? '#10B981' : '#8B5CF6',
                                    fontSize: 10,
                                }}>
                                    {result.ai_insight_source === 'llm' ? '🤖 LLM Generated' : '📐 Rule-Based'}
                                </span>
                            </div>
                            <div style={{
                                fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)',
                                padding: '12px 16px', borderRadius: 8,
                                background: result.ai_insight_source === 'llm' ? 'rgba(16,185,129,0.04)' : 'rgba(139,92,246,0.04)',
                            }}
                                dangerouslySetInnerHTML={{ __html: result.ai_insight.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>').replace(/\n/g, '<br/>') }}
                            />
                        </div>
                    )}

                    {/* ── Deep Insight ──────────────────────────────────── */}
                    {result.deep_insight && (
                        <div className="card">
                            <div className="card-header">🧬 Deep Analysis</div>
                            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', padding: '4px 0' }}
                                dangerouslySetInnerHTML={{ __html: result.deep_insight.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>').replace(/\n/g, '<br/>') }}
                            />
                        </div>
                    )}

                    {/* ── Safety Insight ────────────────────────────────── */}
                    {result.safety_insight && (
                        <div className="card" style={{ borderLeft: '4px solid #F59E0B' }}>
                            <div className="card-header">⚠️ Safety Analysis</div>
                            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', padding: '4px 0' }}
                                dangerouslySetInnerHTML={{ __html: result.safety_insight.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>').replace(/\n/g, '<br/>') }}
                            />
                        </div>
                    )}

                    {/* ── Drug Interaction Warning ─────────────────────── */}
                    {drugData?.has_interactions && (
                        <div className="card" style={{
                            borderLeft: `4px solid ${drugData.risk_level === 'high' ? '#EF4444' : drugData.risk_level === 'moderate' ? '#F59E0B' : '#10B981'}`
                        }}>
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>⚠️ Drug Interactions ({drugData.total_drugs} known)</span>
                                <span className="badge" style={{
                                    background: drugData.risk_level === 'high' ? 'rgba(239,68,68,0.15)' : drugData.risk_level === 'moderate' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                    color: drugData.risk_level === 'high' ? '#EF4444' : drugData.risk_level === 'moderate' ? '#F59E0B' : '#10B981',
                                }}>
                                    {drugData.risk_level?.toUpperCase()} RISK
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                                {drugData.drugs?.map((drug: any, i: number) => (
                                    <div key={i} style={{
                                        padding: '12px 16px', borderRadius: 8,
                                        border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                                            {drug.drug}
                                        </div>
                                        <span className="badge" style={{
                                            background: drug.interaction === 'competing' ? 'rgba(239,68,68,0.12)' : drug.interaction === 'synergistic' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                                            color: drug.interaction === 'competing' ? '#EF4444' : drug.interaction === 'synergistic' ? '#10B981' : '#94A3B8',
                                            fontSize: 10,
                                        }}>
                                            {drug.interaction}
                                        </span>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{drug.clinical_note}</div>
                                    </div>
                                ))}
                            </div>
                            {drugData.recommendation && (
                                <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    💡 {drugData.recommendation}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── SHAP Explainability ──────────────────────────── */}
                    {shapData && (
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🧠 Explainability — Why This Score?</span>
                                <span className="badge" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', fontSize: 10 }}>
                                    {shapData.method === 'shap' ? 'SHAP Values' : 'Feature Importance'}
                                </span>
                            </div>
                            {shapData.narrative && (
                                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                                    {shapData.narrative}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(() => {
                                    const drivers = shapData.top_drivers || [];
                                    const maxAbs = Math.max(...drivers.map((d: any) => Math.abs(d.shap_value || 0)), 0.001);
                                    return drivers.map((driver: any, i: number) => {
                                        const sv = driver.shap_value || 0;
                                        const barPct = Math.min((Math.abs(sv) / maxAbs) * 100, 100);
                                        const isPositive = sv >= 0;
                                        return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ width: 20, textAlign: 'center', fontWeight: 800, color: i < 3 ? '#F59E0B' : 'var(--text-muted)', fontSize: 14 }}>
                                                {i + 1}
                                            </span>
                                            <span style={{ width: 180, fontSize: 12, color: 'var(--text-secondary)' }}>
                                                {driver.feature?.replace(/_/g, ' ')}
                                            </span>
                                            <div style={{ flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: 4,
                                                    width: `${barPct}%`,
                                                    background: isPositive
                                                        ? 'linear-gradient(90deg, #10B981, #06B6D4)'
                                                        : 'linear-gradient(90deg, #EF4444, #F59E0B)',
                                                    transition: 'width 0.4s ease',
                                                }} />
                                            </div>
                                            <span style={{ width: 60, fontSize: 12, fontWeight: 600, textAlign: 'right', color: isPositive ? '#10B981' : '#EF4444' }}>
                                                {isPositive ? '+' : ''}{sv.toFixed(3)}
                                            </span>
                                            <span style={{ width: 50, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                                                ({driver.feature_value?.toFixed(2)})
                                            </span>
                                        </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}

                    {/* ── Patent Landscape ─────────────────────────────── */}
                    {patentData && (
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>⚖️ Patent Landscape</span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span className="badge" style={{
                                        background: `${ftoColors[patentData.freedom_to_operate] || ftoColors.uncharted}20`,
                                        color: ftoColors[patentData.freedom_to_operate] || ftoColors.uncharted,
                                    }}>
                                        FTO: {patentData.freedom_to_operate?.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {patentData.total_patents} patents
                                    </span>
                                </div>
                            </div>
                            {patentData.key_patents?.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                    {patentData.key_patents.slice(0, 3).map((p: any, i: number) => (
                                        <div key={i} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.id} — {p.title}</div>
                                            <div style={{ color: 'var(--text-muted)' }}>
                                                {p.assignee} · {p.year} ·
                                                <span style={{ color: p.status === 'expired' ? '#10B981' : '#F59E0B' }}> {p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                💡 {patentData.recommendation}
                            </div>
                            {patentData.patent_cliff_year && (
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                    Patent cliff: {patentData.patent_cliff_year}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Score History ─────────────────────────────────── */}
                    {historyData && (
                        <div className="card">
                            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>📈 Score History</span>
                                <span className="badge" style={{
                                    background: historyData.trend === 'improving' ? 'rgba(16,185,129,0.15)' : historyData.trend === 'declining' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
                                    color: historyData.trend === 'improving' ? '#10B981' : historyData.trend === 'declining' ? '#EF4444' : '#94A3B8',
                                }}>
                                    {historyData.trend === 'improving' ? '↑' : historyData.trend === 'declining' ? '↓' : '→'} {historyData.trend}
                                </span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                {historyData.total_snapshots} snapshot{historyData.total_snapshots !== 1 ? 's' : ''} recorded
                                {historyData.score_delta !== 0 && (
                                    <span style={{ color: historyData.score_delta > 0 ? '#10B981' : '#EF4444', marginLeft: 8 }}>
                                        ({historyData.score_delta > 0 ? '+' : ''}{historyData.score_delta})
                                    </span>
                                )}
                            </div>
                            {historyData.history?.length > 0 && (
                                <div style={{ marginTop: 12, maxHeight: 150, overflowY: 'auto' }}>
                                    {historyData.history.map((h: any, i: number) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                                            <span style={{ fontWeight: 600 }}>{h.cvs_score}</span>
                                            <TierBadge tier={h.tier} />
                                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{h.model_version}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Feature Breakdown ────────────────────────────── */}
                    <div className="card">
                        <div className="card-header">Feature Breakdown</div>
                        {result.features && Object.entries(result.features).map(([k, v]) => (
                            <FeatureBar key={k} label={k.replace(/_/g, ' ')} value={v} />
                        ))}
                    </div>

                    {/* ── Safety Profile ────────────────────────────────── */}
                    {result.safety_report && (
                        <div className="card">
                            <div className="card-header">Safety Profile</div>
                            <div className="grid-3">
                                <div className="stat-card">
                                    <div className="stat-value">{result.safety_report.risk_level || 'N/A'}</div>
                                    <div className="stat-label">Risk Level</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{result.safety_report.critical_organ_flags || 0}</div>
                                    <div className="stat-label">Critical Organ Flags</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{result.safety_report.overall_safety?.toFixed(3) || 'N/A'}</div>
                                    <div className="stat-label">Overall Safety</div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Citation Modal ────────────────────────────────────── */}
            {showCiteModal && citationData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)',
                }} onClick={() => setShowCiteModal(false)}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 16, padding: 28, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>📝 Cite This Assessment</h3>
                            <button onClick={() => setShowCiteModal(false)} style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20,
                            }}>✕</button>
                        </div>
                        <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                            {citationData.antigen} · CVS {citationData.cvs_score} · {citationData.tier}
                        </div>
                        {Object.entries(citationData.citations || {}).map(([format, text]: [string, any]) => (
                            <div key={format} style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
                                        {format}
                                    </label>
                                    <button className="btn btn-secondary" onClick={() => copyToClipboard(text, format)}
                                        style={{ fontSize: 10, padding: '4px 10px' }}>
                                        {copiedFormat === format ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <pre style={{
                                    background: 'var(--bg-secondary)', padding: 12, borderRadius: 8,
                                    fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                    color: 'var(--text-primary)', border: '1px solid var(--border)',
                                }}>{text}</pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
