import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const assets = {
  reel: "/images/bluestorm-feature/cable-reel.jpeg",
  box: "/images/bluestorm-feature/cable-box.jpg",
  redCrimper: "/images/bluestorm-feature/crimper-red-banner.jpg",
  blueCrimper: "/images/bluestorm-feature/crimper-blue.webp",
};

const products = {
  cable: "/products/2ead67db-9576-4476-aae7-03ffb17ae570",
  redCrimper: "/bluestorm/pass-through-crimper",
  blueCrimper: "/products/ee3d0851-344a-48b1-9ec7-12b1c545c5da",
};

const copy = {
  ar: {
    intro: "من الكيبل إلى آخر وصلة",
    heading: "منتجات BlueStorm المختارة",
    lead: "كيبل خارجي وأدوات تركيب، مع عرض واضح لشكل كل منتج وتفاصيله قبل اختياره.",
    cable: {
      type: "كيبل شبكات خارجي",
      title: "كيبل BlueStorm CAT5E بطول 305 متر",
      body: "كيبل SFTP للتركيبات الخارجية، مع طبقات تدريع للحماية من التداخل. شاهد البكرة وعلبة السحب، ثم افتح صفحة المنتج للمواصفات الكاملة.",
      image: "بكرة كيبل BlueStorm بجانب علبة كيبل الشبكات الخارجي",
      specs: ["CAT5E", "SFTP", "305 متر"],
    },
    red: {
      type: "BlueStorm  /  BST-CBR-EZ",
      title: "كبسة دقيقة. وصلة جاهزة.",
      body: "كابسة للموصلات التمريرية EZ-RJ45. تثبّت الفيشة في موضعها الصحيح أثناء الكبس، مع قبضة مريحة للعمل المتكرر.",
      image: "كابسة فيش BlueStorm بمقبض أحمر وأسود",
      action: "اكتشف الكابسة",
    },
    blue: {
      type: "أداة تركيب احترافية",
      title: "كابسة BlueStorm الاحترافية",
      body: "نسخة بمقبض أزرق للموصلات ذات النهاية المفتوحة، تعرض الصورة شكل الرأس ومناطق الإمساك بوضوح.",
      image: "كابسة فيش BlueStorm احترافية بمقبض أزرق",
    },
    action: "عرض المنتج",
  },
  en: {
    intro: "From cable to final connection",
    heading: "Selected BlueStorm products",
    lead: "Outdoor cable and installation tools, presented clearly so you can inspect each product before choosing.",
    cable: {
      type: "Outdoor network cable",
      title: "BlueStorm CAT5E cable, 305 m",
      body: "SFTP cable for outdoor installations, with shielding against interference. See the reel and pull box, then open the product page for full specifications.",
      image: "BlueStorm cable reel beside the outdoor network cable box",
      specs: ["CAT5E", "SFTP", "305 m"],
    },
    red: {
      type: "BlueStorm  /  BST-CBR-EZ",
      title: "A precise crimp. A ready connection.",
      body: "A pass-through crimper for EZ-RJ45 connectors. It holds the connector in position while crimping, with a comfortable grip for repeated use.",
      image: "BlueStorm crimper with red and black handles",
      action: "Explore the crimper",
    },
    blue: {
      type: "Professional installation tool",
      title: "BlueStorm professional crimper",
      body: "The blue-handle pass-through model, shown close enough to see the head and grip clearly.",
      image: "BlueStorm professional crimper with blue handles",
    },
    action: "View product",
  },
};

