import * as React from "react";

import { normalizeLatinDigits } from "@/lib/digits";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, onChange, value, defaultValue, style, ...props }, ref) => {
  const normalizedValue = typeof value === "string" ? normalizeLatinDigits(value) : value;
  const normalizedDefaultValue = typeof defaultValue === "string" ? normalizeLatinDigits(defaultValue) : defaultValue;

  return (
    <textarea
      lang="en"
      value={normalizedValue}
      defaultValue={normalizedDefaultValue}
      style={{
        ...style,
        fontVariantNumeric: "lining-nums tabular-nums",
        fontFeatureSettings: '"lnum"',
        fontLanguageOverride: "ENG",
      }}
      onChange={(e) => {
        const normalized = normalizeLatinDigits(e.currentTarget.value);
        if (normalized !== e.currentTarget.value) e.currentTarget.value = normalized;
        onChange?.(e);
      }}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
