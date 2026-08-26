import { createContext, useContext, useState } from 'react';

/**
 * Scoped to the Home route only — the private-project page never had a gate
 * either, so this context is provided per-mount of Home, not globally.
 */
const GateContext = createContext({ unlocked: true });

export function GateProvider({ children, initiallyUnlocked = false }) {
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  return <GateContext.Provider value={{ unlocked, setUnlocked }}>{children}</GateContext.Provider>;
}

export function useGate() {
  return useContext(GateContext);
}
