import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeIntro } from "./WelcomeIntro";

vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ lang: "ar" }) }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); sessionStorage.clear(); });

describe("welcome entrance", () => {
  it("finishes without waiting for images or CSS events and restores scrolling", () => {
    const complete = vi.fn();
    document.body.style.overflow = "auto";
    const { unmount } = render(<WelcomeIntro onComplete={complete} />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "الدخول إلى الموقع" })).toHaveFocus();
    act(() => vi.advanceTimersByTime(1600));
    expect(screen.getByRole("dialog")).toHaveClass("ufuk-welcome-leaving");
    expect(complete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(550));
    expect(complete).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("allows immediate skip and cancels pending completion on unmount", () => {
    const complete = vi.fn();
    const { unmount } = render(<WelcomeIntro onComplete={complete} />);
    fireEvent.click(screen.getByRole("button", { name: "الدخول إلى الموقع" }));
    expect(complete).toHaveBeenCalledTimes(1);
    unmount();
    act(() => vi.runAllTimers());
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("supports Escape dismissal", () => {
    const complete = vi.fn();
    render(<WelcomeIntro onComplete={complete} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("skips repeat sessions and reduced-motion visitors", async () => {
    vi.resetModules();
    const { shouldShowWelcome, WELCOME_SESSION_KEY } = await import("@/lib/welcome");
    expect(shouldShowWelcome()).toBe(true);
    sessionStorage.setItem(WELCOME_SESSION_KEY, "seen");
    expect(shouldShowWelcome()).toBe(false);
    sessionStorage.clear();
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    expect(shouldShowWelcome()).toBe(false);
  });
});
