import axios from 'axios';

const PROD_API = 'https://carvanta.onrender.com';

const api = axios.create({
    baseURL: import.meta.env.PROD ? PROD_API : '',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

/* ── Antigen List ─────────────────────────────────────── */
export const fetchAntigens = (search = '', limit = 50) =>
    api.get('/api/v5/antigens', { params: { search, limit } }).then(r => r.data?.antigens || []);

/* ── Scoring ──────────────────────────────────────────── */
export const scoreAntigen = (antigen_name: string, cancer_type?: string) =>
    api.post('/api/v5/score', { antigen_name, ...(cancer_type ? { cancer_type } : {}) }).then(r => r.data);

export const batchScore = (antigens) =>
    api.post('/api/v5/batch_score', { antigens }).then(r => r.data);

/* ── Rankings ─────────────────────────────────────────── */
export const fetchRankings = (top_n = 25, cancer_type = null) => {
    const params = { top_n };
    if (cancer_type) params.cancer_type = cancer_type;
    return api.get('/api/v5/rank', { params }).then(r => r.data);
};

export const fetchCancerTypes = () =>
    api.get('/api/v5/cancer-types').then(r => r.data);

/* ── Safety ───────────────────────────────────────────── */
export const fetchToxicity = (antigen) =>
    api.get(`/api/v5/safety/${antigen}`).then(r => r.data);

/* ── Multi-Target ─────────────────────────────────────── */
export const fetchMultiTarget = (antigens) =>
    api.post('/api/v5/multi-target', { antigens }).then(r => r.data);

/* ── Patient Stratification ───────────────────────────── */
export const fetchStratification = (antigen_name, cancer_type = null) =>
    api.post('/api/v5/stratify', { antigen_name, cancer_type }).then(r => r.data);

/* ── NLP Query ────────────────────────────────────────── */
export const executeQuery = (query: string, limit?: number) =>
    api.post('/api/query', { query, limit }, { timeout: 300000 }).then(r => r.data);

/* ── Clinical Trials ──────────────────────────────────── */
export const fetchClinicalTrials = (antigen) =>
    api.get(`/api/v5/clinical-trials/${antigen}`).then(r => r.data);

/* ── Dataset Intelligence ─────────────────────────────── */
export const fetchDatasetIntel = () =>
    api.get('/api/v5/dataset-intelligence').then(r => r.data);

/* ── Health ────────────────────────────────────────────── */
export const fetchHealth = () =>
    api.get('/api/v5/health').then(r => r.data);

/* ═══════════════════════════════════════════════════════════
   v5 — International Roadmap API Functions
   ═══════════════════════════════════════════════════════════ */

/* ── Drug Interactions ────────────────────────────────── */
export const fetchDrugInteractions = (antigen: string) =>
    api.get(`/api/v5/drug-interactions/${antigen}`).then(r => r.data);

export const fetchAllDrugInteractions = () =>
    api.get('/api/v5/drug-interactions').then(r => r.data);

/* ── SHAP Explainability ─────────────────────────────── */
export const fetchExplanation = (antigen: string) =>
    api.get(`/api/v5/explain/${antigen}`).then(r => r.data);

/* ── Citations ────────────────────────────────────────── */
export const fetchCitation = (antigen: string) =>
    api.get(`/api/v5/cite/${antigen}`).then(r => r.data);

/* ── FHIR Export ──────────────────────────────────────── */
export const fetchFHIR = (antigen: string) =>
    api.get(`/api/v5/fhir/${antigen}`).then(r => r.data);

/* ── Patent Landscape ─────────────────────────────────── */
export const fetchPatents = (antigen: string) =>
    api.get(`/api/v5/patents/${antigen}`).then(r => r.data);

export const fetchAllPatents = () =>
    api.get('/api/v5/patents').then(r => r.data);

/* ── Gene Notation ────────────────────────────────────── */
export const fetchGeneIds = (antigen: string) =>
    api.get(`/api/v5/gene-ids/${antigen}`).then(r => r.data);

/* ── Score History ────────────────────────────────────── */
export const fetchScoreHistory = (antigen: string) =>
    api.get(`/api/v5/score-history/${antigen}`).then(r => r.data);

export const recordSnapshot = (antigen: string) =>
    api.post(`/api/v5/score-snapshot?antigen_name=${antigen}`).then(r => r.data);

/* ── Community Submit ─────────────────────────────────── */
export const submitCommunity = (data: { antigen_name: string; submitter_name: string; evidence_url?: string; notes?: string }) =>
    api.post('/api/v5/community/submit', data, { timeout: 60000 }).then(r => r.data);

/* ── Benchmarks ───────────────────────────────────────── */
export const fetchBenchmarks = () =>
    api.get('/api/v5/dataset/benchmarks').then(r => r.data);

/* ── Model Card ───────────────────────────────────────── */
export const fetchModelCard = () =>
    api.get('/api/v5/model-card').then(r => r.data);

/* ── SDK Info ─────────────────────────────────────────── */
export const fetchSDKInfo = () =>
    api.get('/api/v5/sdk-info').then(r => r.data);

/* ── Audit Log ────────────────────────────────────────── */
export const fetchAuditLog = (limit = 100) =>
    api.get('/api/v5/audit-log', { params: { limit } }).then(r => r.data);

/* ── Batch Upload ─────────────────────────────────────── */
export const batchUpload = (genes: string[], cancer_type?: string) =>
    api.post('/api/v5/batch-upload', { genes, cancer_type }).then(r => r.data);

/* ═══════════════════════════════════════════════════════════
   Genomic File Upload & Analysis
   ═══════════════════════════════════════════════════════════ */

/* ── Quick Analyze (upload + detect abnormalities) ────── */
export const genomicQuickAnalyze = (file: File, cancer_type?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const params: any = {};
    if (cancer_type) params.cancer_type = cancer_type;
    return api.post('/api/v5/genomics/quick-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params,
        timeout: 120000,
    }).then(r => r.data);
};

/* ── Upload genomic file ─────────────────────────────── */
export const genomicUpload = (file: File, analysis_id: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/v5/genomics/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { analysis_id },
        timeout: 120000,
    }).then(r => r.data);
};

/* ── Analyze abnormalities ───────────────────────────── */
export const genomicAnalyzeAbnormalities = (analysis_id: string, cancer_type?: string) =>
    api.post(`/api/v5/genomics/analyze-abnormalities/${analysis_id}`, null, {
        params: { cancer_type: cancer_type || 'unknown' },
    }).then(r => r.data);

/* ── Genomic analysis summary ────────────────────────── */
export const genomicSummary = (analysis_id: string) =>
    api.get(`/api/v5/genomics/summary/${analysis_id}`).then(r => r.data);

export default api;
