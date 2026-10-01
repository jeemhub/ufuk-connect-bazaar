type Localized = { ar: string; en: string };

export type RuijieProduct = {
  id: string;
  model: string;
  image: string;
  pdf: string;
  summary: Localized;
  specs: { label: Localized; value: string }[];
  note?: Localized;
};

export type RuijieFamily = {
  key: string;
  index: string;
  kicker: string;
  title: Localized;
  lead: Localized;
  products: RuijieProduct[];
};

const spec = (ar: string, en: string, value: string) => ({ label: { ar, en }, value });

export const ruijieFamilies: RuijieFamily[] = [
  {
    key: "gateway", index: "01", kicker: "ROUTE / MANAGE",
    title: { ar: "بوابة تضبط حركة الشبكة.", en: "The gateway that sets the pace." },
    lead: { ar: "من المواقع الصغيرة إلى الشبكات الأكثر ازدحامًا، اختر قدرة التوجيه والمنافذ التي تناسب مشروعك.", en: "From compact sites to busier networks, choose the routing capacity and ports your project needs." },
    products: [
      {
        id: "1ede5cdd-1252-49fc-ac4d-d8f32c403d66", model: "RG-EG210G-P-V3", image: "/images/ruijie/rg-eg210g-p-v3.webp", pdf: "/datasheets/ruijie/rg-eg210g-p-v3.pdf",
        summary: { ar: "راوتر Reyee مُدار سحابيًا مع منافذ PoE+ لتوصيل الأجهزة وتشغيلها من نقطة واحدة.", en: "Cloud-managed Reyee gateway with PoE+ ports for connecting and powering devices from one point." },
        specs: [spec("منافذ الشبكة", "Network ports", "10 × Gigabit RJ45"), spec("مخارج PoE+", "PoE+ outputs", "8"), spec("ميزانية PoE", "PoE budget", "110 W"), spec("منافذ WAN", "WAN ports", "Up to 4"), spec("المستخدمون الموصى بهم", "Recommended clients", "200")],
      },
      {
        id: "0f2b8c64-b53b-4922-81e9-b32f57c26a16", model: "RG-EG710XS", image: "/images/ruijie/rg-eg710xs.webp", pdf: "/datasheets/ruijie/rg-eg710xs.pdf",
        summary: { ar: "بوابة عالية الأداء للشبكات الأكبر مع منافذ 2.5G و10G SFP+ وربط أسرع للمعدات الأساسية.", en: "High-performance gateway for larger networks with 2.5G and 10G SFP+ ports for faster core links." },
        specs: [spec("منافذ Gigabit RJ45", "Gigabit RJ45 ports", "4"), spec("منافذ 2.5G RJ45", "2.5G RJ45 ports", "4"), spec("منافذ 10G SFP+", "10G SFP+ ports", "2"), spec("المستخدمون الموصى بهم", "Recommended clients", "700"), spec("الشكل", "Form factor", "1U rack")],
      },
    ],
  },
  {
    key: "switch", index: "02", kicker: "DISTRIBUTE / POWER",
    title: { ar: "وزّع الاتصال والطاقة.", en: "Distribute data and power." },
    lead: { ar: "سويتش ذكي يربط الكاميرات ونقاط الوصول ويغذيها عبر PoE+، مع منافذ ربط إضافية للشبكة.", en: "A smart switch connects and powers cameras and access points over PoE+, with extra uplinks for the network." },
    products: [{
      id: "8f87b880-5ab5-4d12-8ad2-35f30371234a", model: "RG-ES220GS-P", image: "/images/ruijie/rg-es220gs-p.webp", pdf: "/datasheets/ruijie/rg-es220gs-p.pdf",
      summary: { ar: "سويتش Reyee ذكي مُدار سحابيًا، مخصص لتجميع الأجهزة الطرفية والطاقة في الشبكة.", en: "Cloud-managed Reyee smart switch that consolidates end devices and power on the network." },
      specs: [spec("منافذ PoE+", "PoE+ ports", "16 × Gigabit RJ45"), spec("منافذ RJ45 إضافية", "Additional RJ45 ports", "2 × Gigabit"), spec("منافذ SFP", "SFP ports", "2 × Gigabit"), spec("إجمالي المنافذ", "Total ports", "20"), spec("ميزانية PoE", "PoE budget", "250 W")],
    }],
  },
  {
    key: "wifi", index: "03", kicker: "COVER / CONNECT",
    title: { ar: "اتصال لاسلكي يتناسب مع المكان.", en: "Wi-Fi shaped around the space." },
    lead: { ar: "نقطة وصول سقفية Wi‑Fi 6 للمشاريع، أو راوتر Mesh للمساحات المنزلية والمكاتب الصغيرة.", en: "A ceiling Wi-Fi 6 access point for projects, or a Mesh router for homes and smaller offices." },
    products: [
      {
        id: "94fb02a1-cea9-4c29-9a3d-1f2f114230a3", model: "RG-RAP2260(E)", image: "/images/ruijie/rg-rap2260-e.webp", pdf: "/datasheets/ruijie/rg-rap2260-e.pdf",
        summary: { ar: "نقطة وصول سقفية مزدوجة النطاق Wi‑Fi 6 AX3200 تدعم PoE+، مع منفذ 2.5G للشبكات الحديثة.", en: "Dual-band AX3200 Wi-Fi 6 ceiling AP with PoE+ and a 2.5G port for modern networks." },
        specs: [spec("معيار Wi‑Fi", "Wi-Fi standard", "Wi-Fi 6 / AX3200"), spec("النطاق 5GHz", "5GHz radio", "Up to 2401 Mbps"), spec("النطاق 2.4GHz", "2.4GHz radio", "Up to 800 Mbps"), spec("منافذ Ethernet", "Ethernet ports", "1 × 2.5G + 1 × 1G"), spec("الطاقة", "Power", "PoE+ / 12 V DC")],
        note: { ar: "السرعات المذكورة معدلات اتصال لاسلكي نظرية بحسب الداتا شيت، وليست سرعة إنترنت مضمونة.", en: "Listed wireless rates are theoretical link rates from the datasheet, not guaranteed internet speeds." },
      },
      {
        id: "d302e4a8-3221-4c68-909c-14b2e5e51968", model: "RG-EW1300G", image: "/images/ruijie/rg-ew1300g.webp", pdf: "/datasheets/ruijie/rg-ew1300g.pdf",
        summary: { ar: "راوتر Wi‑Fi 5 AC1300 للمنزل والمكتب الصغير، يدعم Reyee Mesh لتوسيع التغطية.", en: "AC1300 Wi-Fi 5 router for homes and small offices with Reyee Mesh coverage expansion." },
        specs: [spec("معيار Wi‑Fi", "Wi-Fi standard", "Wi-Fi 5 / AC1300"), spec("منفذ WAN", "WAN port", "1 × Gigabit"), spec("منافذ LAN", "LAN ports", "3 × Gigabit"), spec("الهوائيات", "Antennas", "5 external"), spec("توسعة التغطية", "Coverage expansion", "Reyee Mesh 3.0")],
      },
    ],
  },
  {
    key: "bridge", index: "04", kicker: "EXTEND / LINK",
    title: { ar: "اربط موقعًا بموقع.", en: "Connect one site to another." },
    lead: { ar: "عندما يصعب مدّ الكيبل، يمنحك زوج الجسور اللاسلكية خيار ربط مباشر ضمن شروط الموقع المناسبة.", en: "When cabling is difficult, a paired wireless bridge offers a direct link where site conditions allow." },
    products: [{
      id: "c0b24727-a64f-4a23-8497-98a8f8407e92", model: "RG-EST310 V2", image: "/images/ruijie/rg-est310-v2.webp", pdf: "/datasheets/ruijie/rg-est310-v2.pdf",
      summary: { ar: "زوج جسور 5GHz مُهيأ مسبقًا للربط بين نقطتين، بهيكل IP54 للاستخدام الخارجي.", en: "Factory-paired 5GHz point-to-point bridges with an IP54 outdoor enclosure." },
      specs: [spec("العبوة", "Package", "2 paired units"), spec("مدى الربط الأقصى", "Maximum link range", "1 km"), spec("معدل الرابط اللاسلكي", "Wireless link rate", "Up to 866 Mbps"), spec("المنفذ السلكي لكل وحدة", "Wired port per unit", "1 × 10/100 Mbps"), spec("الحماية", "Ingress protection", "IP54")],
      note: { ar: "المدى ومعدل الرابط اللاسلكي يعتمدان على خط الرؤية والتداخل والتهيئة. المنفذ السلكي لكل وحدة بسرعة 100Mbps كحد أقصى.", en: "Range and wireless link rate depend on line of sight, interference and setup. Each unit's wired port is limited to 100 Mbps." },
    }],
  },
];
