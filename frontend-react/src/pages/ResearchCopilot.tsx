import { useState, useRef, useEffect } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

/* ═══════════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════════ */
const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
  header: { marginBottom: 24, textAlign: 'center' as const },
  h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: 14, color: 'var(--text-muted, #94a3b8)', margin: 0 },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 5 } as React.CSSProperties,
  tab: (active: boolean) => ({
    flex: 1, padding: '12px 10px', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
    background: active ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))' : 'transparent',
    color: active ? '#22d3ee' : 'var(--text-muted, #94a3b8)',
  }) as React.CSSProperties,
  card: { background: 'var(--bg-card, rgba(30,41,59,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sectionTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid var(--border-color, rgba(148,163,184,0.1))', display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  input: { background: 'var(--bg-input, rgba(15,23,42,0.6))', border: '1px solid var(--border-color, rgba(148,163,184,0.15))', color: 'var(--text-primary, #f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' as const },
  btn: { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(6,182,212,0.3)' },
  error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  badge: (color: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30`, display: 'inline-block' }),
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (accent: string) => ({ background: `linear-gradient(135deg, ${accent}10, ${accent}05)`, border: `1px solid ${accent}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }) as React.CSSProperties,
  statValue: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary, #f1f5f9)', display: 'block' },
  statLabel: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
};

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */
export default function ResearchCopilot() {
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'review' | 'protocol'>('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);

  // Review state
  const [reviewTarget, setReviewTarget] = useState('CD19');
  const [reviewData, setReviewData] = useState<any>(null);

  // Protocol state
  const [protoTarget, setProtoTarget] = useState('CD19');
  const [protoDesc, setProtoDesc] = useState('');
  const [protocolData, setProtocolData] = useState<any>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const api = async (url: string, opts?: RequestInit) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}${url}`, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: any) { setError(e.message); return null; }
    finally { setLoading(false); }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    const d = await api('/api/v5/copilot/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, session_id: sessionId }),
    });
    if (d) {
      setSessionId(d.session_id);
      setMessages(prev => [...prev, {
        role: 'assistant', content: d.response, confidence: d.confidence,
        sources: d.sources, intent: d.intent, ai_source: d.ai_source,
      }]);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>🤖 AI Research Copilot</h1>
        <p style={S.subtitle}>Conversational AI • Paper search • Literature reviews • Experiment protocols</p>
      </div>

      <div style={S.tabs}>
        {(['chat', 'search', 'review', 'protocol'] as const).map(tab => (
          <button key={tab} style={S.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'chat' ? '💬 Chat' : tab === 'search' ? '📚 Papers' : tab === 'review' ? '📝 Review' : '🧪 Protocol'}
          </button>
        ))}
      </div>

      {error && <div style={S.error}>⚠️ {error}</div>}

      {/* ═══ CHAT TAB ══════════════════════════════════════════════ */}
      {activeTab === 'chat' && (
        <div style={S.card}>
          <div style={{ minHeight: 400, maxHeight: 500, overflowY: 'auto', marginBottom: 16, padding: '0 4px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Ask me anything about immunotherapy research</div>
                <div style={{ fontSize: 12, lineHeight: 1.8, maxWidth: 400, margin: '0 auto' }}>
                  Try: "What are the latest CD19 CAR-T results?" or "Compare BCMA vs GPRC5D" or "Design a cytotoxicity assay for HER2"
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{
                  maxWidth: '80%', padding: '12px 16px', borderRadius: 14,
                  background: m.role === 'user' ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))' : 'rgba(30,41,59,0.8)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)'}`,
                }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary, #e2e8f0)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  {m.role === 'assistant' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      {m.ai_source && <span style={S.badge(m.ai_source === 'llm' ? '#10b981' : '#8b5cf6')}>{m.ai_source === 'llm' ? '🤖 LLM' : '📐 Rule-Based'}</span>}
                      {m.confidence && <span style={S.badge('#06b6d4')}>Confidence: {(m.confidence * 100).toFixed(0)}%</span>}
                      {m.intent && <span style={S.badge('#8b5cf6')}>{m.intent.replace(/_/g, ' ')}</span>}
                      {m.sources?.length > 0 && <span style={S.badge('#22c55e')}>{m.sources.length} sources</span>}
                    </div>
                  )}
                  {m.sources?.length > 0 && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ fontSize: 11, color: '#22d3ee', cursor: 'pointer', fontWeight: 600 }}>View Sources</summary>
                      {m.sources.map((s: any, j: number) => (
                        <div key={j} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                          [{s.rank}] {s.title} (PMID: {s.pmid})
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Ask a research question..." value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()} />
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap' }} onClick={sendChat} disabled={loading}>
              {loading ? '⏳' : '📤 Send'}
            </button>
          </div>
        </div>
      )}

      {/* ═══ SEARCH TAB ══════════════════════════════════════════ */}
      {activeTab === 'search' && (
        <>
          <div style={S.card}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="Search papers (e.g. 'CD19 antigen loss', 'CRS management')..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && api('/api/v5/copilot/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery, max_results: 15 }) }).then(d => d && setSearchResults(d))} />
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => {
                const d = await api('/api/v5/copilot/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery, max_results: 15 }) });
                if (d) setSearchResults(d);
              }} disabled={loading}>{loading ? '⏳' : '🔍 Search'}</button>
            </div>
          </div>

          {searchResults && (
            <>
              <div style={S.statGrid}>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{searchResults.total_results}</span><span style={S.statLabel}>Papers Found</span></div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {searchResults.papers?.map((p: any) => (
                  <div key={p.pmid} style={{ ...S.card, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 6 }}>
                          <span style={{ color: '#22d3ee', marginRight: 8 }}>#{p.rank}</span>{p.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{p.authors?.join(', ')} • {p.journal} ({p.year})</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {p.targets?.map((t: string) => <span key={t} style={S.badge('#a855f7')}>{t}</span>)}
                          {p.categories?.map((c: string) => <span key={c} style={S.badge('#06b6d4')}>{c.replace(/_/g, ' ')}</span>)}
                          <span style={S.badge('#f59e0b')}>📚 {p.citations} citations</span>
                          <span style={S.badge('#22c55e')}>IF: {p.impact_factor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ REVIEW TAB ══════════════════════════════════════════ */}
      {activeTab === 'review' && (
        <>
          <div style={S.card}>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ ...S.input, maxWidth: 200 }} value={reviewTarget} onChange={e => setReviewTarget(e.target.value)}>
                {['CD19','BCMA','HER2','MSLN','GPC3','DLL3','EGFR','PSMA','CD47'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => {
                const d = await api('/api/v5/copilot/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: reviewTarget }) });
                if (d) setReviewData(d);
              }} disabled={loading}>{loading ? '⏳' : '📝 Generate Review'}</button>
            </div>
          </div>

          {reviewData && (
            <div style={S.card}>
              <h3 style={S.sectionTitle}>📝 Literature Review: {reviewData.target}</h3>
              <div style={S.statGrid}>
                <div style={S.stat('#06b6d4')}><span style={S.statValue}>{reviewData.total_papers_reviewed}</span><span style={S.statLabel}>Papers Reviewed</span></div>
                <div style={S.stat('#22c55e')}><span style={S.statValue}>{(reviewData.confidence * 100).toFixed(0)}%</span><span style={S.statLabel}>Confidence</span></div>
              </div>
              {reviewData.sections?.map((s: any, i: number) => (
                <div key={i} style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(6,182,212,0.03)', borderLeft: '3px solid rgba(6,182,212,0.3)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#22d3ee', margin: '0 0 8px' }}>{s.heading}</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8, margin: 0 }}>{s.content}</p>
                  {s.citations?.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      {s.citations.map((c: string, j: number) => <div key={j}>{c}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ PROTOCOL TAB ══════════════════════════════════════════ */}
      {activeTab === 'protocol' && (
        <>
          <div style={S.card}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select style={{ ...S.input, maxWidth: 150 }} value={protoTarget} onChange={e => setProtoTarget(e.target.value)}>
                {['CD19','BCMA','HER2','MSLN','GPC3','EGFR'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input style={{ ...S.input, flex: 1, minWidth: 200 }} placeholder="Describe experiment (e.g. 'cytotoxicity assay', 'flow cytometry', 'xenograft')" value={protoDesc}
                onChange={e => setProtoDesc(e.target.value)} />
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={async () => {
                const d = await api('/api/v5/copilot/protocol', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: protoTarget, description: protoDesc }) });
                if (d) setProtocolData(d);
              }} disabled={loading}>{loading ? '⏳' : '🧪 Generate Protocol'}</button>
            </div>
          </div>

          {protocolData && (
            <>
              <div style={{ ...S.card, borderColor: 'rgba(6,182,212,0.3)' }}>
                <h3 style={S.sectionTitle}>🧪 {protocolData.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: '0 0 16px' }}><strong>Objective:</strong> {protocolData.objective}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>⏱ Timeline: {protocolData.timeline}</p>
              </div>

              {/* Steps */}
              <div style={S.card}>
                <h3 style={S.sectionTitle}>📋 Protocol Steps</h3>
                {protocolData.steps?.map((s: any) => (
                  <div key={s.step} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: s.critical ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: s.critical ? '#ef4444' : '#22d3ee', flexShrink: 0 }}>{s.step}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{s.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>⏱ {s.duration} {s.critical ? '⚠️ CRITICAL STEP' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reagents */}
              {protocolData.reagents?.length > 0 && (
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>🧫 Reagents Required</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {protocolData.reagents.map((r: any, i: number) => (
                      <div key={i} style={{ padding: 10, borderRadius: 8, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.1)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Cat# {r.catalog_number} • {r.vendor} • {r.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Controls & Safety */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>🔬 Controls Required</h3>
                  {protocolData.controls?.map((c: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', padding: '4px 0' }}>• {c}</div>
                  ))}
                </div>
                <div style={S.card}>
                  <h3 style={S.sectionTitle}>⚠️ Safety Notes</h3>
                  {protocolData.safety_notes?.map((n: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#f59e0b', padding: '4px 0' }}>⚠️ {n}</div>
                  ))}
                </div>
              </div>

              {/* Expected Outcome */}
              <div style={{ ...S.card, borderColor: 'rgba(34,197,94,0.3)' }}>
                <h3 style={S.sectionTitle}>✅ Expected Outcome</h3>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>{protocolData.expected_outcome}</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
