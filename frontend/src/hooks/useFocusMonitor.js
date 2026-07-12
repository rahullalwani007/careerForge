import { useState, useEffect, useRef, useCallback } from 'react';

// ================================================================
// Interview Focus & Integrity Monitor.
//
// Real remote-interview and remote-assessment platforms watch for
// exactly these three signals to gauge whether a candidate stayed
// engaged and answered in their own words. This hook reproduces
// that idea with three well-supported, permission-free browser
// APIs — no camera, no third-party service:
//
//   1. Tab switches  → Page Visibility API (document.hidden)
//   2. Pasted answers → the native `paste` event on the answer box
//   3. Idle gaps      → time since the last keystroke, sampled
//                       every 2s while a question is active
//
// The resulting focusScore is a plain, disclosed formula (not
// another AI call) — start at 100, subtract a fixed penalty per
// event, floor at 0. Being able to say exactly how a number is
// computed is worth more in a viva than a fancier black box.
// ================================================================

const IDLE_THRESHOLD_MS = 20000; // 20s with no keystroke while answering counts as one idle gap
const PENALTY = { tabSwitch: 8, paste: 10, idle: 4 };

export function useFocusMonitor(active) {
  const [tabSwitches, setTabSwitches] = useState(0);
  const [pasteEvents, setPasteEvents] = useState(0);
  const [idleEvents, setIdleEvents] = useState(0);

  const lastInputRef = useRef(Date.now());
  const idleFlagRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    function onVisibilityChange() {
      if (document.hidden) setTabSwitches(c => c + 1);
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const idleFor = Date.now() - lastInputRef.current;
      if (idleFor > IDLE_THRESHOLD_MS && !idleFlagRef.current) {
        idleFlagRef.current = true;
        setIdleEvents(c => c + 1);
      } else if (idleFor <= IDLE_THRESHOLD_MS) {
        idleFlagRef.current = false;
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [active]);

  const registerInput = useCallback(() => { lastInputRef.current = Date.now(); }, []);
  const registerPaste = useCallback(() => { setPasteEvents(c => c + 1); }, []);

  const reset = useCallback(() => {
    setTabSwitches(0); setPasteEvents(0); setIdleEvents(0);
    lastInputRef.current = Date.now();
    idleFlagRef.current = false;
  }, []);

  const focusScore = Math.max(0, 100 - tabSwitches * PENALTY.tabSwitch - pasteEvents * PENALTY.paste - idleEvents * PENALTY.idle);

  return { tabSwitches, pasteEvents, idleEvents, focusScore, registerInput, registerPaste, reset };
}
