import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import "./crimper-campaign.css";

const assets = {
  reel: "/images/bluestorm-feature/cable-reel-banner.jpg",
  redCrimper: "/images/bluestorm-feature/crimper-red-banner.jpg",
  blueCrimper: "/images/bluestorm-feature/crimper-blue-banner.jpg",
};

const products = {
  cable: "/bluestorm/cat6-sftp-outdoor",
  redCrimper: "/bluestorm/pass-through-crimper",
  blueCrimper: "/bluestorm/professional-pass-through-crimper",
};

const copy = {
  ar: {
    intro: "من الكيبل إلى آخر وصلة",
    heading: "منتجات BlueStorm المختارة",
    lead: "كيبل خارجي وأدوات تركيب، مع عرض واضح لشكل كل منتج وتفاصيله قبل اختياره.",
    cable: {
      type: "BlueStorm  /  BS-OSFTP6-305M",
      title: "شبكتك تبدأ من الداخل.",
      body: "كيبل CAT6 SFTP خارجي بطول 305 متر. موصلات نحاس صلب، تدريع معدني وغلاف PE مقاوم للعوامل الجوية. اكتشف التفاصيل طبقةً بعد طبقة.",
      image: "بكرة كيبل BlueStorm CAT6 SFTP الخارجي",
      action: "اكتشف كيبل CAT6",
    },
    red: {
      type: "BlueStorm  /  BST-CBR-EZ",
      title: "كبسة دقيقة. وصلة جاهزة.",
      body: "كابسة للموصلات التمريرية EZ-RJ45. تثبّت الفيشة في موضعها الصحيح أثناء الكبس، مع قبضة مريحة للعمل المتكرر.",
      image: "كابسة فيش BlueStorm بمقبض أحمر وأسود",
      action: "اكتشف الكابسة",
    },
    blue: {
      type: "BlueStorm  /  BST-CBB-EZ",
      title: "احترافية في كل توصيلة.",
      body: "كابسة احترافية للفيش التمريري EZ-RJ45، تثبّت الموصل أثناء الكبس وتمنح الفني قبضة مريحة للعمل المتكرر.",
      image: "كابسة فيش BlueStorm احترافية بمقبض أزرق",
      action: "اكتشف الكابسة الاحترافية",
    },
    action: "عرض المنتج",
  },
  en: {
    intro: "From cable to final connection",
    heading: "Selected BlueStorm products",
    lead: "Outdoor cable and installation tools, presented clearly so you can inspect each product before choosing.",
    cable: {
      type: "BlueStorm  /  BS-OSFTP6-305M",
      title: "A network built from within.",
      body: "305 metres of outdoor CAT6 SFTP cable. Solid copper conductors, metallic shielding and a weather-resistant PE jacket. Explore the details, layer by layer.",
      image: "BlueStorm outdoor CAT6 SFTP cable reel",
      action: "Explore CAT6 cable",
    },
    red: {
      type: "BlueStorm  /  BST-CBR-EZ",
      title: "A precise crimp. A ready connection.",
      body: "A pass-through crimper for EZ-RJ45 connectors. It holds the connector in position while crimping, with a comfortable grip for repeated use.",
      image: "BlueStorm crimper with red and black handles",
      action: "Explore the crimper",
    },
    blue: {
      type: "BlueStorm  /  BST-CBB-EZ",
      title: "Built for every connection.",
      body: "A professional pass-through crimper for EZ-RJ45 connectors. It holds the connector during crimping and offers a comfortable grip for repeated work.",
      image: "BlueStorm professional crimper with blue handles",
      action: "Explore the professional crimper",
    },
    action: "View product",
  },
};

export function BlueStormProductsSection() {
  const { lang } = useLanguage();
  const c = copy[lang];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

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
          {[
            { item: c.cable, image: assets.reel, to: products.cable },
            { item: c.red, image: assets.redCrimper, to: products.redCrimper },
            { item: c.blue, image: assets.blueCrimper, to: products.blueCrimper },
          ].map(({ item, image, to }) => (
            <article key={to} className={`relative isolate min-h-[690px] overflow-hidden bg-[#061831] text-white md:min-h-[590px] ${to !== products.cable ? "bs-crimper-campaign" : ""}`}>
              <img src={image} alt={item.image} loading="lazy" decoding="async" width={1672} height={941} className={`absolute inset-0 w-full object-cover object-left ${to === products.cable ? "h-[390px] md:h-full" : "h-full bs-crimper-image"}`} />
              <div aria-hidden="true" className="bs-crimper-shade absolute inset-0 bg-gradient-to-t from-[#061831] from-[18%] via-[#061831]/90 via-[48%] to-transparent md:bg-gradient-to-l md:from-[#061831] md:from-[6%] md:via-[#061831]/75 md:via-[36%] md:to-transparent" />
              <div className="bs-crimper-copy relative z-10 ml-auto flex min-h-[690px] w-full max-w-[610px] flex-col justify-end px-7 pb-12 pt-[390px] sm:px-12 md:min-h-[590px] md:justify-center md:px-12 md:py-16">
                <p dir="ltr" className={`text-sm font-semibold tracking-wide text-[#a7d3ff] ${lang === "ar" ? "text-right" : "text-left"}`}>{item.type}</p>
                <h3 className="mt-4 max-w-xl text-4xl font-bold leading-[1.12] sm:text-5xl">{item.title}</h3>
                <p className="mt-6 max-w-lg text-base leading-8 text-[#d5e5f6] md:text-lg">{item.body}</p>
                <Link
                  to={to}
                  className="mt-8 inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0b2a4e] transition-colors hover:bg-[#d9ebff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {item.action}<Arrow aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
