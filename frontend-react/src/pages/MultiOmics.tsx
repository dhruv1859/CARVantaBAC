import { useState } from 'react';
import '../styles/digital-twin.css';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

const LAYER_INFO: Record<string, { icon: string; color: string; label: string }> = {
  transcriptomics: { icon: '🧬', color: '#22c55e', label: 'Transcriptomics' },
  proteomics: { icon: '🔬', color: '#3b82f6', label: 'Proteomics' },
  epigenomics: { icon: '🧪', color: '#a855f7', label: 'Epigenomics' },
  metabolomics: { icon: '⚗️', color: '#f59e0b', label: 'Metabolomics' },
  single_cell: { icon: '🔍', color: '#ec4899', label: 'Single-Cell' },
  mutations: { icon: '🧩', color: '#ef4444', label: 'Mutations' },
};

export default function MultiOmics() {
  const [gene, setGene] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!gene.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setActiveLayer(null);
    try {
      const url = `${API}/api/v5/omics/analyze/${gene.trim()}${cancerType ? `?cancer_type=${cancerType}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const renderRadarChart = () => {
    if (!result?.radar_chart_data) return null;
    const data = result.radar_chart_data;
    const size = 280;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = 110;
    const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const n = data.length;
    const angleStep = (2 * Math.PI) / n;

    const getPoint = (i: number, val: number) => {
      const angle = i * angleStep - Math.PI / 2;
      return { x: cx + maxR * val * Math.cos(angle), y: cy + maxR * val * Math.sin(angle) };
    };

    const polygon = data.map((_: any, i: number) => {
      const p = getPoint(i, data[i].value);
      return `${p.x},${p.y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 340, margin: '0 auto', display: 'block' }}>
        {levels.map(l => (
          <polygon
            key={l}
            points={data.map((_: any, i: number) => { const p = getPoint(i, l); return `${p.x},${p.y}`; }).join(' ')}
            fill="none" stroke="rgba(165,180,252,0.15)" strokeWidth={1}
          />
        ))}
        {data.map((_: any, i: number) => {
          const p = getPoint(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(165,180,252,0.1)" strokeWidth={1} />;
        })}
        <polygon points={polygon} fill="rgba(99,102,241,0.25)" stroke="#6366f1" strokeWidth={2} />
        {data.map((d: any, i: number) => {
          const p = getPoint(i, d.value);
          const lp = getPoint(i, 1.18);
          const layer = Object.keys(LAYER_INFO)[i];
          const info = LAYER_INFO[layer];
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill={info?.color || '#6366f1'} stroke="#fff" strokeWidth={1.5} />
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                fill="var(--color-text-secondary, #94a3b8)" fontSize={10} fontWeight={600}>
                {d.axis}
              </text>
              <text x={lp.x} y={lp.y + 13} textAnchor="middle" dominantBaseline="middle"
                fill={info?.color || '#a5b4fc'} fontSize={10} fontWeight={700}>
                {(d.value * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
        <text x={cx} y={cx - 10} textAnchor="middle" fill="var(--color-text, #e2e8f0)" fontSize={22} fontWeight={800}>
          {(result.mots_score * 100).toFixed(0)}
        </text>
        <text x={cx} y={cx + 8} textAnchor="middle" fill="var(--color-text-secondary, #94a3b8)" fontSize={9}>
          MOTS Score
        </text>
      </svg>
    );
  };

  const renderLayerDetail = () => {
    if (!activeLayer || !result?.layers?.[activeLayer]) return null;
    const layer = result.layers[activeLayer];
    const info = LAYER_INFO[activeLayer];

    return (
      <div className="dt-section" style={{ borderLeft: `3px solid ${info.color}` }}>
        <h3 style={{ color: info.color }}>{info.icon} {info.label} — Detailed Analysis</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>{layer.summary}</p>
        <div className="dt-grid-2">
          <div className="dt-field"><span className="dt-field-label">Layer Score</span><span className="dt-field-value" style={{ color: info.color, fontSize: 24 }}>{(layer.layer_score * 100).toFixed(1)}%</span></div>
          <div className="dt-field"><span className="dt-field-label">Data Source</span><span className="dt-field-value">{layer.data_source}</span></div>
        </div>

        {activeLayer === 'transcriptomics' && layer.top_cancer_types && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ color: 'var(--color-text)', marginBottom: 8 }}>Top Cancer Types by Expression</h4>
            <div className="dt-table-wrap">
              <table className="dt-table"><thead><tr>
                <th>Cancer</th><th>Log2FC</th><th>p-value</th>
              </tr></thead><tbody>
                {layer.top_cancer_types.map((t: any, i: number) => (
                  <tr key={i}><td>{t.cancer_name}</td>
                    <td style={{ color: t.log2fc > 2 ? '#22c55e' : '#f59e0b' }}>{t.log2fc?.toFixed(2)}</td>
                    <td>{t.p_value?.toExponential(2)}</td></tr>
                ))}
              </tbody></table>
            </div>
          </div>
        )}

        {activeLayer === 'proteomics' && (
          <div className="dt-grid-2" style={{ marginTop: 12 }}>
            <div className="dt-field"><span className="dt-field-label">Surface Protein</span><span className="dt-field-value">{layer.is_surface_protein ? '✅ Yes' : '❌ No'}</span></div>
            <div className="dt-field"><span className="dt-field-label">Protein Type</span><span className="dt-field-value">{layer.protein_type}</span></div>
            <div className="dt-field"><span className="dt-field-label">Accessibility</span><span className="dt-field-value">{(layer.accessibility_score * 100).toFixed(1)}%</span></div>
            <div className="dt-field"><span className="dt-field-label">Shedding Risk</span><span className="dt-field-value" style={{ color: layer.shedding_risk > 0.4 ? '#ef4444' : '#22c55e' }}>{(layer.shedding_risk * 100).toFixed(1)}%</span></div>
            <div className="dt-field"><span className="dt-field-label">Epitope Count</span><span className="dt-field-value">{layer.epitope_count}</span></div>
            <div className="dt-field"><span className="dt-field-label">Localization</span><span className="dt-field-value">{layer.primary_localization}</span></div>
          </div>
        )}

        {activeLayer === 'epigenomics' && (
          <div className="dt-grid-2" style={{ marginTop: 12 }}>
            <div className="dt-field"><span className="dt-field-label">Promoter Methylation</span><span className="dt-field-value">{(layer.promoter_methylation_beta * 100).toFixed(1)}%</span></div>
            <div className="dt-field"><span className="dt-field-label">Chromatin Accessibility</span><span className="dt-field-value">{(layer.chromatin_accessibility * 100).toFixed(1)}%</span></div>
            <div className="dt-field"><span className="dt-field-label">Stability Score</span><span className="dt-field-value" style={{ color: layer.stability_score >= 0.6 ? '#22c55e' : '#ef4444' }}>{(layer.stability_score * 100).toFixed(1)}%</span></div>
            <div className="dt-field"><span className="dt-field-label">Silencing Risk</span><span className="dt-field-value" style={{ color: layer.silencing_probability > 0.3 ? '#ef4444' : '#22c55e' }}>{(layer.silencing_probability * 100).toFixed(1)}%</span></div>
            <div className="dt-field"><span className="dt-field-label">Super Enhancer</span><span className="dt-field-value">{layer.has_super_enhancer ? '✅' : '—'}</span></div>
            <div className="dt-field"><span className="dt-field-label">CpG Islands</span><span className="dt-field-value">{layer.cpg_island_count}</span></div>
          </div>
        )}

        {activeLayer === 'single_cell' && (
          <div className="dt-grid-2" style={{ marginTop: 12 }}>
            <div className="dt-field"><span className="dt-field-label">Expressing Cells</span><span className="dt-field-value">{(layer.expressing_fraction * 100).toFixed(1)}%</span></div>
            <div className="dt-field"><span className="dt-field-label">Cells Analyzed</span><span className="dt-field-value">{layer.total_cells_analyzed?.toLocaleString()}</span></div>
            <div className="dt-field"><span className="dt-field-label">Escape Risk</span><span className="dt-field-value" style={{ color: layer.antigen_escape_risk > 0.4 ? '#ef4444' : '#22c55e' }}>{layer.escape_risk_category}</span></div>
            <div className="dt-field"><span className="dt-field-label">Gini Coefficient</span><span className="dt-field-value">{layer.gini_coefficient?.toFixed(3)}</span></div>
          </div>
        )}

        {activeLayer === 'mutations' && (
          <>
            <div className="dt-grid-2" style={{ marginTop: 12 }}>
              <div className="dt-field"><span className="dt-field-label">Total Variants</span><span className="dt-field-value">{layer.total_variants}</span></div>
              <div className="dt-field"><span className="dt-field-label">Critical (Epitope Loss)</span><span className="dt-field-value" style={{ color: layer.critical_variants > 0 ? '#ef4444' : '#22c55e' }}>{layer.critical_variants}</span></div>
              <div className="dt-field"><span className="dt-field-label">Beneficial</span><span className="dt-field-value" style={{ color: '#22c55e' }}>{layer.beneficial_variants}</span></div>
              <div className="dt-field"><span className="dt-field-label">Resistance Risk</span><span className="dt-field-value">{layer.resistance_category}</span></div>
            </div>
            {layer.waterfall_data?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: 'var(--color-text)', marginBottom: 8 }}>Variant Waterfall</h4>
                <div className="dt-table-wrap"><table className="dt-table"><thead><tr>
                  <th>Variant</th><th>Type</th><th>Impact</th><th>Frequency</th>
                </tr></thead><tbody>
                  {layer.waterfall_data.slice(0, 8).map((v: any, i: number) => (
                    <tr key={i}><td style={{ fontSize: 11 }}>{v.variant}</td><td>{v.type}</td>
                      <td style={{ color: v.severity === 'critical' ? '#ef4444' : v.severity === 'beneficial' ? '#22c55e' : '#f59e0b' }}>{v.impact}</td>
                      <td>{(v.frequency * 100).toFixed(1)}%</td></tr>
                  ))}
                </tbody></table></div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="dt-page">
      <div className="dt-header">
        <h1>🧬 Multi-Omics Intelligence Engine</h1>
        <p>Integrated 5-layer omics analysis for CAR-T target evaluation</p>
      </div>

      <div className="dt-section">
        <h3>Target Gene</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input className="dt-input" placeholder="Gene symbol (e.g. CD19, HER2, EGFR)"
            value={gene} onChange={e => setGene(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            style={{ flex: 1, minWidth: 200 }} />
          <input className="dt-input" placeholder="Cancer type (optional, e.g. BRCA)"
            value={cancerType} onChange={e => setCancerType(e.target.value)}
            style={{ width: 200 }} />
          <button className="dt-btn dt-btn-primary" onClick={handleAnalyze} disabled={loading || !gene.trim()}>
            {loading ? '⏳ Analyzing...' : '🔬 Analyze'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {['CD19', 'HER2', 'EGFR', 'MSLN', 'BCMA', 'CD22', 'GPC3', 'PSMA'].map(g => (
            <button key={g} className="dt-btn" onClick={() => { setGene(g); }}
              style={{ fontSize: 11, padding: '4px 10px', opacity: 0.8 }}>{g}</button>
          ))}
        </div>
      </div>

      {error && <div className="dt-error">❌ {error}</div>}

      {result && (
        <>
          {/* MOTS Score + Tier */}
          <div className="dt-section" style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 8, background: result.tier_color + '22', border: `1px solid ${result.tier_color}`, color: result.tier_color, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
              Tier {result.tier} — {result.tier_label}
            </div>
            {renderRadarChart()}
          </div>

          {/* Layer Selector Cards */}
          <div className="dt-section">
            <h3>Omics Layers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {Object.entries(LAYER_INFO).map(([key, info]) => {
                const score = result.layer_scores?.[key];
                const isActive = activeLayer === key;
                return (
                  <button key={key} onClick={() => setActiveLayer(isActive ? null : key)}
                    style={{ background: isActive ? info.color + '22' : 'var(--color-surface, rgba(30,30,60,0.6))', border: `1.5px solid ${isActive ? info.color : 'rgba(165,180,252,0.12)'}`, borderRadius: 10, padding: '14px 10px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 22 }}>{info.icon}</div>
                    <div style={{ color: info.color, fontWeight: 700, fontSize: 12, marginTop: 4 }}>{info.label}</div>
                    <div style={{ color: 'var(--color-text, #e2e8f0)', fontWeight: 800, fontSize: 20, marginTop: 4 }}>{score != null ? (score * 100).toFixed(0) + '%' : '—'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Layer Detail */}
          {renderLayerDetail()}

          {/* Key Findings */}
          {result.key_findings?.length > 0 && (
            <div className="dt-section">
              <h3>Key Findings</h3>
              {result.key_findings.map((f: any, i: number) => {
                const info = LAYER_INFO[f.layer];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(165,180,252,0.08)' }}>
                    <span style={{ fontSize: 16 }}>{f.importance === 'positive' ? '✅' : f.importance === 'negative' ? '⚠️' : 'ℹ️'}</span>
                    <span style={{ color: info?.color || '#a5b4fc', fontWeight: 600, fontSize: 11, minWidth: 100 }}>{info?.label || f.layer}</span>
                    <span style={{ color: 'var(--color-text, #e2e8f0)', fontSize: 13 }}>{f.finding}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Risk Factors */}
          {result.risk_factors?.length > 0 && (
            <div className="dt-section">
              <h3>⚠️ Risk Factors</h3>
              <div className="dt-grid-2">
                {result.risk_factors.map((r: any, i: number) => (
                  <div key={i} className="dt-card-mini" style={{ borderLeft: `3px solid ${r.severity === 'critical' ? '#ef4444' : r.severity === 'high' ? '#f59e0b' : '#3b82f6'}` }}>
                    <div className="dt-card-mini-label">{r.category}</div>
                    <div className="dt-card-mini-big" style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{r.detail}</div>
                    <div style={{ color: r.severity === 'critical' ? '#ef4444' : r.severity === 'high' ? '#f59e0b' : '#3b82f6', fontSize: 11, fontWeight: 600, marginTop: 4 }}>{r.severity.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <div className="dt-section" style={{ borderLeft: `3px solid ${result.tier_color}` }}>
              <h3>💡 AI Recommendation</h3>
              <p style={{ color: 'var(--color-text)', lineHeight: 1.7 }}>{result.recommendation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
