import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  authApi, profileApi, careerPathApi, interviewApi, badgesApi, activityApi,
  getToken, setToken, clearToken,
} from '../services/api';
import { getStoredDark, setStoredDark } from '../services/storage';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!getToken()); // no token → nothing to validate, render immediately
  const [careerPath, setCareerPath] = useState(null);
  const [profile, setProfile] = useState(null);
  const [darkMode, setDarkMode] = useState(getStoredDark);
  const [toasts, setToasts] = useState([]);
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activityLog, setActivityLog] = useState([]); // unified: interview + gd + skill assessment + drive, for streaks/heatmap
  const [dataReady, setDataReady] = useState(false); // true once profile/career-path have loaded at least once for this user

  const [config, setConfig] = useState({
    mode: 'technical', roleId: '', roleTitle: '',
    aptitudeTopic: 'dsa', aptitudeTopicLabel: 'Data Structures & Algorithms',
    difficulty: 'medium', questionCount: 5,
    resumeText: '', resumeFileName: '',
    companyId: '', companyName: '', companyTraits: '',
    timedMode: false, adaptive: true, voiceMode: false,
  });
  const [session, setSession] = useState({ questions: [], timeline: [], startedAt: null });
  const [report, setReport] = useState(null);
  const toastId = useRef(0);

  // ── Dark mode ─────────────────────────────────────────────────
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    setStoredDark(darkMode);
  }, [darkMode]);
  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

  // ── Toasts ────────────────────────────────────────────────────
  const addToast = useCallback((msg, type = 'info', duration = 4000) => {
    const id = ++toastId.current;
    setToasts(t => [...t.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  const removeToast = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

  // ── Data loaders ──────────────────────────────────────────────
  const refreshSessionHistory = useCallback(async () => {
    try { setSessionHistory((await interviewApi.listSessions()).sessions); } catch {}
  }, []);
  const refreshActivity = useCallback(async () => {
    try { setActivityLog((await activityApi.get()).activity); } catch {}
  }, []);
  const refreshBadges = useCallback(async () => {
    try { setUnlockedBadges((await badgesApi.get()).unlocked); } catch {}
  }, []);
  const loadEverything = useCallback(async () => {
    setDataReady(false);
    const [profileRes, cpRes] = await Promise.allSettled([profileApi.get(), careerPathApi.get()]);
    if (profileRes.status === 'fulfilled') setProfile(profileRes.value.profile);
    if (cpRes.status === 'fulfilled') setCareerPath(cpRes.value.careerPath);
    refreshSessionHistory();
    refreshActivity();
    refreshBadges();
    setDataReady(true);
  }, [refreshSessionHistory, refreshActivity, refreshBadges]);

  // ── Bootstrap: validate any stored token on first load ─────────
  // Only auth identity gates the initial render — profile, career
  // path, sessions and badges load progressively afterward so a
  // returning user isn't stuck on a blank spinner while four
  // network calls resolve.
  useEffect(() => {
    const token = getToken();
    if (!token) return; // authReady already true in this case
    (async () => {
      try {
        const { user: me } = await authApi.me();
        setUser(me);
      } catch {
        clearToken();
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) loadEverything();
    else setDataReady(true); // logged out → nothing to load, guards shouldn't wait
  }, [user, loadEverything]);

  // ── Auth actions ─────────────────────────────────────────────
  const login = useCallback(async ({ email, password, mode, name }) => {
    const result = mode === 'register'
      ? await authApi.register(name, email, password)
      : await authApi.login(email, password);
    setToken(result.token);
    setUser(result.user); // triggers the effect above, which loads profile/career-path/etc.
    return result.user;
  }, []);

  const loginGuest = useCallback(async () => {
    const result = await authApi.guest();
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setCareerPath(null);
    setProfile(null);
    setSessionHistory([]);
    setActivityLog([]);
    setUnlockedBadges([]);
    setSession({ questions: [], timeline: [], startedAt: null });
    setReport(null);
    setDataReady(true); // nothing left to load
  }, []);

  // ── Profile / career path ────────────────────────────────────
  const updateProfile = useCallback(async data => {
    const { profile: updated } = await profileApi.update(data);
    setProfile(updated);
    return updated;
  }, []);

  const generateCareerPath = useCallback(async payload => {
    const { careerPath: cp } = await careerPathApi.generate(payload);
    setCareerPath(cp);
    return cp;
  }, []);

  const updateReadiness = useCallback(async delta => {
    try {
      const { readinessPercent } = await careerPathApi.adjustReadiness(delta);
      setCareerPath(prev => (prev ? { ...prev, readinessPercent } : prev));
    } catch {}
  }, []);

  // ── Active interview flow (ephemeral until submitted) ───────
  const updateConfig = useCallback(upd => setConfig(p => ({ ...p, ...upd })), []);

  const startSession = useCallback((questions) => {
    setSession({ questions, timeline: [], startedAt: new Date().toISOString() });
    setReport(null);
  }, []);

  const appendQuestion = useCallback(q => {
    setSession(p => ({ ...p, questions: [...p.questions, q] }));
  }, []);

  const addAnswer = useCallback(({ question, answer, feedback, timeSpent }) => {
    setSession(p => ({ ...p, timeline: [...p.timeline, { question, answer, feedback, timeSpent: timeSpent || 0, ts: Date.now() }] }));
  }, []);

  const completeSession = useCallback(async (finalTimeline, focusStats) => {
    const tl = (finalTimeline || session.timeline).map(t => ({
      question: t.question, answer: t.answer, score: t.feedback?.score || 0,
      strengths: t.feedback?.strengths || [], improvements: t.feedback?.improvements || [],
      rubric: t.feedback?.rubric || null, timeSpent: t.timeSpent || 0,
    }));
    if (!tl.length) return null;

    const result = await interviewApi.submitSession(config, tl, focusStats || {});
    setReport(result.report);

    const avg = result.averageScore;
    if (avg >= 7) updateReadiness(2); else if (avg >= 5) updateReadiness(1); else if (avg < 4) updateReadiness(-1);

    await Promise.all([refreshSessionHistory(), refreshActivity(), refreshBadges()]);
    if (result.newBadges?.length) {
      result.newBadges.forEach(id => addToast(`🏅 Badge Unlocked: ${id.replace(/_/g, ' ')}!`, 'badge', 5000));
    }
    return result;
  }, [session.timeline, config, updateReadiness, refreshSessionHistory, refreshActivity, refreshBadges, addToast]);

  const resetSession = useCallback(() => {
    setSession({ questions: [], timeline: [], startedAt: null });
    setReport(null);
  }, []);

  const avgScore = session.timeline.length > 0
    ? (session.timeline.reduce((s, t) => s + (t.feedback?.score || 0), 0) / session.timeline.length).toFixed(1)
    : null;

  return (
    <Ctx.Provider value={{
      user, authReady, dataReady,
      careerPath, profile, darkMode, toasts, unlockedBadges, sessionHistory, activityLog,
      config, session, report, avgScore,
      login, loginGuest, logout,
      generateCareerPath, updateProfile, updateReadiness, toggleDarkMode,
      updateConfig, startSession, appendQuestion, addAnswer, completeSession, resetSession,
      refreshSessionHistory, refreshActivity, refreshBadges,
      addToast, removeToast,
    }}>
      {authReady ? children : (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--p)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
