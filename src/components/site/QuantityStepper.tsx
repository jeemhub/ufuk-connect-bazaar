import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_MAX_QUANTITY } from "@/cart/constants";
import { useLanguage } from "@/i18n/LanguageContext";
import { normalizeLatinDigits } from "@/lib/digits";
import { cn } from "@/lib/utils";

/** Long enough that typing a multi-digit quantity costs one update, not one per keystroke. */
const COMMIT_DELAY_MS = 400;
/** Caps typing at more digits than any allowed quantity; the excess is clamped on commit. */
const MAX_INPUT_DIGITS = 6;

interface Props {
  quantity: number;
  /** Available stock. Falls back to a sane ceiling for products with no stock figure. */
  max?: number;
  onChange: (quantity: number) => void;
  className?: string;
}

export function QuantityStepper({ quantity, max, onChange, className }: Props) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const limit = Math.max(1, max ?? DEFAULT_MAX_QUANTITY);

  const [draft, setDraft] = useState(String(quantity));
  const inputRef = useRef<HTMLInputElement>(null);
  const commitTimer = useRef<number>();
  const isFocused = useRef(false);

  // Mirror +/- presses and any outside change, but never overwrite what is
  // being typed right now.
  useEffect(() => {
    if (!isFocused.current) setDraft(String(quantity));
  }, [quantity]);

  useEffect(() => () => window.clearTimeout(commitTimer.current), []);

  const digitsOf = (raw: string) => normalizeLatinDigits(raw).replace(/\D/g, "");

  /** The number the control currently shows, falling back to the committed quantity. */
  const displayed = useCallback(() => {
    const parsed = Number.parseInt(digitsOf(draft), 10);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, limit) : quantity;
  }, [draft, limit, quantity]);

  const commit = useCallback(
    (raw: string) => {
      window.clearTimeout(commitTimer.current);
      const parsed = Number.parseInt(digitsOf(raw), 10);

      // Empty, zero or unparseable: keep the last quantity that was valid.
      if (!Number.isFinite(parsed) || parsed < 1) {
        setDraft(String(quantity));
        return;
      }
      const next = Math.min(parsed, limit);
      if (parsed > limit) {
        toast.warning(
          ar ? `المتوفر من هذا المنتج ${limit} فقط` : `Only ${limit} of this product available`,
        );
      }
      setDraft(String(next));
      if (next !== quantity) onChange(next);
    },
    [ar, limit, onChange, quantity],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = digitsOf(event.target.value).slice(0, MAX_INPUT_DIGITS);
    setDraft(digits);
    window.clearTimeout(commitTimer.current);

    // Only values needing no correction are applied while typing; anything out of
    // range waits for Enter or blur so the field isn't rewritten mid-entry.
    const parsed = Number.parseInt(digits, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= limit && parsed !== quantity) {
      commitTimer.current = window.setTimeout(() => onChange(parsed), COMMIT_DELAY_MS);
    }
  };

  // Enter commits by blurring rather than committing directly, so the value is
  // applied once instead of once here and again from the blur that follows.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inputRef.current?.blur();
    }
  };

  const step = (delta: number) => {
    window.clearTimeout(commitTimer.current);
    const next = Math.min(limit, Math.max(1, displayed() + delta));
    setDraft(String(next));
    if (next !== quantity) onChange(next);
  };

  const current = displayed();

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border transition-colors",
        "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={current <= 1}
        aria-label={ar ? "إنقاص الكمية" : "Decrease quantity"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        dir="ltr"
        lang="en"
        autoComplete="off"
        enterKeyHint="done"
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          isFocused.current = true;
          event.currentTarget.select();
        }}
        onBlur={(event) => {
          isFocused.current = false;
          commit(event.currentTarget.value);
        }}
        aria-label={ar ? "الكمية" : "Quantity"}
        className="w-12 shrink-0 border-0 bg-transparent p-0 text-center text-sm font-bold tabular-nums text-foreground outline-none focus:outline-none focus-visible:outline-none"
      />

      <button
        type="button"
        onClick={() => step(1)}
        disabled={current >= limit}
        aria-label={ar ? "زيادة الكمية" : "Increase quantity"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
