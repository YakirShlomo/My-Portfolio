import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocusRef = useRef(null);

  const openResume = useCallback(() => {
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
