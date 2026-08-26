import { useEffect, useRef, useState } from 'react';
import { useResume } from '../../context/ResumeContext.jsx';
import { useScroll } from '../../context/ScrollContext.jsx';
import { RESUME_PDF } from '../../lib/constants.js';
import './ResumeModal.css';

export default function ResumeModal() {
  const { isOpen, closeResume } = useResume();
  const { lockScroll } = useScroll();
  const panelRef = useRef(null);
  const [hasLoadedPdf, setHasLoadedPdf] = useState(false);

  useEffect(() => {
    if (isOpen) setHasLoadedPdf(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    lockScroll(true);
    const t = setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      clearTimeout(t);
      lockScroll(false);
    };
  }, [isOpen, lockScroll]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') closeResume();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeResume]);

  return (
    <div
      className={`resume-modal${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Resume"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeResume();
      }}
    >
      <div className="resume-modal__panel" tabIndex={-1} ref={panelRef}>
        <div className="resume-modal__header">
          <div className="resume-modal__heading">
            <span className="resume-modal__eyebrow">Resume</span>
            <h3>Yakir Shlomo</h3>
          </div>
          <div className="resume-modal__actions">
            <a href={RESUME_PDF} download className="resume-modal__download" aria-label="Download resume PDF">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v8m0 0 3-3m-3 3L5 7M2.5 12v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Download</span>
            </a>
            <button className="resume-modal__close" onClick={closeResume} aria-label="Close resume">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="resume-modal__viewport">
          {hasLoadedPdf && (
            <object data={RESUME_PDF} type="application/pdf" aria-label="Yakir Shlomo resume">
              <a href={RESUME_PDF} download>
                Download resume (PDF)
              </a>
            </object>
          )}
        </div>
      </div>
    </div>
  );
}
