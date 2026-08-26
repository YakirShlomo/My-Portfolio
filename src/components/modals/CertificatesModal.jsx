import { useEffect, useRef } from 'react';
import { useScroll } from '../../context/ScrollContext.jsx';
import CertificatesGallery from '../certificates/CertificatesGallery.jsx';
import Icon from '../icons/Icon.jsx';
import './CertificatesModal.css';

export default function CertificatesModal({ isOpen, onClose }) {
  const { lockScroll } = useScroll();
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

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
      className={`certificates-modal${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Certificates"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="certificates-modal__panel" tabIndex={-1} ref={panelRef}>
        <div className="certificates-modal__header">
          <div className="certificates-modal__heading">
            <span className="certificates-modal__eyebrow">Certificates</span>
            <h3>Yakir Shlomo</h3>
          </div>
          <button className="certificates-modal__close" onClick={onClose} aria-label="Close certificates">
            <Icon name="close" />
          </button>
        </div>
        <div className="certificates-modal__body">
          {isOpen && (
            <CertificatesGallery
              compact
              emptyHint="No certificates yet — check back soon, or ask me directly."
            />
          )}
        </div>
      </div>
    </div>
  );
}
