import { useState, useEffect } from 'react';

// Most of this app's layout is written with inline `style={{}}` objects,
// which CSS media queries cannot override (inline styles always win the
// cascade). This hook gives components a reliable, JS-side way to know
// the current breakpoint so they can switch layouts themselves —
// e.g. `gridTemplateColumns: isMobile ? '1fr' : 'repeat(4,1fr)'`.
export function useBreakpoint() {
  const getState = () => {
    if (typeof window === 'undefined') return { isMobile: false, isTablet: false, width: 1280 };
    const w = window.innerWidth;
    return { isMobile: w <= 640, isTablet: w > 640 && w <= 1024, width: w };
  };

  const [state, setState] = useState(getState);

  useEffect(() => {
    let raf = null;
    function onResize() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setState(getState());
        raf = null;
      });
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return state; // { isMobile, isTablet, width }
}

export default useBreakpoint;
