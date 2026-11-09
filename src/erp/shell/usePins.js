import { useSyncExternalStore } from "react";

// Pinned screens + recently visited screens, kept in localStorage and shared
// across components through a tiny subscribe/notify store.
const PIN_KEY = "erp-pins";
const REC_KEY = "erp-recents";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
let state = { pins: read(PIN_KEY), recents: read(REC_KEY) };
const subs = new Set();
const emit = () => subs.forEach((f) => f());
const save = () => {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(state.pins)); localStorage.setItem(REC_KEY, JSON.stringify(state.recents)); } catch { /* ignore */ }
};

export const togglePin = (entry) => {
  const exists = state.pins.some((p) => p.to === entry.to);
  state = { ...state, pins: exists ? state.pins.filter((p) => p.to !== entry.to) : [...state.pins, entry].slice(-8) };
  save(); emit();
};
export const trackVisit = (entry) => {
  if (state.recents[0]?.to === entry.to) return;
  state = { ...state, recents: [entry, ...state.recents.filter((r) => r.to !== entry.to)].slice(0, 6) };
  save(); emit();
};
export const usePins = () =>
  useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb); }, () => state);
