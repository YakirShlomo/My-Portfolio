import { useEffect, useRef } from 'react';
import { useScroll } from '../../context/ScrollContext.jsx';
import Icon from '../icons/Icon.jsx';
import './CertificateLightbox.css';

export default function CertificateLightbox({ certificate, onClose }) {
  const { lockScroll } = useScroll();
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const isOpen = !!certificate;

  useEffect(() => {
    if (!isOpen) return undefined;
    returnFocusRef.current = document.activeElement;
    lockScroll(true);
    const t = setTimeout(() => panelRef.current?.focus(), 50);
    return () => {
      clearTimeout(t);
      lockScroll(false);
      const el = returnFocusRef.current;
      if (el && typeof el.focus === 'function') el.focus();
    };
  }, [isOpen, lockScroll]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <div
      className={`cert-lightbox${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label={certificate?.title || 'Certificate'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {certificate && (
        <div className="cert-lightbox__panel" tabIndex={-1} ref={panelRef}>
          <button className="cert-lightbox__close" onClick={onClose} aria-label="Close certificate">
            <Icon name="close" />
          </button>
          <img src={certificate.image} alt={certificate.title} className="cert-lightbox__image" />
          <div className="cert-lightbox__caption">
            <h3>{certificate.title}</h3>
            {(certificate.issuer || certificate.date) && (
              <p>
                {certificate.issuer}
                {certificate.issuer && certificate.date ? ' · ' : ''}
                {certificate.date}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
