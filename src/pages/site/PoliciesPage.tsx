import { Link } from "react-router-dom";
import { useCommerceSettings, safeHttps } from "@/hooks/useCommerceSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd } from "@/data/mockData";
import { Seo } from "@/components/seo/Seo";

export default function PoliciesPage() {
  const { settings } = useCommerceSettings(); const { lang } = useLanguage(); const ar = lang === "ar";
  const fallback = ar ? "تُؤكَّد التفاصيل مع فريق المبيعات قبل إتمام الطلب." : "Confirm details with sales before completing your order.";
  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
    <Seo description={ar ? "خدمات أفق البصرة للمنتجات والطلبات والتوصيل" : "UFUK products, orders and delivery services"} title={ar ? "الضمان والدفع والتوصيل | أفق البصرة" : "Warranty, payment and delivery | UFUK"} path="/policies" />
    <h1 className="text-3xl font-bold">{ar ? "الضمان والدفع والتوصيل" : "Warranty, payment and delivery"}</h1>
    {[{title:ar ? "الضمان وشروطه" : "Warranty",text:settings.warranty},{title:ar ? "طرق الدفع" : "Payment methods",text:settings.payments},{title:ar ? "مدة التوصيل" : "Delivery time",text:settings.delivery}].map(x=><section key={x.title} className="surface-card p-6"><h2 className="mb-3 text-xl font-bold">{x.title}</h2><p className="whitespace-pre-line leading-8">{x.text || fallback}</p></section>)}
    {!!settings.zones.length && <div className="overflow-x-auto"><table className="w-full text-start"><caption className="mb-3 text-start font-bold">{ar ? "مناطق التوصيل" : "Delivery areas"}</caption><thead><tr>{[ar ? "المحافظة" : "City",ar ? "التكلفة" : "Fee",ar ? "المدة" : "Time"].map(x=><th key={x} className="p-3 text-start">{x}</th>)}</tr></thead><tbody>{settings.zones.filter(z=>z.enabled).map(z=><tr key={z.city} className="border-t"><td className="p-3">{z.city}</td><td className="p-3">{z.fee === null ? fallback : `${formatIqd(z.fee)} IQD`}</td><td className="p-3">{z.duration || fallback}</td></tr>)}</tbody></table></div>}
    <section className="surface-card space-y-3 p-6"><h2 className="text-xl font-bold">{ar ? "زيارة المحل" : "Visit us"}</h2><p>{settings.address}</p><p>{settings.hours || (ar ? "للتأكد من ساعات العمل اتصل بنا." : "Call to confirm opening hours.")}</p><a href="tel:+9647716992955" dir="ltr" className="block text-primary">+964 771 699 2955</a>{safeHttps(settings.mapUrl) && <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="block text-primary underline">{ar ? "الموقع على الخريطة" : "Open map"}</a>}{safeHttps(settings.reviewsUrl) && <a href={settings.reviewsUrl} target="_blank" rel="noopener noreferrer" className="block text-primary underline">{ar ? "تقييمات العملاء" : "Customer reviews"}</a>}</section>
    <Link to="/quote" className="text-primary underline">{ar ? "اسأل فريق المبيعات" : "Ask sales"}</Link>
  </div>;
}
