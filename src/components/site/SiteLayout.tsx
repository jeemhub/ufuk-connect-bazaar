import { SelectionBar } from "./ProductActions";
import { Outlet } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PushOnboardingDialog } from "./PushOnboardingDialog";
import { PwaInstallDialog } from "./PwaInstallDialog";
import { WelcomeIntro } from "./WelcomeIntro";
import { shouldShowWelcome } from "@/lib/welcome";

export default function SiteLayout() {
  const [welcome, setWelcome] = useState(shouldShowWelcome);
  const contentRef = useRef<HTMLDivElement>(null);
  const finishWelcome = useCallback(() => setWelcome(false), []);
  useEffect(() => {
    if (contentRef.current) contentRef.current.inert = welcome;
  }, [welcome]);
  return (
    <>
    {welcome && <WelcomeIntro onComplete={finishWelcome} />}
    <div ref={contentRef} aria-hidden={welcome || undefined} className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SelectionBar />
      <SiteFooter />
      {!welcome && <PushOnboardingDialog />}
      {!welcome && <PwaInstallDialog />}
    </div>
    </>
  );
}
