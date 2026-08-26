import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { RESUME_PDF } from '../lib/constants.js';

const ResumeContext = createContext(null);

const isMobileUA =
  typeof navigator !== 'undefined' &&
  /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export function ResumeProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useRef(null);

  const openResume = useCallback(() => {
    if (isMobileUA) {
      window.open(RESUME_PDF, '_blank');
      return;
    }
    returnFocusRef.current = document.activeElement;
    setIsOpen(true);
  }, []);

  const closeResume = useCallback(() => {
    setIsOpen(false);
    const el = returnFocusRef.current;
    if (el && typeof el.focus === 'function') el.focus();
    returnFocusRef.current = null;
  }, []);

  const value = useMemo(() => ({ isOpen, openResume, closeResume }), [isOpen, openResume, closeResume]);

  return <ResumeContext.Provider value={value}>{children}</ResumeContext.Provider>;
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within ResumeProvider');
  return ctx;
}
