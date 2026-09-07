import { useEffect, useRef, useState } from 'react';
import { useScroll } from '../../context/ScrollContext.jsx';
import Icon from '../../components/icons/Icon.jsx';

const LINK_OPTIONS = [
  { id: 'gmail', label: 'Gmail', hint: 'Opens a Gmail compose tab, ready to send' },
  { id: 'outlook', label: 'Outlook', hint: 'Opens an Outlook web compose tab, ready to send' },
];

const COPY_RESET_MS = 2200;

/**
 * A small choice sheet shown after the contact form validates successfully.
 * Gmail/Outlook are pre-built links (see Contact.jsx's buildSendLinks) —
 * this component only renders their static labels/hints and forwards the
 * chosen id, it never touches the message content for those two. "Copy
 * message" is handled entirely locally: it writes the plain-text
 * `copyText` prop to the clipboard (never rendered as HTML anywhere), with
 * an inline success state and a manual-select fallback if the Clipboard
 * API is unavailable or denied.
 */
export default function ContactSendModal({ isOpen, onClose, onChoose, copyText }) {
  const { lockScroll } = useScroll();
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const fallbackRef = useRef(null);
  const copyResetTimerRef = useRef(null);

  const [copyState, setCopyState] = useState('idle'); // idle -> copied | fallback

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

  // A stale "Copied"/fallback state shouldn't linger into the next time
  // the picker opens for a new submission.
  useEffect(() => {
    if (!isOpen) {
      setCopyState('idle');
      clearTimeout(copyResetTimerRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => clearTimeout(copyResetTimerRef.current);
  }, []);

  useEffect(() => {
    if (copyState === 'fallback' && fallbackRef.current) {
      fallbackRef.current.focus();
      fallbackRef.current.select();
    }
  }, [copyState]);

  async function handleCopy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(copyText);
      setCopyState('copied');
      clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => setCopyState('idle'), COPY_RESET_MS);
    } catch {
      setCopyState('fallback');
    }
  }

  return (
    <div
      className={`send-modal${isOpen ? ' is-open' : ''}`}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Choose how to send your message"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="send-modal__panel" tabIndex={-1} ref={panelRef}>
        <div className="send-modal__header">
          <div className="send-modal__heading">
            <span className="send-modal__eyebrow">Send message</span>
            <h3>Choose where to open it</h3>
          </div>
          <button className="send-modal__close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>

        <p className="send-modal__hint">
          Your message is filled in and ready — pick where to open it, then press Send there.
        </p>

        <div className="send-modal__options">
          {LINK_OPTIONS.map((opt) => (
            <button key={opt.id} type="button" className="send-modal__option" onClick={() => onChoose(opt.id)}>
              <span className="send-modal__option-icon">
                <Icon name="envelope" size={16} />
              </span>
              <span className="send-modal__option-body">
                <span className="send-modal__option-label">{opt.label}</span>
                <span className="send-modal__option-hint">{opt.hint}</span>
              </span>
              <span className="send-modal__option-arrow">
                <Icon name="arrowUpRight" size={13} />
              </span>
            </button>
          ))}

          <button
            type="button"
            className={`send-modal__option${copyState === 'copied' ? ' is-copied' : ''}`}
            onClick={handleCopy}
          >
            <span className="send-modal__option-icon">
              <Icon name={copyState === 'copied' ? 'check' : 'copy'} size={16} />
            </span>
            <span className="send-modal__option-body">
              <span className="send-modal__option-label" aria-live="polite">
                {copyState === 'copied' ? 'Copied' : 'Copy message'}
              </span>
              <span className="send-modal__option-hint">
                {copyState === 'copied'
                  ? 'Ready to paste anywhere'
                  : 'Copies the recipient, name, subject and message to your clipboard'}
              </span>
            </span>
          </button>
        </div>

        {copyState === 'fallback' && (
          <div className="send-modal__fallback">
            <p className="send-modal__fallback-hint" role="status">
              Automatic copy isn&rsquo;t available here — select the text below and copy it manually
              (Ctrl/Cmd+C).
            </p>
            <textarea
              ref={fallbackRef}
              className="send-modal__fallback-text"
              readOnly
              value={copyText}
              onFocus={(e) => e.target.select()}
              aria-label="Message text to copy manually"
            />
          </div>
        )}
      </div>
    </div>
  );
}
