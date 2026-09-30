export const WELCOME_SESSION_KEY = "ufuk:welcome:v1";
let seenInMemory = false;

export function shouldShowWelcome() {
  if (seenInMemory || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try { return sessionStorage.getItem(WELCOME_SESSION_KEY) !== "seen"; }
  catch { return true; }
}

export function markWelcomeSeen() {
  seenInMemory = true;
  try { sessionStorage.setItem(WELCOME_SESSION_KEY, "seen"); }
  catch { /* The in-memory flag also covers browsers with storage disabled. */ }
}
