import { useEffect, useState, useCallback } from "react";

export type GlassIntensity = "light" | "medium" | "strong";

const STORAGE_ENABLED = "lovable.glass.enabled";
const STORAGE_INTENSITY = "lovable.glass.intensity";

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_ENABLED) === "1";
  } catch {
    return false;
  }
}

function readIntensity(): GlassIntensity {
  try {
    const v = localStorage.getItem(STORAGE_INTENSITY) as GlassIntensity | null;
    if (v === "light" || v === "medium" || v === "strong") return v;
  } catch {
    /* ignore */
  }
  return "medium";
}

function applyToDocument(enabled: boolean, intensity: GlassIntensity) {
  const root = document.documentElement;
  root.classList.toggle("glass", enabled);
  root.classList.remove("glass-light", "glass-medium", "glass-strong");
  if (enabled) root.classList.add(`glass-${intensity}`);
}

/**
 * Liquid Glass theme controller. State is persisted per-browser
 * (per-admin) in localStorage and reflected as classes on <html>:
 *   .glass + .glass-light | .glass-medium | .glass-strong
 *
 * Components opt in by using the `glass-surface` / `glass-panel`
 * utility classes defined in index.css, which become active only
 * when `.glass` is present on the root.
 */
export function useGlassTheme() {
  const [enabled, setEnabledState] = useState<boolean>(() => readEnabled());
  const [intensity, setIntensityState] = useState<GlassIntensity>(() => readIntensity());

  useEffect(() => {
    applyToDocument(enabled, intensity);
  }, [enabled, intensity]);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_ENABLED) setEnabledState(readEnabled());
      if (e.key === STORAGE_INTENSITY) setIntensityState(readIntensity());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    try {
      localStorage.setItem(STORAGE_ENABLED, v ? "1" : "0");
    } catch {
      /* ignore */
    }
    setEnabledState(v);
  }, []);

  const setIntensity = useCallback((v: GlassIntensity) => {
    try {
      localStorage.setItem(STORAGE_INTENSITY, v);
    } catch {
      /* ignore */
    }
    setIntensityState(v);
  }, []);

  return { enabled, intensity, setEnabled, setIntensity };
}

/**
 * Mounts the saved preference as early as possible (before the
 * AdminLayout renders). Use it once near the app root.
 */
export function useApplyGlassThemeOnMount() {
  useEffect(() => {
    applyToDocument(readEnabled(), readIntensity());
  }, []);
}
