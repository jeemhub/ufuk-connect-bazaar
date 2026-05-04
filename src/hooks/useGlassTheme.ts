import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GlassIntensity = "light" | "medium" | "strong";
export type AccentColor =
  | "blue" | "indigo" | "violet" | "rose" | "red"
  | "orange" | "amber" | "emerald" | "teal" | "cyan" | "slate";

export const ACCENT_PRESETS: Record<AccentColor, {
  label: string; labelAr: string; primary: string; primaryGlow: string; ring: string;
  sidebarBg: string; sidebarAccent: string; gradient: string;
}> = {
  blue:    { label: "Blue",    labelAr: "أزرق",    primary: "217 91% 32%", primaryGlow: "217 91% 55%", ring: "217 91% 32%", sidebarBg: "222 47% 11%", sidebarAccent: "222 40% 17%", gradient: "linear-gradient(135deg, hsl(217 91% 32%), hsl(217 91% 48%))" },
  indigo:  { label: "Indigo",  labelAr: "نيلي",    primary: "238 75% 42%", primaryGlow: "238 80% 60%", ring: "238 75% 42%", sidebarBg: "232 47% 12%", sidebarAccent: "232 40% 18%", gradient: "linear-gradient(135deg, hsl(238 75% 42%), hsl(238 80% 56%))" },
  violet:  { label: "Violet",  labelAr: "بنفسجي",  primary: "270 70% 45%", primaryGlow: "275 80% 62%", ring: "270 70% 45%", sidebarBg: "270 35% 12%", sidebarAccent: "270 30% 19%", gradient: "linear-gradient(135deg, hsl(270 70% 45%), hsl(280 75% 56%))" },
  rose:    { label: "Rose",    labelAr: "وردي",    primary: "346 80% 45%", primaryGlow: "346 85% 60%", ring: "346 80% 45%", sidebarBg: "340 35% 12%", sidebarAccent: "340 30% 19%", gradient: "linear-gradient(135deg, hsl(346 80% 45%), hsl(346 85% 58%))" },
  red:     { label: "Red",     labelAr: "أحمر",    primary: "0 78% 45%",   primaryGlow: "0 84% 60%",   ring: "0 78% 45%",   sidebarBg: "0 30% 12%",   sidebarAccent: "0 25% 19%",   gradient: "linear-gradient(135deg, hsl(0 78% 45%), hsl(0 84% 58%))" },
  orange:  { label: "Orange",  labelAr: "برتقالي", primary: "20 90% 48%",  primaryGlow: "25 95% 60%",  ring: "20 90% 48%",  sidebarBg: "20 35% 12%",  sidebarAccent: "20 30% 19%",  gradient: "linear-gradient(135deg, hsl(20 90% 48%), hsl(25 95% 58%))" },
  amber:   { label: "Amber",   labelAr: "كهرماني", primary: "38 92% 45%",  primaryGlow: "42 95% 58%",  ring: "38 92% 45%",  sidebarBg: "30 35% 12%",  sidebarAccent: "30 30% 19%",  gradient: "linear-gradient(135deg, hsl(38 92% 45%), hsl(42 95% 56%))" },
  emerald: { label: "Emerald", labelAr: "زمردي",   primary: "152 70% 35%", primaryGlow: "152 75% 48%", ring: "152 70% 35%", sidebarBg: "152 35% 10%", sidebarAccent: "152 30% 17%", gradient: "linear-gradient(135deg, hsl(152 70% 35%), hsl(152 75% 46%))" },
  teal:    { label: "Teal",    labelAr: "تركوازي", primary: "180 70% 32%", primaryGlow: "180 75% 45%", ring: "180 70% 32%", sidebarBg: "190 40% 10%", sidebarAccent: "190 35% 17%", gradient: "linear-gradient(135deg, hsl(180 70% 32%), hsl(180 75% 44%))" },
  cyan:    { label: "Cyan",    labelAr: "سماوي",   primary: "192 85% 38%", primaryGlow: "192 90% 52%", ring: "192 85% 38%", sidebarBg: "200 45% 11%", sidebarAccent: "200 40% 18%", gradient: "linear-gradient(135deg, hsl(192 85% 38%), hsl(192 90% 50%))" },
  slate:   { label: "Slate",   labelAr: "رصاصي",   primary: "215 25% 27%", primaryGlow: "215 25% 45%", ring: "215 25% 27%", sidebarBg: "215 30% 10%", sidebarAccent: "215 25% 17%", gradient: "linear-gradient(135deg, hsl(215 25% 27%), hsl(215 25% 42%))" },
};

const STORAGE_ENABLED = "lovable.glass.enabled";
const STORAGE_INTENSITY = "lovable.glass.intensity";
const STORAGE_ACCENT = "lovable.theme.accent";
const STORAGE_DARK = "lovable.theme.dark";

function readEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_ENABLED) === "1"; } catch { return false; }
}
function readIntensity(): GlassIntensity {
  try {
    const v = localStorage.getItem(STORAGE_INTENSITY) as GlassIntensity | null;
    if (v === "light" || v === "medium" || v === "strong") return v;
  } catch { /* ignore */ }
  return "medium";
}
function readAccent(): AccentColor {
  try {
    const v = localStorage.getItem(STORAGE_ACCENT) as AccentColor | null;
    if (v && v in ACCENT_PRESETS) return v;
  } catch { /* ignore */ }
  return "blue";
}
function readDark(): boolean {
  try { return localStorage.getItem(STORAGE_DARK) === "1"; } catch { return false; }
}

function applyAccentToDocument(accent: AccentColor) {
  const p = ACCENT_PRESETS[accent];
  const root = document.documentElement;
  root.style.setProperty("--primary", p.primary);
  root.style.setProperty("--primary-glow", p.primaryGlow);
  root.style.setProperty("--ring", p.ring);
  root.style.setProperty("--sidebar-background", p.sidebarBg);
  root.style.setProperty("--sidebar-primary", p.primaryGlow);
  root.style.setProperty("--sidebar-accent", p.sidebarAccent);
  root.style.setProperty("--sidebar-border", p.sidebarAccent);
  root.style.setProperty("--sidebar-ring", p.primaryGlow);
  root.style.setProperty("--accent-foreground", p.primary);
  root.style.setProperty("--gradient-brand", p.gradient);
  root.setAttribute("data-accent", accent);
}

function applyToDocument(enabled: boolean, intensity: GlassIntensity, accent: AccentColor, dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("glass", enabled);
  root.classList.remove("glass-light", "glass-medium", "glass-strong");
  if (enabled) root.classList.add(`glass-${intensity}`);
  root.classList.toggle("dark", dark);
  applyAccentToDocument(accent);
}

export function useGlassTheme() {
  const [enabled, setEnabledState] = useState<boolean>(() => readEnabled());
  const [intensity, setIntensityState] = useState<GlassIntensity>(() => readIntensity());
  const [accent, setAccentState] = useState<AccentColor>(() => readAccent());
  const [dark, setDarkState] = useState<boolean>(() => readDark());
  const remoteLoaded = useRef(false);

  useEffect(() => {
    applyToDocument(enabled, intensity, accent, dark);
  }, [enabled, intensity, accent, dark]);

  // Load from DB once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("admin_preferences")
        .select("glass_enabled, glass_intensity, accent_color, dark_mode")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      remoteLoaded.current = true;
      if (data) {
        setEnabledState(!!data.glass_enabled);
        setIntensityState((data.glass_intensity as GlassIntensity) ?? "medium");
        setAccentState((data.accent_color as AccentColor) ?? "blue");
        setDarkState(!!data.dark_mode);
        try {
          localStorage.setItem(STORAGE_ENABLED, data.glass_enabled ? "1" : "0");
          localStorage.setItem(STORAGE_INTENSITY, data.glass_intensity ?? "medium");
          localStorage.setItem(STORAGE_ACCENT, data.accent_color ?? "blue");
          localStorage.setItem(STORAGE_DARK, data.dark_mode ? "1" : "0");
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_ENABLED) setEnabledState(readEnabled());
      if (e.key === STORAGE_INTENSITY) setIntensityState(readIntensity());
      if (e.key === STORAGE_ACCENT) setAccentState(readAccent());
      if (e.key === STORAGE_DARK) setDarkState(readDark());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback(async (patch: Partial<{
    glass_enabled: boolean; glass_intensity: GlassIntensity; accent_color: AccentColor; dark_mode: boolean;
  }>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_preferences").upsert({
      user_id: user.id,
      ...patch,
    }, { onConflict: "user_id" });
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    try { localStorage.setItem(STORAGE_ENABLED, v ? "1" : "0"); } catch { /* ignore */ }
    setEnabledState(v);
    void persist({ glass_enabled: v });
  }, [persist]);

  const setIntensity = useCallback((v: GlassIntensity) => {
    try { localStorage.setItem(STORAGE_INTENSITY, v); } catch { /* ignore */ }
    setIntensityState(v);
    void persist({ glass_intensity: v });
  }, [persist]);

  const setAccent = useCallback((v: AccentColor) => {
    try { localStorage.setItem(STORAGE_ACCENT, v); } catch { /* ignore */ }
    setAccentState(v);
    void persist({ accent_color: v });
  }, [persist]);

  const setDark = useCallback((v: boolean) => {
    try { localStorage.setItem(STORAGE_DARK, v ? "1" : "0"); } catch { /* ignore */ }
    setDarkState(v);
    void persist({ dark_mode: v });
  }, [persist]);

  return { enabled, intensity, accent, dark, setEnabled, setIntensity, setAccent, setDark };
}

/**
 * Mounts saved preferences as early as possible (before AdminLayout renders).
 */
export function useApplyGlassThemeOnMount() {
  useEffect(() => {
    applyToDocument(readEnabled(), readIntensity(), readAccent(), readDark());
  }, []);
}
