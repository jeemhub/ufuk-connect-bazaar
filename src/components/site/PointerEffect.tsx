import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/** Decorative only: the system cursor and every native interaction stay available. */
export function PointerEffect() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let cleanup = () => {};
    const configure = () => {
      cleanup();
      node.dataset.visible = "false";
      if (!media.matches) return;
      let frame = 0;
      let x = 0;
      let y = 0;
      const hide = () => { node.dataset.visible = "false"; };
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") { hide(); return; }
        const target = event.target instanceof Element ? event.target : null;
        const editing = target?.closest('input, textarea, select, [contenteditable="true"], iframe');
        node.dataset.visible = editing ? "false" : "true";
        node.dataset.active = target?.closest('a, button, [role="button"], [role="tab"], summary, label, [data-cursor="interactive"]') ? "true" : "false";
        x = event.clientX;
        y = event.clientY;
        if (!frame) frame = requestAnimationFrame(() => {
          node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          frame = 0;
        });
      };
      const press = () => { node.dataset.pressed = "true"; };
      const release = () => { node.dataset.pressed = "false"; };
      const keyboard = (event: KeyboardEvent) => { if (event.key === "Tab") hide(); };
      document.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerdown", press, { passive: true });
      document.addEventListener("pointerup", release, { passive: true });
      document.documentElement.addEventListener("pointerleave", hide);
      document.addEventListener("keydown", keyboard);
      document.addEventListener("scroll", hide, { passive: true, capture: true });
      window.addEventListener("blur", hide);
      cleanup = () => {
        cancelAnimationFrame(frame);
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerdown", press);
        document.removeEventListener("pointerup", release);
        document.documentElement.removeEventListener("pointerleave", hide);
        document.removeEventListener("keydown", keyboard);
        document.removeEventListener("scroll", hide, true);
        window.removeEventListener("blur", hide);
      };
    };
    configure();
    media.addEventListener("change", configure);
    return () => { cleanup(); media.removeEventListener("change", configure); };
  }, []);

  return createPortal(<div ref={ref} className="ufuk-pointer" aria-hidden="true" data-visible="false"><span /></div>, document.body);
}
