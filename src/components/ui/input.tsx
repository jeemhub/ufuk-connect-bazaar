import * as React from "react";

import { normalizeLatinDigits } from "@/lib/digits";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onWheel, onChange, value, defaultValue, inputMode, pattern, style, ...props }, ref) => {
    const isNumber = type === "number";
    const shouldNormalize = type !== "file";
    const normalizedValue = shouldNormalize && typeof value === "string" ? normalizeLatinDigits(value) : value;
    const normalizedDefaultValue =
      shouldNormalize && typeof defaultValue === "string" ? normalizeLatinDigits(defaultValue) : defaultValue;

    return (
      <input
        type={isNumber ? "text" : type}
        lang="en"
        dir={isNumber ? "ltr" : undefined}
        inputMode={isNumber ? inputMode ?? "decimal" : inputMode}
        pattern={isNumber ? pattern ?? "[0-9]*[.,]?[0-9]*" : pattern}
        value={normalizedValue}
        defaultValue={normalizedDefaultValue}
        style={{
          ...style,
          fontVariantNumeric: "lining-nums tabular-nums",
          fontFeatureSettings: '"lnum"',
          fontLanguageOverride: "ENG",
        }}
        onChange={(e) => {
          if (shouldNormalize) {
            const normalized = normalizeLatinDigits(e.currentTarget.value);
            if (normalized !== e.currentTarget.value) e.currentTarget.value = normalized;
          }
          onChange?.(e);
        }}
        onWheel={(e) => {
          if (isNumber) {
            (e.currentTarget as HTMLInputElement).blur();
          }
          onWheel?.(e);
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isNumber &&
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
