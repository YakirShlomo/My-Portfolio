import { useCallback, useEffect, useRef, useState } from 'react';
import { useScroll } from '../../context/ScrollContext.jsx';
import { useIsTouch } from '../../hooks/useReducedMotion.js';
import Icon from '../icons/Icon.jsx';
import './EntryGate.css';

const STEPS = [
  { key: 'align', label: 'Align the node', hint: 'Drag the glowing node into the core' },
  { key: 'charge', label: 'Charge the core', hint: 'Press and hold for one second' },
  { key: 'enter', label: 'Enter portfolio', hint: 'You’re in — go ahead' },
];

const HOLD_MS = 1000;

function clampNum(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function EntryGate({ onUnlock }) {
  const { lockScroll, reducedMotion } = useScroll();
  const isTouch = useIsTouch();

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState('active'); // active -> unlocking -> hidden
  const [flashActive, setFlashActive] = useState(false);

  const [aligned, setAligned] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [charging, setCharging] = useState(false);

  const stageRef = useRef(null);
  const nodeRef = useRef(null);
  const targetRef = useRef(null);
  const holdRef = useRef(null);
  const enterRef = useRef(null);

  const dragStateRef = useRef({ startClientX: 0, startClientY: 0, startOffset: { x: 0, y: 0 } });
  const holdTimeoutRef = useRef(null);
  const advanceTimeoutRef = useRef(null);

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isTouch || phase !== 'active') return undefined;
    const targets = [nodeRef, holdRef, enterRef];
    const t = setTimeout(() => targets[stepIndex]?.current?.focus(), 380);
    return () => clearTimeout(t);
  }, [stepIndex, isTouch, phase]);

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const finishAlign = useCallback(() => {
    setAligned((prev) => {
      if (prev) return prev;
      setDragging(false);
      clearAdvanceTimeout();
      advanceTimeoutRef.current = setTimeout(() => setStepIndex(1), reducedMotion ? 0 : 380);
      return true;
    });
  }, [clearAdvanceTimeout, reducedMotion]);

  const snapNodeToCenter = useCallback(() => {
    const node = nodeRef.current;
    const target = targetRef.current;
    if (node && target) {
      const n = node.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      setDragOffset((prev) => ({
        x: prev.x + (t.left + t.width / 2) - (n.left + n.width / 2),
        y: prev.y + (t.top + t.height / 2) - (n.top + n.height / 2),
      }));
    }
    finishAlign();
  }, [finishAlign]);

  function onNodePointerDown(e) {
    if (stepIndex !== 0 || aligned) return;
    e.preventDefault();
    nodeRef.current?.setPointerCapture?.(e.pointerId);
    dragStateRef.current = { startClientX: e.clientX, startClientY: e.clientY, startOffset: dragOffset };
    setDragging(true);
  }

  function onNodePointerMove(e) {
    if (!dragging) return;
    const { startClientX, startClientY, startOffset } = dragStateRef.current;
    const stage = stageRef.current?.getBoundingClientRect();
    const maxOffset = stage ? stage.width * 0.42 : 100;
    const nx = clampNum(startOffset.x + (e.clientX - startClientX), -maxOffset, maxOffset);
    const ny = clampNum(startOffset.y + (e.clientY - startClientY), -maxOffset, maxOffset);
    setDragOffset({ x: nx, y: ny });
  }

  function onNodePointerUp() {
    if (!dragging) return;
    setDragging(false);
    const node = nodeRef.current;
    const target = targetRef.current;
    if (!node || !target) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }
    const n = node.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const ncx = n.left + n.width / 2;
    const ncy = n.top + n.height / 2;
    const tcx = t.left + t.width / 2;
    const tcy = t.top + t.height / 2;
    const dist = Math.hypot(ncx - tcx, ncy - tcy);
    const threshold = Math.max(t.width, t.height) * 0.6;
    if (dist <= threshold) {
      setDragOffset((prev) => ({ x: prev.x + (tcx - ncx), y: prev.y + (tcy - ncy) }));
      finishAlign();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  }

  function onNodeKeyDown(e) {
    if (stepIndex !== 0 || aligned) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      snapNodeToCenter();
    }
  }

  function startHold() {
    if (stepIndex !== 1 || charging) return;
    setCharging(true);
    holdTimeoutRef.current = setTimeout(() => {
      holdTimeoutRef.current = null;
      setCharging(false);
      clearAdvanceTimeout();
      advanceTimeoutRef.current = setTimeout(() => setStepIndex(2), reducedMotion ? 0 : 260);
    }, HOLD_MS);
  }

  function cancelHold() {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    setCharging(false);
  }

  function onHoldKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      startHold();
    }
  }
  function onHoldKeyUp(e) {
    if (e.key === 'Enter' || e.key === ' ') cancelHold();
  }

  function handleEnter() {
    if (phase !== 'active') return;
    setPhase('unlocking');
    setFlashActive(true);
    lockScroll(false);
    window.scrollTo(0, 0);
    onUnlock?.();
    setTimeout(() => setPhase('hidden'), reducedMotion ? 60 : 640);
  }

  if (phase === 'hidden') return null;

  return (
    <>
      <div
        className={`gate3${phase === 'unlocking' ? ' is-unlocking' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Unlock the portfolio"
      >
        <div className="gate3__glow" aria-hidden="true" />
        <div className="gate3__inner">
          <span className="gate3__mark" aria-hidden="true">
            YS
          </span>
          <p className="gate3__kicker">System access</p>
          <h1 className="gate3__title">Initialize Yakir Shlomo Portfolio</h1>
          <p className="sr-only" aria-live="polite">
            Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex].label}
          </p>

          <div className="gate3__checklist">
            {STEPS.map((step, i) => {
              const status = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending';
              return (
                <div key={step.key} className={`gate3__step is-${status}`}>
                  <span className="gate3__step-num" aria-hidden="true">
                    {status === 'done' ? <Icon name="check" size={13} /> : i + 1}
                  </span>
                  <div className="gate3__step-body">
                    <span className="gate3__step-label">{step.label}</span>
                    {status === 'active' && <span className="gate3__step-hint">{step.hint}</span>}
                  </div>

                  {status === 'active' && step.key === 'align' && (
                    <div className="gate3__control gate3__control--align">
                      <div className="gate3__stage" ref={stageRef}>
                        <div className="gate3__target" ref={targetRef} aria-hidden="true" />
                        <div className={`gate3__node-wrap${aligned ? ' is-aligned' : ''}`}>
                          <div
                            ref={nodeRef}
                            role="button"
                            tabIndex={0}
                            className={`gate3__node${dragging ? ' is-dragging' : ''}`}
                            style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
                            onPointerDown={onNodePointerDown}
                            onPointerMove={onNodePointerMove}
                            onPointerUp={onNodePointerUp}
                            onPointerCancel={onNodePointerUp}
                            onKeyDown={onNodeKeyDown}
                            aria-label="Drag the glowing node into the core, or press Enter to place it"
                          />
                        </div>
                      </div>
                      <button type="button" className="gate3__alt" onClick={snapNodeToCenter}>
                        Can’t drag? Snap it in place
                      </button>
                    </div>
                  )}

                  {status === 'active' && step.key === 'charge' && (
                    <div className="gate3__control gate3__control--charge">
                      <button
                        ref={holdRef}
                        type="button"
                        className={`gate3__hold${charging ? ' is-charging' : ''}`}
                        onPointerDown={startHold}
                        onPointerUp={cancelHold}
                        onPointerLeave={cancelHold}
                        onPointerCancel={cancelHold}
                        onKeyDown={onHoldKeyDown}
                        onKeyUp={onHoldKeyUp}
                        aria-label="Press and hold for one second to charge the core"
                      >
                        <svg className="gate3__ring" viewBox="0 0 64 64" aria-hidden="true">
                          <circle className="gate3__ring-track" cx="32" cy="32" r="27" />
                          <circle className="gate3__ring-fill" cx="32" cy="32" r="27" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {status === 'active' && step.key === 'enter' && (
                    <div className="gate3__control gate3__control--enter">
                      <button
                        ref={enterRef}
                        type="button"
                        className="btn btn--primary gate3__enter"
                        onClick={handleEnter}
                      >
                        <span className="btn__label">Enter portfolio</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className={`gate3__flash${flashActive ? ' is-active' : ''}`} aria-hidden="true" />
    </>
  );
}
