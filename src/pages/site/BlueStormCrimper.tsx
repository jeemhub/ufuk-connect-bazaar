import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import "@/components/site/crimper-campaign.css";

const variants = {
  standard: {
    sku: "BST-CBR-EZ",
    path: "/bluestorm/pass-through-crimper",
    productId: "a93cf9cf-13d2-49db-8325-c5bc800bad1e",
    image: "/images/bluestorm-feature/crimper-red-banner.jpg",
    detailImage: "/images/bluestorm-feature/crimper-red-studio.jpg",
    productName: { ar: "كابسة BlueStorm للفيش التمريري", en: "BlueStorm Pass Through Crimper" },
  },
  professional: {
    sku: "BST-CBB-EZ",
    path: "/bluestorm/professional-pass-through-crimper",
    productId: "ee3d0851-344a-48b1-9ec7-12b1c545c5da",
    image: "/images/bluestorm-feature/crimper-blue-banner.jpg",
    detailImage: "/images/bluestorm-feature/crimper-blue-studio.jpg",
    productName: { ar: "كابسة BlueStorm الاحترافية للفيش التمريري", en: "BlueStorm Professional Pass-Through Crimper" },
  },
};

const copy = {
  ar: {
    heroLabel: "BlueStorm  /  BST-CBR-EZ",
    heroTitle: "كابسة الفيش التمريري",
    heroBody: "أداة عملية لوصلات الشبكات ذات النهاية المفتوحة، مصممة لتثبيت الموصل في موضعه الصحيح أثناء الكبس.",
    productAction: "عرض السعر والتوفر",
    quoteAction: "اطلب عرض سعر",
    introLabel: "مصممة لعمل الشبكات",
    introTitle: "تفاصيل تساعدك في كل توصيلة",
    introBody: "تعمل الكابسة مع موصلات EZ-RJ45 التمريرية. يجتمع تموضع الموصل الثابت مع المقبض المريح في أداة واحدة لأعمال التركيب اليومية.",
    imageAlt: "كابسة BlueStorm ذات المقبض الأحمر والأسود في لقطة تفصيلية",
    features: [
      { title: "للموصلات التمريرية", body: "تُستخدم مع موصلات الشبكة ذات النهاية المفتوحة، بما فيها EZ-RJ45." },
      { title: "تموضع صحيح أثناء الكبس", body: "يثبت الموصل داخل الأداة للمساعدة على وضعه الصحيح عند الكبس." },
      { title: "قبضة مريحة", body: "مقبض مريح للإمساك بالأداة خلال أعمال التركيب المتكررة." },
      { title: "صناعة تايوانية", body: "طراز BST-CBR-EZ من BlueStorm، مصنوع في تايوان." },
    ],
    closingTitle: "جهّز أدوات تركيب الشبكة",
    closingBody: "افتح صفحة المنتج للاطلاع على السعر والتوفر الحالي، أو أرسل طلب عرض سعر لفريق أفق البصرة.",
    viewProduct: "افتح صفحة المنتج",
  },
  en: {
    heroLabel: "BlueStorm  /  BST-CBR-EZ",
    heroTitle: "Pass-through crimper",
    heroBody: "A practical tool for open-end network connectors, designed to hold each connector in the correct position while crimping.",
    productAction: "View price and availability",
    quoteAction: "Request a quote",
    introLabel: "Made for network installation",
    introTitle: "Details that matter in every connection",
    introBody: "This crimper works with EZ-RJ45 pass-through connectors. Secure connector positioning and an ergonomic grip come together in one tool for everyday installation work.",
    imageAlt: "BlueStorm crimper with red and black handles in a detailed studio view",
    features: [
      { title: "Pass-through connectors", body: "For open-end network connectors, including EZ-RJ45 connectors." },
      { title: "Correct positioning", body: "The connector locks into the tool for correct positioning during the crimp." },
      { title: "Comfort grip", body: "An ergonomic handle for repeated installation tasks." },
      { title: "Made in Taiwan", body: "The BlueStorm BST-CBR-EZ crimper is made in Taiwan." },
    ],
    closingTitle: "Equip your network toolkit",
    closingBody: "Open the product page for current pricing and availability, or request a quote from UFUK AL-Basra.",
    viewProduct: "Open product page",
  },
};

