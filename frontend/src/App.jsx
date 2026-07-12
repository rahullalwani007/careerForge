import React, { useState, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import ToastManager from './components/Toast';
import AIAssistant from './components/AIAssistant';
import QuickNote from './components/QuickNote';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import InterviewPage from './pages/InterviewPage';
import ReportPage from './pages/ReportPage';
import LearningPage from './pages/LearningPage';
import CareerPage from './pages/CareerPage';
import ProfilePage from './pages/ProfilePage';
import NotesPage from './pages/NotesPage';
import CareerPathPage from './pages/CareerPathPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import SkillAssessmentPage from './pages/SkillAssessmentPage';
import GroupDiscussionPage from './pages/GroupDiscussionPage';
import PlacementDrivePage from './pages/PlacementDrivePage';
import { FileText, RefreshCw } from 'lucide-react';

/* ── Error Boundary (catches render crashes → no more blank pages) ── */
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) { console.error('CareerForge AI error:', e); }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--bg)', padding:24 }}>
        <div style={{ fontSize:48 }}>⚠️</div>
        <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)', margin:0 }}>Something went wrong</h2>
        <p style={{ color:'var(--t3)', fontSize:14, margin:0, textAlign:'center' }}>{this.state.error.message}</p>
        <button onClick={()=>{ this.setState({error:null}); window.location.href='/dashboard'; }}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, background:'var(--p)', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:14 }}>
          <RefreshCw size={14}/> Go to Dashboard
        </button>
      </div>
    );
    return this.props.children;
  }
}

/* ── Guards ── */
function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--p)', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
        <div style={{ fontSize:13, color:'var(--t3)', fontWeight:500 }}>Loading CareerForge AI…</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, authReady } = useApp();
  if (!authReady) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function OnboardingGuard({ children }) {
  const { user, careerPath, authReady, dataReady } = useApp();
  // CRITICAL: wait for auth AND the initial data load before making any
  // redirect decision — otherwise "careerPath is null because it hasn't
  // loaded yet" looks identical to "this user has no career path", and
  // an existing user can get bounced back to onboarding on every login.
  if (!authReady) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!dataReady) return <Spinner />;
  if (!careerPath) return <Navigate to="/onboarding" replace />;
  return children;
}

/* ── Quick Note button (fixed bottom-right, above AI chat) ── */
function QuickNoteButton() {
  const { user } = useApp();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const hide = ['/auth'].includes(location.pathname);
  if (!user || hide) return null;
  return (
    <>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ position:'fixed', bottom:90, right:24, zIndex:997, width:44, height:44, borderRadius:'50%', background:'var(--surf)', border:'1.5px solid var(--border2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,.15)', transition:'all .2s' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--p3)';e.currentTarget.style.transform='scale(1.1)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.transform='scale(1)';}}
        title="Quick Note (jot a note from anywhere)">
        <FileText size={17} style={{ color:'var(--t2)' }}/>
      </button>
      {open && <QuickNote onClose={()=>setOpen(false)} />}
    </>
  );
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Navbar />
      <Routes>
          <Route path="/"            element={<LandingPage />} />
          <Route path="/auth"        element={<AuthPage />} />
          <Route path="/onboarding"  element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
          <Route path="/dashboard"   element={<OnboardingGuard><DashboardPage /></OnboardingGuard>} />
          <Route path="/interview"   element={<OnboardingGuard><InterviewPage /></OnboardingGuard>} />
          <Route path="/report"      element={<OnboardingGuard><ReportPage /></OnboardingGuard>} />
          <Route path="/learn"       element={<OnboardingGuard><LearningPage /></OnboardingGuard>} />
          <Route path="/careers"     element={<OnboardingGuard><CareerPage /></OnboardingGuard>} />
          <Route path="/skill-assessment" element={<ProtectedRoute><SkillAssessmentPage /></ProtectedRoute>} />
          <Route path="/group-discussion" element={<ProtectedRoute><GroupDiscussionPage /></ProtectedRoute>} />
          <Route path="/placement-drive" element={<OnboardingGuard><PlacementDrivePage /></OnboardingGuard>} />
          <Route path="/notes"       element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
          <Route path="/career-path" element={<ProtectedRoute><CareerPathPage /></ProtectedRoute>} />
          <Route path="/resume"      element={<ProtectedRoute><ResumeAnalyzerPage /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <AIAssistant />
      <QuickNoteButton />
      <ToastManager />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
