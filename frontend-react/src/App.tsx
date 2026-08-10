import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

/* ─── Lazy-loaded pages (code-split for fast initial load) ─── */
const SingleAnalysis = lazy(() => import('./pages/SingleAnalysis'));
const Comparison = lazy(() => import('./pages/Comparison'));
const TissueHeatmap = lazy(() => import('./pages/TissueHeatmap'));
const MultiTarget = lazy(() => import('./pages/MultiTarget'));
const Stratification = lazy(() => import('./pages/Stratification'));
const NLPSearch = lazy(() => import('./pages/NLPSearch'));
const ClinicalTrials = lazy(() => import('./pages/ClinicalTrials'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const DatasetIntel = lazy(() => import('./pages/DatasetIntel'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const DrugInteractions = lazy(() => import('./pages/DrugInteractions'));
const PatentExplorer = lazy(() => import('./pages/PatentExplorer'));
const CommunitySubmit = lazy(() => import('./pages/CommunitySubmit'));
const BatchUpload = lazy(() => import('./pages/BatchUpload'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MFASetup = lazy(() => import('./pages/MFASetup'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const OrgManagement = lazy(() => import('./pages/OrgManagement'));
const GenomicProfiler = lazy(() => import('./pages/GenomicProfiler'));
const GenomicUpload = lazy(() => import('./pages/GenomicUpload'));
const AdverseEvents = lazy(() => import('./pages/AdverseEvents'));
const OutcomesTracker = lazy(() => import('./pages/OutcomesTracker'));
const PopulationSimulator = lazy(() => import('./pages/PopulationSimulator'));
const PatientWizard = lazy(() => import('./pages/PatientWizard'));
const MultiOmics = lazy(() => import('./pages/MultiOmics'));
const NeuralBridge = lazy(() => import('./pages/NeuralBridge'));
const NeuralBridgeAdvanced = lazy(() => import('./pages/NeuralBridgeAdvanced'));
const NeuralBridgeDetail = lazy(() => import('./pages/NeuralBridgeDetail'));
const NeuralBridgeDashboard = lazy(() => import('./pages/NeuralBridgeDashboard'));
const GenomicAnalyzer = lazy(() => import('./pages/GenomicAnalyzer'));
const DrugDiscovery = lazy(() => import('./pages/DrugDiscovery'));
const ResearchCopilot = lazy(() => import('./pages/ResearchCopilot'));
const TrialMatcher = lazy(() => import('./pages/TrialMatcher'));
const CollaborationHub = lazy(() => import('./pages/CollaborationHub'));
const HealthEconomics = lazy(() => import('./pages/HealthEconomics'));
const DiseaseAtlas = lazy(() => import('./pages/DiseaseAtlas'));
const RegulatoryCompliance = lazy(() => import('./pages/RegulatoryCompliance'));
const DeepLearning = lazy(() => import('./pages/DeepLearning'));
const ModelValidation = lazy(() => import('./pages/ModelValidation'));

/* ─── Loading Spinner ─── */
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid rgba(165,180,252,0.2)',
        borderTop: '3px solid #a5b4fc', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: '#94a3b8', fontSize: 13, letterSpacing: 1 }}>Loading module...</div>
    </div>
  );
}

function ProtectedApp() {
  // Auth login bypassed for now — will reconnect later

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<SingleAnalysis />} />
          <Route path="/compare" element={<Comparison />} />
          <Route path="/heatmap" element={<TissueHeatmap />} />
          <Route path="/synergy" element={<MultiTarget />} />
          <Route path="/stratify" element={<Stratification />} />
          <Route path="/search" element={<NLPSearch />} />
          <Route path="/trials" element={<ClinicalTrials />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/dataset" element={<DatasetIntel />} />
          <Route path="/drugs" element={<DrugInteractions />} />
          <Route path="/patents" element={<PatentExplorer />} />
          <Route path="/community" element={<CommunitySubmit />} />
          <Route path="/batch" element={<BatchUpload />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/status" element={<SystemStatus />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/twin" element={<DigitalTwin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/mfa" element={<MFASetup />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/organizations" element={<OrgManagement />} />
          <Route path="/genomics" element={<GenomicProfiler />} />
          <Route path="/genome-upload" element={<GenomicUpload />} />
          <Route path="/adverse-events" element={<AdverseEvents />} />
          <Route path="/outcomes" element={<OutcomesTracker />} />
          <Route path="/population" element={<PopulationSimulator />} />
          <Route path="/wizard" element={<PatientWizard />} />
          <Route path="/multi-omics" element={<MultiOmics />} />
          <Route path="/neural-bridge" element={<NeuralBridge />} />
          <Route path="/neural-bridge/advanced" element={<NeuralBridgeAdvanced />} />
          <Route path="/neural-bridge/explorer" element={<NeuralBridgeDetail />} />
          <Route path="/neural-bridge/dashboard" element={<NeuralBridgeDashboard />} />
          <Route path="/genomic-analyzer" element={<GenomicAnalyzer />} />
          <Route path="/drug-discovery" element={<DrugDiscovery />} />
          <Route path="/research-copilot" element={<ResearchCopilot />} />
          <Route path="/trial-matcher" element={<TrialMatcher />} />
          <Route path="/collaboration" element={<CollaborationHub />} />
          <Route path="/health-economics" element={<HealthEconomics />} />
          <Route path="/disease-atlas" element={<DiseaseAtlas />} />
          <Route path="/regulatory" element={<RegulatoryCompliance />} />
          <Route path="/deep-learning" element={<DeepLearning />} />
          <Route path="/validation" element={<ModelValidation />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
