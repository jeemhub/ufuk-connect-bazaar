const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
const easternArabicDigits = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeLatinDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicDigits.indexOf(digit)))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

export function toLatinDigits(value: number | string | null | undefined): string {
  return normalizeLatinDigits(String(value ?? ""));
}