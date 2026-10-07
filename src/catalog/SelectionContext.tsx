import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface Selection { compare: string[]; quote: Record<string, number> }
interface SelectionValue extends Selection {
  toggleCompare: (id: string) => void; setQuoteQty: (id: string, qty: number) => void; clearQuote: () => void;
}
const Context = createContext<SelectionValue | null>(null);
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<Selection>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("ufuk-selections-v1") || "{}");
      return { compare: Array.isArray(parsed.compare) ? parsed.compare.filter((id: unknown) => typeof id === "string").slice(0, 3) : [],
        quote: Object.fromEntries(Object.entries(parsed.quote || {}).filter(([id, qty]) => id && Number.isInteger(qty) && Number(qty) > 0 && Number(qty) <= 999)) } as Selection;
    } catch { return { compare: [], quote: {} }; }
  });
  useEffect(() => { try { localStorage.setItem("ufuk-selections-v1", JSON.stringify(value)); } catch { /* private browsing */ } }, [value]);
  return <Context.Provider value={{ ...value,
    toggleCompare: id => setValue(v => ({ ...v, compare: v.compare.includes(id) ? v.compare.filter(x => x !== id) : v.compare.length < 3 ? [...v.compare, id] : v.compare })),
    setQuoteQty: (id, qty) => setValue(v => { const quote = { ...v.quote }; if (qty <= 0) delete quote[id]; else if (Number.isFinite(qty)) quote[id] = Math.min(999, Math.max(1, Math.floor(qty))); return { ...v, quote }; }),
    clearQuote: () => setValue(v => ({ ...v, quote: {} })),
  }}>{children}</Context.Provider>;
}
export function useSelection() { const value = useContext(Context); if (!value) throw new Error("SelectionProvider is required"); return value; }
