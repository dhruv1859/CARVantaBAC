import { useState } from 'react';
import React from 'react';

const API = import.meta.env.PROD ? 'https://carvanta.onrender.com' : '';

const S = {
  page: { maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: "'Inter',system-ui,sans-serif" } as React.CSSProperties,
  h1: { fontSize: 28, fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' as const },
  sub: { fontSize: 14, color: 'var(--text-muted,#94a3b8)', margin: '0 0 24px', textAlign: 'center' as const },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card,rgba(30,41,59,0.6))', border: '1px solid var(--border-color,rgba(148,163,184,0.12))', borderRadius: 14, padding: 5 } as React.CSSProperties,
  tab: (a: boolean) => ({ flex: 1, padding: '12px 8px', border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', background: a ? 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.15))' : 'transparent', color: a ? '#60a5fa' : 'var(--text-muted,#94a3b8)' }) as React.CSSProperties,
  card: { background: 'var(--bg-card,rgba(30,41,59,0.6))', border: '1px solid var(--border-color,rgba(148,163,184,0.12))', borderRadius: 14, padding: 20, marginBottom: 16, backdropFilter: 'blur(12px)' } as React.CSSProperties,
  sTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-primary,#f1f5f9)', margin: '0 0 14px', paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.1)' } as React.CSSProperties,
  input: { background: 'var(--bg-input,rgba(15,23,42,0.6))', border: '1px solid var(--border-color,rgba(148,163,184,0.15))', color: 'var(--text-primary,#f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' as const },
  textarea: { background: 'var(--bg-input,rgba(15,23,42,0.6))', border: '1px solid var(--border-color,rgba(148,163,184,0.15))', color: 'var(--text-primary,#f1f5f9)', padding: '10px 12px', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' as const, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit' },
  btn: { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnSm: { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  badge: (c: string) => ({ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${c}18`, color: c, border: `1px solid ${c}30`, display: 'inline-block' }),
  err: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '12px 18px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  statG: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10, marginBottom: 16 } as React.CSSProperties,
  stat: (a: string) => ({ background: `linear-gradient(135deg,${a}10,${a}05)`, border: `1px solid ${a}25`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' as const }),
  sv: { fontSize: 20, fontWeight: 800, color: 'var(--text-primary,#f1f5f9)', display: 'block' },
  sl: { fontSize: 10, fontWeight: 600, color: 'var(--text-muted,#94a3b8)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginTop: 4, display: 'block' },
};

type Tab = 'projects' | 'papers' | 'review' | 'notebooks' | 'messages';

export default function CollaborationHub() {
  const [tab, setTab] = useState<Tab>('projects');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Projects
  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pTemplate, setPTemplate] = useState('');
  const [projects, setProjects] = useState<any>(null);

  // Papers
  const [paperQ, setPaperQ] = useState('');
  const [papers, setPapers] = useState<any>(null);

  // Review
  const [rTitle, setRTitle] = useState('');
  const [rAbstract, setRAbstract] = useState('');
  const [submissions, setSubmissions] = useState<any>(null);

  const api = async (url: string, opts?: RequestInit) => {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API}${url}`, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e: any) { setError(e.message); return null; }
    finally { setLoading(false); }
  };

  const createProject = async () => {
    const d = await api('/api/v5/collab/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: pTitle, description: pDesc, owner_id: 'user_1', owner_name: 'researcher', template: pTemplate || undefined, tags: ['CAR-T'] }) });
    if (d) { setPTitle(''); setPDesc(''); loadProjects(); }
  };

  const loadProjects = async () => {
    const d = await api('/api/v5/collab/projects');
    if (d) setProjects(d);
  };

  const searchPapers = async () => {
    const d = await api(`/api/v5/collab/pubmed/search?query=${encodeURIComponent(paperQ)}&max_results=15`);
    if (d) setPapers(d);
  };

  const createSubmission = async () => {
    const d = await api('/api/v5/collab/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: 'demo', title: rTitle, abstract: rAbstract, content: rAbstract, author_id: 'user_1', author_name: 'researcher', submission_type: 'target_proposal' }) });
    if (d) { setRTitle(''); setRAbstract(''); loadSubmissions(); }
  };

  const loadSubmissions = async () => {
    const d = await api('/api/v5/collab/submissions');
    if (d) setSubmissions(d);
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>👥 Research Collaboration Hub</h1>
      <p style={S.sub}>Projects • Experiments • Notebooks • Peer Review • Literature</p>

      <div style={S.tabs}>
        {(['projects', 'papers', 'review', 'notebooks', 'messages'] as Tab[]).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {{ projects: '📁 Projects', papers: '📄 Literature', review: '⭐ Peer Review', notebooks: '📓 Notebooks', messages: '💬 Messages' }[t]}
          </button>
        ))}
      </div>

      {error && <div style={S.err}>⚠️ {error}</div>}

      {/* PROJECTS */}
      {tab === 'projects' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>📁 Create Project</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input style={S.input} placeholder="Project title…" value={pTitle} onChange={e => setPTitle(e.target.value)} />
            <select style={S.input} value={pTemplate} onChange={e => setPTemplate(e.target.value)}>
              <option value="">No template</option>
              <option value="car_t_target_discovery">CAR-T Target Discovery</option>
              <option value="clinical_correlative">Clinical Correlative</option>
              <option value="combination_therapy">Combination Therapy</option>
              <option value="manufacturing_optimization">Manufacturing QC</option>
            </select>
          </div>
          <textarea style={S.textarea} placeholder="Description…" value={pDesc} onChange={e => setPDesc(e.target.value)} />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={createProject} disabled={loading || !pTitle}>✨ Create</button>
            <button style={S.btnSm} onClick={loadProjects} disabled={loading}>🔄 Load All</button>
          </div>
        </div>
        {projects && (<>
          <div style={S.statG}>
            <div style={S.stat('#3b82f6')}><span style={S.sv}>{projects.total}</span><span style={S.sl}>Projects</span></div>
          </div>
          {projects.projects?.map((p: any) => (
            <div key={p.project_id} style={{ ...S.card, padding: 14 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{p.description}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={S.badge('#3b82f6')}>{p.status}</span>
                <span style={S.badge('#8b5cf6')}>👥 {p.team_count}</span>
                <span style={S.badge('#06b6d4')}>📄 {p.documents_count}</span>
                <span style={S.badge('#22c55e')}>🎯 {p.milestones_count} milestones</span>
                {p.tags?.map((t: string) => <span key={t} style={S.badge('#f59e0b')}>{t}</span>)}
              </div>
            </div>
          ))}
        </>)}
      </>)}

      {/* PAPERS */}
      {tab === 'papers' && (<>
        <div style={S.card}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Search PubMed (e.g., 'CD19 CAR-T outcomes')…" value={paperQ} onChange={e => setPaperQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPapers()} />
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={searchPapers} disabled={loading}>🔍 Search</button>
          </div>
        </div>
        {papers && (<>
          <div style={S.statG}>
            <div style={S.stat('#3b82f6')}><span style={S.sv}>{papers.total_results}</span><span style={S.sl}>Results</span></div>
          </div>
          {papers.articles?.map((a: any) => (
            <div key={a.pmid} style={{ ...S.card, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 4 }}>
                <span style={{ color: '#60a5fa', marginRight: 6 }}>PMID:{a.pmid}</span>{a.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{a.authors?.slice(0, 3).join(', ')}{a.authors?.length > 3 ? ' et al.' : ''} • {a.journal} ({a.year})</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={S.badge('#22c55e')}>📊 {a.citation_count} citations</span>
                {a.keywords?.slice(0, 3).map((k: string) => <span key={k} style={S.badge('#8b5cf6')}>{k}</span>)}
              </div>
            </div>
          ))}
        </>)}
      </>)}

      {/* PEER REVIEW */}
      {tab === 'review' && (<>
        <div style={S.card}>
          <h3 style={S.sTitle}>⭐ Submit for Peer Review</h3>
          <input style={{ ...S.input, marginBottom: 10 }} placeholder="Proposal title…" value={rTitle} onChange={e => setRTitle(e.target.value)} />
          <textarea style={S.textarea} placeholder="Abstract / summary…" value={rAbstract} onChange={e => setRAbstract(e.target.value)} />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={createSubmission} disabled={loading || !rTitle}>📤 Submit</button>
            <button style={S.btnSm} onClick={loadSubmissions} disabled={loading}>🔄 Load All</button>
          </div>
        </div>
        {submissions && (<>
          <div style={S.statG}>
            <div style={S.stat('#f59e0b')}><span style={S.sv}>{submissions.total}</span><span style={S.sl}>Submissions</span></div>
          </div>
          {submissions.submissions?.map((s: any) => (
            <div key={s.submission_id} style={{ ...S.card, padding: 14, borderLeft: `3px solid ${s.status === 'accepted' ? '#22c55e' : s.status === 'rejected' ? '#ef4444' : '#f59e0b'}` }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.author} • Round {s.review_round}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={S.badge(s.status === 'accepted' ? '#22c55e' : s.status === 'rejected' ? '#ef4444' : '#f59e0b')}>{s.status}</span>
                <span style={S.badge('#3b82f6')}>{s.reviews_count} reviews</span>
                <span style={S.badge('#22c55e')}>👍 {s.upvotes}</span>
                <span style={S.badge('#ef4444')}>👎 {s.downvotes}</span>
              </div>
            </div>
          ))}
        </>)}
      </>)}

      {/* NOTEBOOKS */}
      {tab === 'notebooks' && (
        <div style={S.card}>
          <h3 style={S.sTitle}>📓 Collaborative Notebooks</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Jupyter-like notebooks with templates:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 12, marginTop: 14 }}>
            {[{ name: 'Target Expression Analysis', desc: 'Analyze antigen expression across TCGA/GTEx', cells: 6 },
              { name: 'Manufacturing QC Dashboard', desc: 'Batch quality control analysis', cells: 4 },
              { name: 'CAR-T Survival Analysis', desc: 'Kaplan-Meier and Cox regression', cells: 4 }].map(t => (
              <div key={t.name} style={{ ...S.card, padding: 14, cursor: 'pointer', transition: 'all .2s', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 13, marginBottom: 4 }}>📓 {t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{t.desc}</div>
                <span style={S.badge('#3b82f6')}>{t.cells} cells</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGES */}
      {tab === 'messages' && (
        <div style={S.card}>
          <h3 style={S.sTitle}>💬 Team Messaging</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Real-time channels with threads, reactions, and @mentions.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginTop: 14 }}>
            {[{ name: '#general', desc: 'Main discussion', msgs: 42 }, { name: '#experiments', desc: 'Lab updates', msgs: 18 },
              { name: '#literature', desc: 'Paper discussions', msgs: 25 }, { name: '#announcements', desc: 'Team updates', msgs: 8 }].map(ch => (
              <div key={ch.name} style={{ ...S.card, padding: 14, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: 13 }}>{ch.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{ch.desc}</div>
                <span style={S.badge('#8b5cf6')}>{ch.msgs} messages</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