const professionalCopy = {
  ar: {
    heroLabel: "BlueStorm  /  BST-CBB-EZ",
    heroTitle: "كابسة BlueStorm الاحترافية",
    heroBody: "كابسة احترافية للموصلات التمريرية، تثبّت الفيشة في موضعها الصحيح أثناء الكبس وتمنح الفني قبضة مريحة.",
    productAction: "عرض السعر والتوفر",
    quoteAction: "اطلب عرض سعر",
    introLabel: "أداة عمل للفنيين",
    introTitle: "تموضع ثابت وقبضة مريحة",
    introBody: "طراز BST-CBB-EZ مخصص للموصلات ذات النهاية المفتوحة ومتوافق مع EZ-RJ45. يثبت الموصل داخل الأداة لتسهيل تموضعه عند الكبس.",
    imageAlt: "كابسة BlueStorm الاحترافية ذات المقبض الأزرق في لقطة تفصيلية",
    features: [
      { title: "للموصلات التمريرية", body: "تعمل مع موصلات الشبكة ذات النهاية المفتوحة، بما فيها EZ-RJ45." },
      { title: "تثبيت الموصل", body: "يستقر الموصل داخل الأداة في موضعه الصحيح أثناء الكبس." },
      { title: "مقبض مريح", body: "قبضة مريحة للإمساك بالأداة خلال أعمال التركيب المتكررة." },
      { title: "صناعة تايوانية", body: "طراز BST-CBB-EZ الاحترافي من BlueStorm، مصنوع في تايوان." },
    ],
    closingTitle: "أضف الكابسة الاحترافية لأدواتك",
    closingBody: "افتح صفحة المنتج للاطلاع على السعر والتوفر الحالي، أو اطلب عرض سعر من فريق أفق البصرة.",
    viewProduct: "افتح صفحة المنتج",
  },
  en: {
    heroLabel: "BlueStorm  /  BST-CBB-EZ",
    heroTitle: "Professional pass-through crimper",
    heroBody: "A professional crimper for pass-through connectors. It holds the plug in the correct position during crimping and gives the installer a comfortable grip.",
    productAction: "View price and availability",
    quoteAction: "Request a quote",
    introLabel: "A tool for network installers",
    introTitle: "Secure positioning, comfortable grip",
    introBody: "The BST-CBB-EZ is made for open-end connectors and is compatible with EZ-RJ45. The connector locks into the tool for correct positioning during the crimp.",
    imageAlt: "BlueStorm professional pass-through crimper with blue handles in a detailed studio view",
    features: [
      { title: "Pass-through connectors", body: "For open-end network connectors, including EZ-RJ45." },
      { title: "Connector positioning", body: "The connector locks into the tool in the correct position while crimping." },
      { title: "Comfort grip", body: "An ergonomic handle for repeated installation tasks." },
      { title: "Made in Taiwan", body: "The BlueStorm BST-CBB-EZ professional crimper is made in Taiwan." },
    ],
    closingTitle: "Add the professional crimper to your toolkit",
    closingBody: "Open the product page for current pricing and availability, or request a quote from UFUK AL-Basra.",
    viewProduct: "Open product page",
  },
};

export default function BlueStormCrimper({ professional = false }: { professional?: boolean }) {
  const { lang } = useLanguage();
  const variant = professional ? variants.professional : variants.standard;
  const c = professional ? professionalCopy[lang] : copy[lang];
  const productPath = `/products/${variant.productId}`;
  const quotePath = `/quote?product=${variant.productId}`;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <>
      <Seo
        title={`${c.heroTitle}${professional && lang === "ar" ? "" : " BlueStorm"} ${variant.sku} | ${SITE_NAME}`}
        description={c.heroBody}
        path={variant.path}
        image={variant.image}
        type="product"
        lang={lang}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: variant.productName[lang],
          sku: variant.sku,
          brand: { "@type": "Brand", name: "BlueStorm" },
          image: "https://ufukalbasra.com" + variant.image,
          description: c.heroBody,
        }}
      />

      <section aria-labelledby="crimper-title" className="bs-crimper-campaign bs-crimper-landing relative isolate min-h-[760px] overflow-hidden bg-[#061831] text-white md:min-h-[640px]">
        <img src={variant.image} alt={c.imageAlt} fetchPriority="high" width={1672} height={941} className="bs-crimper-image absolute inset-0 h-full w-full object-cover object-left" />
        <div aria-hidden="true" className="bs-crimper-shade absolute inset-0 bg-gradient-to-t from-[#061831] from-[18%] via-[#061831]/90 via-[48%] to-transparent md:bg-gradient-to-l md:from-[#061831] md:from-[8%] md:via-[#061831]/80 md:via-[39%] md:to-transparent" />
        <div className="bs-crimper-inner relative mx-auto flex min-h-[760px] max-w-7xl items-end px-5 pb-16 pt-[410px] md:min-h-[640px] md:items-center md:px-10 md:py-20">
          <div className="bs-crimper-copy ml-auto w-full max-w-[590px]">
            <p dir="ltr" className={`text-sm font-semibold tracking-wide text-[#a7d3ff] ${lang === "ar" ? "text-right" : "text-left"}`}>{c.heroLabel}</p>
            <h1 id="crimper-title" className="mt-4 text-5xl font-bold leading-[1.08] sm:text-6xl">{c.heroTitle}</h1>
            <p className="mt-6 max-w-lg text-lg leading-9 text-[#d7e5f4]">{c.heroBody}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={productPath} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0b2a4e] transition-colors hover:bg-[#d9ebff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                {c.productAction}<Arrow aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link to={quotePath} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/50 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                {c.quoteAction}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fb] px-5 py-16 text-[#10243d] md:px-6 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-[#1769bb]">{c.introLabel}</p>
            <h2 className="mt-3 max-w-xl text-3xl font-bold leading-tight md:text-5xl">{c.introTitle}</h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4b6075] md:text-lg">{c.introBody}</p>
            <div className="mt-9 border-t border-[#cad8e4]">
              {c.features.map((feature) => (
                <div key={feature.title} className="grid gap-1 border-b border-[#cad8e4] py-5 md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] md:gap-6">
                  <h3 className="text-base font-bold">{feature.title}</h3>
                  <p className="text-sm leading-7 text-[#536a7e]">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
          <img src={variant.detailImage} alt={c.imageAlt} loading="lazy" decoding="async" width={1536} height={1024} className="w-full object-cover shadow-[0_24px_65px_rgba(7,30,60,0.16)]" />
        </div>
      </section>

      <section className="bg-[#0a2d57] px-5 py-16 text-white md:px-6 md:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-[#a7d3ff]">BlueStorm  /  {variant.sku}</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">{c.closingTitle}</h2>
            <p className="mt-4 max-w-2xl leading-8 text-[#d1dfed]">{c.closingBody}</p>
          </div>
          <Link to={productPath} className="inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0b2a4e] transition-colors hover:bg-[#d9ebff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            {c.viewProduct}<ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
