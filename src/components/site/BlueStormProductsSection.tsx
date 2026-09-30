import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

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
  return (
    <div>
      {[
        { id: "bluestorm-cable", item: c.cable, image: assets.reel, to: products.cable },
        { id: "bluestorm-red-crimper", item: c.red, image: assets.redCrimper, to: products.redCrimper },
        { id: "bluestorm-blue-crimper", item: c.blue, image: assets.blueCrimper, to: products.blueCrimper },
      ].map(({ id, item, image, to }) => (
        <ProductCampaign key={id} id={id} image={image} alt={item.image} label={<bdi>{item.type}</bdi>} title={item.title} description={item.body} action={item.action} to={to} />
      ))}
    </div>
  );
}
