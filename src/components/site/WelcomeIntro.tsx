import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { markWelcomeSeen } from "@/lib/welcome";
import logo from "@/assets/logo.png";
import "./welcome-intro.css";

export function WelcomeIntro({ onComplete }: { onComplete: () => void }) {
  const { lang } = useLanguage();
  const [leaving, setLeaving] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    markWelcomeSeen();
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus({ preventScroll: true });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const exitForReducedMotion = () => { if (media.matches) onComplete(); };
    media.addEventListener("change", exitForReducedMotion);
    const revealTimer = window.setTimeout(() => setLeaving(true), 1600);
    // Completion doesn't depend on CSS animation events or network requests.
    const finishTimer = window.setTimeout(onComplete, 2150);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(finishTimer);
      media.removeEventListener("change", exitForReducedMotion);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onComplete]);

  return (
    <div className={`ufuk-welcome ${leaving ? "ufuk-welcome-leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="welcome-title" onKeyDown={(event) => {
      if (event.key === "Escape") onComplete();
      if (event.key === "Tab") { event.preventDefault(); skipRef.current?.focus(); }
    }}>
      <div className="ufuk-welcome-horizon" aria-hidden="true" />
      <div className="ufuk-welcome-content">
        <div className="ufuk-welcome-emblem">
          <span className="ufuk-welcome-orbit" aria-hidden="true" />
          <div className="ufuk-welcome-logo"><img src={logo} width={100} height={100} alt="" /></div>
        </div>
        <p className="ufuk-welcome-kicker">{lang === "ar" ? "أهلاً بك في" : "WELCOME TO"}</p>
        <h2 id="welcome-title">{lang === "ar" ? "أُفُق البصرة" : "UFUK AL-Basra"}</h2>
        <p className="ufuk-welcome-tagline">{lang === "ar" ? "نربط اليوم. ونضيء الغد." : "Connecting today. Powering tomorrow."}</p>
        <div className="ufuk-welcome-line" aria-hidden="true"><span /></div>
        <p className="ufuk-welcome-fields">{lang === "ar" ? "تقنية المعلومات  ·  الشبكات  ·  الطاقة" : "IT  ·  NETWORKING  ·  ENERGY"}</p>
      </div>
      <button ref={skipRef} onClick={onComplete} type="button" className="ufuk-welcome-skip">{lang === "ar" ? "الدخول إلى الموقع" : "Enter website"}<Arrow size={16} aria-hidden="true" /></button>
      <span className="ufuk-welcome-signature" aria-hidden="true">UFUK AL-BASRA</span>
    </div>
  );
}
