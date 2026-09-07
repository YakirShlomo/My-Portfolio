import { useEffect, useRef, useState } from 'react';
import { useResume } from '../../context/ResumeContext.jsx';
import { useScroll } from '../../context/ScrollContext.jsx';
import { RESUME_PDF, RESUME_PREVIEW } from '../../lib/constants.js';
import './ResumeModal.css';

export default function ResumeModal() {
  const { isOpen, closeResume } = useResume();
  const { lockScroll } = useScroll();
  const panelRef = useRef(null);
  const [hasLoadedPdf, setHasLoadedPdf] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

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
          {/* Desktop: native PDF embed. Mobile browsers' inline PDF plugins
              don't reliably respect fit-to-width — they can render at fixed
              zoom and clip the page horizontally — so mobile gets its own
              path below instead of a broken embed. */}
          <div className="resume-modal__desktop-preview">
            {hasLoadedPdf && (
              <object data={RESUME_PDF} type="application/pdf" aria-label="Yakir Shlomo resume">
                <div className="resume-modal__fallback">
                  <p>Preview isn&rsquo;t available in this browser.</p>
                  <a href={RESUME_PDF} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
                    Open PDF
                  </a>
                </div>
              </object>
            )}
          </div>

          <div className="resume-modal__mobile-preview">
            <div className="resume-modal__mobile-scroll">
              {previewFailed ? (
                <div className="resume-modal__fallback">
                  <svg width="34" height="34" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 1.5h6l3 3v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M6 8.5h5M6 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <p>
                    A preview image isn&rsquo;t available. Open or download the PDF directly for the full resume.
                  </p>
                </div>
              ) : (
                <img
                  src={RESUME_PREVIEW}
                  alt="Preview of Yakir Shlomo's resume, page 1 of 1"
                  className="resume-modal__mobile-image"
                  onError={() => setPreviewFailed(true)}
                />
              )}
            </div>
            <div className="resume-modal__mobile-actions">
              <a href={RESUME_PDF} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
                Open PDF
              </a>
              <a href={RESUME_PDF} download className="btn btn--ghost">
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
