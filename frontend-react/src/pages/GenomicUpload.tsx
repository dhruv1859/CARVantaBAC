import { useState, useRef, useCallback } from 'react';
import { genomicQuickAnalyze, fetchCancerTypes } from '../api/client';
import { useEffect } from 'react';

const ACCEPTED_EXTENSIONS = ['.vcf', '.vcf.gz', '.fasta', '.fa', '.fasta.gz', '.fa.gz', '.fastq', '.fastq.gz', '.fq', '.fq.gz', '.bam'];
const MAX_SIZE_MB = 500;

/* ── Pathogenicity color map ─────────────────────────── */
const PATHO_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
    pathogenic: { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444', label: 'Pathogenic' },
    likely_pathogenic: { bg: 'rgba(249,115,22,0.15)', fg: '#F97316', label: 'Likely Pathogenic' },
    variant_of_uncertain_significance: { bg: 'rgba(234,179,8,0.15)', fg: '#EAB308', label: 'VUS' },
    likely_benign: { bg: 'rgba(34,197,94,0.15)', fg: '#22C55E', label: 'Likely Benign' },
    benign: { bg: 'rgba(16,185,129,0.15)', fg: '#10B981', label: 'Benign' },
};

const RISK_COLORS: Record<string, { bg: string; fg: string; icon: string }> = {
    low: { bg: 'rgba(16,185,129,0.12)', fg: '#10B981', icon: '✓' },
    moderate: { bg: 'rgba(249,115,22,0.12)', fg: '#F97316', icon: '⚠' },
    high: { bg: 'rgba(239,68,68,0.12)', fg: '#EF4444', icon: '🔴' },
    critical: { bg: 'rgba(239,68,68,0.2)', fg: '#EF4444', icon: '🚨' },
};

