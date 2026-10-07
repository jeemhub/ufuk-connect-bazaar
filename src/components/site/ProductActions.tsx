import { Link } from "react-router-dom";
import { Scale, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSelection } from "@/catalog/SelectionContext";

export function ProductActions({ id }: { id: string }) {
  const { lang } = useLanguage(); const ar = lang === "ar";
  const { compare, quote, toggleCompare, setQuoteQty } = useSelection();
  return <div className="flex flex-wrap gap-2">
    <Button size="sm" variant="outline" className="flex-1 text-xs" aria-pressed={compare.includes(id)} disabled={!compare.includes(id) && compare.length >= 3} onClick={() => toggleCompare(id)}>
      <Scale className="me-1 h-4 w-4" />{compare.includes(id) ? (ar ? "ضمن المقارنة" : "Selected") : (ar ? "قارن" : "Compare")}
    </Button>
    <Button size="sm" variant="outline" className="flex-1 text-xs" aria-pressed={!!quote[id]} onClick={() => setQuoteQty(id, quote[id] ? 0 : 1)}>
      <FilePlus2 className="me-1 h-4 w-4" />{quote[id] ? (ar ? "ضمن العرض" : "In quote") : (ar ? "أضف للعرض" : "Quote")}
    </Button>
  </div>;
}
export function SelectionBar() {
  const { lang } = useLanguage(); const ar = lang === "ar"; const { compare, quote } = useSelection();
  if (!compare.length && !Object.keys(quote).length) return null;
  return <aside aria-label={ar ? "اختيارات المنتجات" : "Product selections"} className="sticky bottom-3 z-30 mx-auto my-4 flex w-fit max-w-[calc(100%-2rem)] flex-wrap justify-center gap-2 rounded-xl border bg-background p-3 shadow-lg">
    {!!compare.length && <Button asChild size="sm"><Link to="/compare">{ar ? "المقارنة" : "Compare"} ({compare.length}/3)</Link></Button>}
    {!!Object.keys(quote).length && <Button asChild variant="outline" size="sm"><Link to="/quote">{ar ? "طلب عرض سعر" : "Request quote"} ({Object.keys(quote).length})</Link></Button>}
  </aside>;
}
