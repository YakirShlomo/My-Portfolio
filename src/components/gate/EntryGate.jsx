import { useEffect, useRef, useState } from 'react';
import { useScroll } from '../../context/ScrollContext.jsx';
import { useIsTouch } from '../../hooks/useReducedMotion.js';
import Icon from '../icons/Icon.jsx';
import './EntryGate.css';

const SUGGESTED_PROMPT = 'Generate portfolio';
// The prompt is cosmetic only — it's never sent, rendered as HTML, or used
// to build a URL — but it still gets a sensible cap so a pasted wall of
// text can't stretch the pill input or look absurd mid-edit.
const PROMPT_MAX_LEN = 120;

export default function EntryGate({ onUnlock }) {
  const { lockScroll, reducedMotion } = useScroll();
  const isTouch = useIsTouch();

  // active (prompt bar) -> responding (AI "typing") -> unlocking (reveal
  // transition) -> hidden (unmounted). One action — submit the prompt —
  // moves the whole thing forward; there's no multi-step flow to track.
  const [phase, setPhase] = useState('active');
  const [prompt, setPrompt] = useState(SUGGESTED_PROMPT);

  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const responseTimerRef = useRef(null);
  const unlockTimerRef = useRef(null);

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(responseTimerRef.current);
      clearTimeout(unlockTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Autofocus is skipped on touch devices — popping the virtual keyboard
    // the instant the page loads is more intrusive than helpful there, and
    // tapping the prefilled prompt or the send button needs no keyboard.
    if (isTouch) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [isTouch]);

  function handleSubmit(e) {
    e.preventDefault();
    if (phase !== 'active') return;
    setPhase('responding');
    dialogRef.current?.focus();

    responseTimerRef.current = setTimeout(
      () => {
        setPhase('unlocking');
        lockScroll(false);
        window.scrollTo(0, 0);
        onUnlock?.();
        unlockTimerRef.current = setTimeout(() => setPhase('hidden'), reducedMotion ? 60 : 560);
      },
      reducedMotion ? 300 : 750
    );
  }

  if (phase === 'hidden') return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className={`ai-gate${phase === 'unlocking' ? ' is-unlocking' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Unlock the portfolio"
    >
      <div className="ai-gate__glow" aria-hidden="true" />
      <div className="ai-gate__inner">
        <span className="ai-gate__badge" aria-hidden="true">
          <Icon name="sparkle" size={18} />
        </span>
        <p className="ai-gate__kicker">AI Assistant</p>
        <h1 className="ai-gate__title">Ask AI to open Yakir&rsquo;s portfolio</h1>

        {phase === 'active' && (
          <>
            <form className="ai-gate__bar" onSubmit={handleSubmit}>
              <span className="ai-gate__bar-icon" aria-hidden="true">
                <Icon name="sparkle" size={14} />
              </span>
              <input
                ref={inputRef}
                type="text"
                className="ai-gate__input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={SUGGESTED_PROMPT}
                aria-label="Prompt to open the portfolio"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
                enterKeyHint="send"
                maxLength={PROMPT_MAX_LEN}
              />
              <button type="submit" className="ai-gate__send" aria-label="Send prompt">
                <Icon name="paperPlane" size={15} />
              </button>
            </form>
            <p className="ai-gate__hint">Press Enter or tap send to continue</p>
          </>
        )}

        {phase !== 'active' && (
          <div className="ai-gate__response" role="status" aria-live="polite">
            {!reducedMotion && (
              <span className="ai-gate__dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            )}
            <span className="ai-gate__response-text">Generating portfolio experience&hellip;</span>
          </div>
        )}
      </div>
    </div>
  );
}