export default function GenomicUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [cancerType, setCancerType] = useState('');
    const [cancerTypes, setCancerTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCancerTypes()
            .then((data: any) => setCancerTypes(data?.cancer_types || []))
            .catch(() => setCancerTypes([]));
    }, []);

    const validateFile = (f: File): string | null => {
        const name = f.name.toLowerCase();
        const isValid = ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext));
        if (!isValid) return `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`;
        if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File exceeds ${MAX_SIZE_MB}MB limit`;
        return null;
    };

    const handleFileSelect = (f: File) => {
        const err = validateFile(f);
        if (err) { setError(err); return; }
        setFile(f);
        setError('');
        setResult(null);
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    }, []);

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        setResult(null);
        setUploadProgress(10);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 15, 85));
            }, 400);

            const data = await genomicQuickAnalyze(file, cancerType || undefined);
            clearInterval(progressInterval);
            setUploadProgress(100);
            setResult(data);
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Analysis failed. Please check file format.');
        } finally {
            setLoading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getFileTypeIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('.vcf')) return '🧬';
        if (lower.includes('.fasta') || lower.includes('.fa')) return '📄';
        if (lower.includes('.fastq') || lower.includes('.fq')) return '📊';
        if (lower.includes('.bam')) return '📦';
        return '📁';
    };

    const analysis = result?.analysis;
    const isVCFResult = analysis?.abnormalities !== undefined;
    const isFASTAResult = analysis?.total_sequences !== undefined;

    return (
        <>
            <div className="page-header">
                <h2>🧬 Genome Upload & Analysis</h2>
                <p>Upload your genome sequencing file to detect mutations, abnormalities, and CAR-T-relevant findings</p>
            </div>

            {/* ── Upload Zone ──────────────────────────────────── */}
            <div className="card">
                <div className="card-header">Upload Genomic File</div>

                <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragActive ? '#3B82F6' : 'var(--border)'}`,
                        borderRadius: 12,
                        padding: '48px 24px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragActive ? 'rgba(59,130,246,0.06)' : 'var(--bg-secondary)',
                        transition: 'all 0.2s ease',
                        marginBottom: 16,
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS.join(',')}
                        onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.7 }}>
                        {file ? getFileTypeIcon(file.name) : '📂'}
                    </div>
                    {file ? (
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{file.name}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatFileSize(file.size)}</div>
                            <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 8 }}>
                                Click or drag to replace
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                                Drop your genomic file here
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                                or click to browse
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {['.vcf', '.fasta', '.fastq', '.bam'].map(ext => (
                                    <span key={ext} className="badge" style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        color: '#3B82F6',
                                        fontSize: 11,
                                    }}>{ext}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="input-row" style={{ alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Cancer Context <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(optional)</span></label>
                        <select className="form-control" value={cancerType} onChange={e => setCancerType(e.target.value)}>
                            <option value="">Auto-detect</option>
                            {cancerTypes.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                        </select>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleAnalyze}
                        disabled={!file || loading}
                        style={{ height: 42 }}
                    >
                        {loading ? '⏳ Analyzing...' : '🔬 Analyze Genome'}
                    </button>
                </div>

                {/* Progress bar */}
                {loading && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{
                            height: 6, borderRadius: 3,
                            background: 'var(--bg-secondary)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', borderRadius: 3,
                                background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                                width: `${uploadProgress}%`,
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                            {uploadProgress < 30 ? 'Uploading file...' :
                             uploadProgress < 60 ? 'Parsing genomic data...' :
                             uploadProgress < 85 ? 'Running abnormality detection...' :
                             'Generating report...'}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Error ──────────────────────────────────────── */}
            {error && (
                <div className="card" style={{ borderLeft: '4px solid #EF4444', padding: '16px 20px' }}>
                    <span style={{ color: '#EF4444', fontWeight: 600 }}>❌ {error}</span>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                RESULTS DASHBOARD
               ═══════════════════════════════════════════════════ */}
            {result && (
                <>
                    {/* ── Upload Summary ──────────────────────────── */}
                    <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>✅ File Processed Successfully</span>
                            <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                                {result.upload?.file_type?.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                            <div className="stat-card">
                                <div className="stat-label">File Type</div>
                                <div className="stat-value" style={{ fontSize: 20 }}>{result.upload?.file_type?.toUpperCase()}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">File Size</div>
                                <div className="stat-value" style={{ fontSize: 20 }}>{result.upload?.file_size_mb} MB</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Records Parsed</div>
                                <div className="stat-value" style={{ fontSize: 20 }}>{result.upload?.record_count?.toLocaleString()}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Analysis ID</div>
                                <div className="stat-value" style={{ fontSize: 14, fontFamily: 'monospace' }}>{result.analysis_id}</div>
                            </div>
                        </div>
                    </div>

                    {/* ── VCF/Variant Results ─────────────────────── */}
                    {isVCFResult && (
                        <>
                            {/* Overall Assessment */}
                            {analysis.overall_assessment && (
                                <div className="card" style={{
                                    borderLeft: `4px solid ${RISK_COLORS[analysis.overall_assessment.risk_level]?.fg || '#94A3B8'}`,
                                }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{RISK_COLORS[analysis.overall_assessment.risk_level]?.icon} Overall Genomic Assessment</span>
                                        <span className="badge" style={{
                                            background: RISK_COLORS[analysis.overall_assessment.risk_level]?.bg,
                                            color: RISK_COLORS[analysis.overall_assessment.risk_level]?.fg,
                                        }}>
                                            {analysis.overall_assessment.risk_level?.toUpperCase()} RISK
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                        {analysis.overall_assessment.summary}
                                    </div>
                                    <div style={{
                                        padding: '12px 16px', borderRadius: 8,
                                        background: 'rgba(59,130,246,0.06)',
                                        fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic',
                                    }}>
                                        💡 {analysis.overall_assessment.recommendation}
                                    </div>

                                    {/* CAR-T Impact */}
                                    {analysis.overall_assessment.car_t_impact !== 'none' && (
                                        <div style={{
                                            marginTop: 12, padding: '12px 16px', borderRadius: 8,
                                            background: analysis.overall_assessment.car_t_impact === 'critical'
                                                ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)',
                                            border: `1px solid ${analysis.overall_assessment.car_t_impact === 'critical'
                                                ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}`,
                                        }}>
                                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4,
                                                color: analysis.overall_assessment.car_t_impact === 'critical' ? '#EF4444' : '#F97316' }}>
                                                🎯 CAR-T Therapy Impact
                                            </div>
                                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                {analysis.overall_assessment.car_t_summary}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pathogenicity Summary */}
                            <div className="card">
                                <div className="card-header">📊 Pathogenicity Distribution</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                                    {Object.entries(analysis.pathogenicity_summary || {}).map(([key, count]: [string, any]) => {
                                        const style = PATHO_COLORS[key] || { bg: 'rgba(100,116,139,0.1)', fg: '#94A3B8', label: key };
                                        return (
                                            <div key={key} style={{
                                                padding: '16px', borderRadius: 10,
                                                background: style.bg, textAlign: 'center',
                                                border: `1px solid ${style.fg}20`,
                                            }}>
                                                <div style={{ fontSize: 28, fontWeight: 800, color: style.fg }}>{count}</div>
                                                <div style={{ fontSize: 11, fontWeight: 600, color: style.fg, marginTop: 4 }}>
                                                    {style.label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Detected Abnormalities Table */}
                            {analysis.abnormalities?.length > 0 && (
                                <div className="card">
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>🔬 Detected Mutations & Abnormalities</span>
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {analysis.total_abnormalities} findings
                                        </span>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={thStyle}>Gene</th>
                                                    <th style={thStyle}>Coordinate</th>
                                                    <th style={thStyle}>Pathogenicity</th>
                                                    <th style={thStyle}>Consequence</th>
                                                    <th style={thStyle}>Significance</th>
                                                    <th style={thStyle}>Actionability</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analysis.abnormalities.map((abn: any, i: number) => {
                                                    const ps = PATHO_COLORS[abn.pathogenicity] || PATHO_COLORS.benign;
                                                    return (
                                                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={tdStyle}>
                                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{abn.gene}</span>
                                                            </td>
                                                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11 }}>
                                                                {abn.coordinate}
                                                            </td>
                                                            <td style={tdStyle}>
                                                                <span className="badge" style={{ background: ps.bg, color: ps.fg, fontSize: 10 }}>
                                                                    {ps.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ ...tdStyle, fontSize: 12 }}>{abn.consequence}</td>
                                                            <td style={{ ...tdStyle, fontSize: 12, maxWidth: 250, lineHeight: 1.4 }}>
                                                                {abn.significance}
                                                            </td>
                                                            <td style={{ ...tdStyle, fontSize: 11, color: 'var(--accent-blue)' }}>
                                                                {abn.actionability}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* CAR-T Findings */}
                            {analysis.car_t_findings?.length > 0 && (
                                <div className="card" style={{ borderLeft: '4px solid #8B5CF6' }}>
                                    <div className="card-header">🎯 CAR-T Relevant Findings</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                                        {analysis.car_t_findings.map((finding: any, i: number) => (
                                            <div key={i} style={{
                                                padding: '14px 18px', borderRadius: 10,
                                                border: '1px solid var(--border)',
                                                background: 'var(--bg-secondary)',
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 15 }}>{finding.gene}</span>
                                                    <span className="badge" style={{
                                                        background: 'rgba(139,92,246,0.12)',
                                                        color: '#8B5CF6', fontSize: 10,
                                                    }}>
                                                        {finding.type.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    {finding.relevance}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 6 }}>
                                                    {finding.actionability}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Disease Associations */}
                            {analysis.disease_associations && Object.keys(analysis.disease_associations).length > 0 && (
                                <div className="card">
                                    <div className="card-header">🏥 Disease Associations</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {Object.entries(analysis.disease_associations).map(([disease, count]: [string, any]) => (
                                            <span key={disease} className="badge" style={{
                                                background: 'rgba(59,130,246,0.1)',
                                                color: '#3B82F6',
                                                padding: '6px 14px',
                                                fontSize: 12,
                                            }}>
                                                {disease} ({count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── FASTA Quality Results ──────────────────── */}
                    {isFASTAResult && (
                        <>
                            <div className="card">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>📊 Sequence Quality Report</span>
                                    <span className="badge" style={{
                                        background: analysis.summary?.overall_quality === 'good'
                                            ? 'rgba(16,185,129,0.15)' : analysis.summary?.overall_quality === 'moderate'
                                            ? 'rgba(249,115,22,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: analysis.summary?.overall_quality === 'good'
                                            ? '#10B981' : analysis.summary?.overall_quality === 'moderate'
                                            ? '#F97316' : '#EF4444',
                                    }}>
                                        {analysis.summary?.overall_quality?.toUpperCase()} QUALITY
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                                    <div className="stat-card">
                                        <div className="stat-label">Total Sequences</div>
                                        <div className="stat-value" style={{ fontSize: 22, color: '#3B82F6' }}>
                                            {analysis.total_sequences?.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Total Bases</div>
                                        <div className="stat-value" style={{ fontSize: 22, color: '#8B5CF6' }}>
                                            {analysis.summary?.total_bases?.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Avg Length</div>
                                        <div className="stat-value" style={{ fontSize: 22, color: '#06B6D4' }}>
                                            {analysis.summary?.average_length?.toLocaleString()} bp
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Avg GC Content</div>
                                        <div className="stat-value" style={{ fontSize: 22, color: '#10B981' }}>
                                            {((analysis.summary?.average_gc_content || 0) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">High Quality</div>
                                        <div className="stat-value" style={{ fontSize: 22, color: '#F59E0B' }}>
                                            {analysis.summary?.quality_percentage?.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-label">Ambiguous Bases</div>
                                        <div className="stat-value" style={{ fontSize: 22, color: '#EF4444' }}>
                                            {analysis.summary?.total_ambiguous_bases?.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Length Distribution */}
                            {analysis.summary?.length_distribution && (
                                <div className="card">
                                    <div className="card-header">📏 Sequence Length Distribution</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                                        {Object.entries(analysis.summary.length_distribution).map(([bucket, count]: [string, any]) => (
                                            <div key={bucket} style={{
                                                textAlign: 'center', padding: '14px',
                                                borderRadius: 10, background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border)',
                                            }}>
                                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)' }}>{count}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'capitalize' }}>
                                                    {bucket.replace('_', ' ')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Individual Sequences */}
                            {analysis.analysis?.length > 0 && (
                                <div className="card">
                                    <div className="card-header">🧬 Sequence Details</div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th style={thStyle}>ID</th>
                                                    <th style={thStyle}>Description</th>
                                                    <th style={thStyle}>Length</th>
                                                    <th style={thStyle}>GC%</th>
                                                    <th style={thStyle}>N Count</th>
                                                    <th style={thStyle}>Quality</th>
                                                    <th style={thStyle}>Flags</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analysis.analysis.slice(0, 50).map((seq: any, i: number) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ ...tdStyle, fontWeight: 600 }}>{seq.sequence_id}</td>
                                                        <td style={{ ...tdStyle, fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {seq.description || '—'}
                                                        </td>
                                                        <td style={tdStyle}>{seq.length?.toLocaleString()}</td>
                                                        <td style={tdStyle}>{((seq.gc_content || 0) * 100).toFixed(1)}%</td>
                                                        <td style={tdStyle}>{seq.n_count}</td>
                                                        <td style={tdStyle}>
                                                            <div style={{
                                                                width: 40, height: 6, borderRadius: 3,
                                                                background: 'var(--bg-secondary)',
                                                            }}>
                                                                <div style={{
                                                                    width: `${(seq.quality_score || 0) * 100}%`,
                                                                    height: '100%', borderRadius: 3,
                                                                    background: seq.quality_score > 0.7 ? '#10B981'
                                                                        : seq.quality_score > 0.4 ? '#F59E0B' : '#EF4444',
                                                                }} />
                                                            </div>
                                                        </td>
                                                        <td style={tdStyle}>
                                                            {seq.quality_flags?.length > 0 ? (
                                                                seq.quality_flags.map((f: string) => (
                                                                    <span key={f} className="badge" style={{
                                                                        background: 'rgba(239,68,68,0.1)',
                                                                        color: '#EF4444', fontSize: 9,
                                                                        marginRight: 4,
                                                                    }}>{f.replace(/_/g, ' ')}</span>
                                                                ))
                                                            ) : (
                                                                <span style={{ color: '#10B981', fontSize: 11 }}>✓ pass</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </>
    );
}

/* ── Table styles ──────────────────────────────────────── */
const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 14px',
    fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: '#64748B',
    fontWeight: 600, borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
    padding: '12px 14px', fontSize: 13,
    color: 'var(--text-secondary)', verticalAlign: 'top',
};