export function BlueStormProductsSection() {
  const { lang } = useLanguage();
  const c = copy[lang];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const action = (to: string) => (
    <Link
      to={to}
      className="mt-8 inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-[#1769bb] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0e4d91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1769bb]"
    >
      {c.action}
      <Arrow aria-hidden="true" className="h-4 w-4" />
    </Link>
  );

  return (
    <section aria-labelledby="bluestorm-products-title" className="bg-[#092448] py-16 text-white md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 max-w-3xl md:mb-14">
          <p className="text-sm font-medium text-[#a7d3ff]">{c.intro}</p>
          <h2 id="bluestorm-products-title" className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
            {c.heading}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#d1dfed] md:text-lg">{c.lead}</p>
        </div>

        <div className="space-y-5 md:space-y-7">
          <article className="grid overflow-hidden rounded-[1.75rem] bg-[#f6f8fa] text-[#10243d] lg:min-h-[440px] lg:grid-cols-2">
            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-[#e9eff4] p-5 sm:min-h-[390px] sm:p-8 lg:min-h-full">
              <div aria-hidden="true" className="absolute h-[76%] w-[76%] rounded-full border border-[#cbd8e3]" />
              <div aria-hidden="true" className="absolute h-[52%] w-[52%] rounded-full border border-[#cbd8e3]" />
              <div className="relative flex w-full max-w-[560px] items-center justify-center gap-1 sm:gap-3">
                <img src={assets.reel} alt={c.cable.image} loading="lazy" decoding="async" width={554} height={554} className="w-[65%] rounded-xl object-contain shadow-[0_16px_36px_rgba(12,34,59,0.12)]" />
                <img src={assets.box} alt="" loading="lazy" decoding="async" width={800} height={800} className="w-[32%] rounded-lg object-contain shadow-[0_14px_28px_rgba(12,34,59,0.12)]" />
              </div>
            </div>
            <div className="flex flex-col justify-center px-7 py-10 sm:px-11 lg:px-14">
              <p className="text-sm font-semibold text-[#1d64aa]">{c.cable.type}</p>
              <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">{c.cable.title}</h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#4b6075]">{c.cable.body}</p>
              <div className="mt-6 flex flex-wrap gap-2" aria-label={lang === "ar" ? "مواصفات أساسية" : "Key specifications"}>
                {c.cable.specs.map((spec) => <span key={spec} className="rounded-full border border-[#c7d7e5] px-3.5 py-1.5 text-xs font-semibold text-[#34536d]">{spec}</span>)}
              </div>
              {action(products.cable)}
            </div>
          </article>

          <article className="relative isolate min-h-[690px] overflow-hidden bg-[#061831] text-white md:min-h-[590px]">
            <img src={assets.redCrimper} alt={c.red.image} loading="lazy" decoding="async" width={1672} height={941} className="absolute inset-0 h-full w-full object-cover object-left" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#061831] from-[18%] via-[#061831]/90 via-[48%] to-transparent md:bg-gradient-to-l md:from-[#061831] md:from-[6%] md:via-[#061831]/75 md:via-[36%] md:to-transparent" />
            <div className="relative z-10 ml-auto flex min-h-[690px] w-full max-w-[610px] flex-col justify-end px-7 pb-12 pt-[390px] sm:px-12 md:min-h-[590px] md:justify-center md:px-12 md:py-16">
              <p dir="ltr" className={`text-sm font-semibold tracking-wide text-[#a7d3ff] ${lang === "ar" ? "text-right" : "text-left"}`}>{c.red.type}</p>
              <h3 className="mt-4 max-w-xl text-4xl font-bold leading-[1.12] sm:text-5xl">{c.red.title}</h3>
              <p className="mt-6 max-w-lg text-base leading-8 text-[#d5e5f6] md:text-lg">{c.red.body}</p>
              <Link
                to={products.redCrimper}
                className="mt-8 inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0b2a4e] transition-colors hover:bg-[#d9ebff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {c.red.action}<Arrow aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </article>

          <article className="grid overflow-hidden rounded-[1.75rem] bg-[#f6f8fa] text-[#10243d] lg:min-h-[400px] lg:grid-cols-2">
            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-[#e7edf4] p-5 sm:min-h-[360px] lg:min-h-full">
              <div aria-hidden="true" className="absolute h-[78%] w-[78%] rounded-full border border-white" />
              <img src={assets.blueCrimper} alt={c.blue.image} loading="lazy" decoding="async" width={640} height={640} className="relative h-[290px] w-auto max-w-full object-contain drop-shadow-[0_22px_18px_rgba(13,41,71,0.19)] sm:h-[350px] lg:h-[370px]" />
            </div>
            <div className="flex flex-col justify-center px-7 py-10 sm:px-11 lg:px-14">
              <p className="text-sm font-semibold text-[#1d64aa]">{c.blue.type}</p>
              <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">{c.blue.title}</h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#4b6075]">{c.blue.body}</p>
              {action(products.blueCrimper)}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
