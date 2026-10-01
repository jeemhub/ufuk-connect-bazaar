type Localized = { ar: string; en: string };
export type OnvProduct = {
  id: string;
  model: string;
  image: string;
  pdf: string;
  summary: Localized;
  specs: { label: Localized; value: string }[];
  note?: Localized;
};
export type OnvFamily = {
  key: string;
  index: string;
  code: string;
  title: Localized;
  lead: Localized;
  products: OnvProduct[];
};
const spec = (ar: string, en: string, value: string) => ({ label: { ar, en }, value });

export const onvFamilies: OnvFamily[] = [
  {
    key: "compact", index: "01", code: "COMPACT / EDGE",
    title: { ar: "قريب من الكاميرا. جاهز للعمل.", en: "Close to the camera. Ready to work." },
    lead: { ar: "حلول مدمجة لأطراف الشبكة: اختر منافذ 10/100 للمراقبة الأساسية، أو Gigabit مع مخارج فايبر SFP.", en: "Compact edge choices: 10/100 ports for basic surveillance, or Gigabit with SFP fiber uplinks." },
    products: [
      {
        id: "9440d106-1c01-4ec3-b6ea-1235d6c5c7a0", model: "ONV-H1064PSD", image: "/images/onv/h1064psd.webp", pdf: "/datasheets/onv/h1064psd.pdf",
        summary: { ar: "سويتش PoE+ صغير للكاميرات، مع Watchdog يعيد تشغيل طاقة المنفذ عند تعطل الاتصال.", en: "Compact PoE+ switch for cameras, with a watchdog that restarts port power when communication fails." },
        specs: [spec("منافذ PoE+", "PoE+ ports", "4 × 10/100 Mbps"), spec("منافذ الربط", "Uplink ports", "2 × 10/100 Mbps RJ45"), spec("مزود الطاقة المدمج", "Built-in power supply", "65 W"), spec("وضع المدى البعيد", "Extended mode", "250 m at 10 Mbps"), spec("مراقبة المنافذ", "Port monitoring", "PoE watchdog")],
        note: { ar: "يتطلب مدى 250 متر تفعيل وضع التمديد، وعندها تعمل المنافذ المعنية بسرعة 10Mbps وفق الداتا شيت.", en: "The 250 m range requires extended mode; affected ports then operate at 10 Mbps as specified by the datasheet." },
      },
      {
        id: "8ded5272-2a3f-4f65-b478-7c017c331f0f", model: "ONV-POE33064PF", image: "/images/onv/poe33064pf.webp", pdf: "/datasheets/onv/poe33064pf.pdf",
        summary: { ar: "سويتش PoE+ غير مُدار بأربعة منافذ Gigabit ومنفذي فايبر SFP لربط الموقع بالشبكة الأساسية.", en: "Unmanaged PoE+ switch with four Gigabit ports and two SFP fiber uplinks for a core-network connection." },
        specs: [spec("منافذ PoE+", "PoE+ ports", "4 × Gigabit RJ45"), spec("منافذ الفايبر", "Fiber uplinks", "2 × Gigabit SFP"), spec("الطاقة لكل منفذ", "Per-port power", "Up to 30 W"), spec("التشغيل", "Operation", "Unmanaged"), spec("التغذية", "Power input", "External 52 V adapter")],
        note: { ar: "وحدات SFP تُشترى بصورة منفصلة. تحدد نسخة محول الطاقة القدرة الإجمالية المتاحة.", en: "SFP modules are sold separately. The power-adapter version determines available total power." },
      },
    ],
  },
  {
    key: "managed", index: "02", code: "CONTROL / L2+",
    title: { ar: "عندما تحتاج التحكم بالشبكة.", en: "When the network needs control." },
    lead: { ar: "تجميع كاميرات ونقاط وصول مع إدارة VLAN وQoS ومراقبة PoE من واجهات الإدارة المتاحة في الجهاز.", en: "Aggregate cameras and access points with VLAN, QoS and PoE monitoring through the switch's management interfaces." },
    products: [{
      id: "6614f229-e0cf-47dc-8926-7afb41252dd2", model: "ONV-POE33010PFM", image: "/images/onv/poe33010pfm.webp", pdf: "/datasheets/onv/poe33010pfm.pdf",
      summary: { ar: "سويتش L2+ مُدار بعشرة منافذ، يجمع توصيل PoE+ Gigabit مع ربط فايبر SFP وإدارة الشبكة.", en: "Ten-port L2+ managed switch combining Gigabit PoE+, SFP fiber links and network management." },
      specs: [spec("منافذ PoE+", "PoE+ ports", "8 × Gigabit RJ45"), spec("منافذ الفايبر", "Fiber uplinks", "2 × 100/1000 Mbps SFP"), spec("مزود الطاقة المدمج", "Built-in power supply", "130 W"), spec("الإدارة", "Management", "Web / CLI / SNMP"), spec("وظائف الشبكة", "Network functions", "VLAN / QoS / ACL")],
      note: { ar: "نسخة 130W هي ONV-POE33010PFM؛ تعرض الداتا شيت نسخة أخرى لاحقتها -at بقدرة 250W.", en: "The ONV-POE33010PFM version has a 130 W supply; the datasheet also lists a separate -at version with 250 W." },
    }],
  },
  {
    key: "rack", index: "03", code: "SCALE / RACK",
    title: { ar: "منافذ أكثر. موقع أكبر.", en: "More ports. A bigger site." },
    lead: { ar: "للتركيبات متعددة الكاميرات، مع منافذ PoE+ Gigabit وربط نحاسي وفايبر في جهاز مخصص للرف.", en: "For larger camera installations, with Gigabit PoE+, copper uplinks and fiber uplinks in a rack-ready unit." },
    products: [{
      id: "cd9172b0-8f35-4aa2-8875-2e1d686e58b6", model: "ONV-POE33020PF-at", image: "/images/onv/poe33020pf-at.webp", pdf: "/datasheets/onv/poe33020pf-at.pdf",
      summary: { ar: "نسخة 400W من سويتش ONV غير المُدار للمشاريع التي تحتاج عدد منافذ أعلى وتغذية PoE+ متعددة.", en: "The 400 W version of ONV's unmanaged switch for projects needing more ports and multiple PoE+ devices." },
      specs: [spec("منافذ PoE+", "PoE+ ports", "16 × Gigabit RJ45"), spec("منافذ ربط نحاسية", "Copper uplinks", "2 × Gigabit RJ45"), spec("منافذ فايبر", "Fiber uplinks", "2 × Gigabit SFP"), spec("مزود الطاقة المدمج", "Built-in power supply", "400 W"), spec("الشكل", "Form factor", '1U / 19" rack')],
      note: { ar: "400W تخص نسخة -at. وحدات SFP ليست ضمن العبوة وفق الداتا شيت.", en: "400 W applies to the -at version. SFP modules are not included according to the datasheet." },
    }],
  },
  {
    key: "industrial", index: "04", code: "FIELD / INDUSTRIAL",
    title: { ar: "للشبكة خارج غرفة الأجهزة.", en: "For networks beyond the server room." },
    lead: { ar: "سويتش صناعي يثبت على سكة DIN، مع مدخلي طاقة DC احتياطيين وربط فايبر للمواقع الميدانية.", en: "A DIN-rail industrial switch with dual redundant DC inputs and fiber links for field sites." },
    products: [{
      id: "a351eda7-36d1-4321-acdd-e6d241cde289", model: "ONV-IPS33064PF", image: "/images/onv/ips33064pf.webp", pdf: "/datasheets/onv/ips33064pf.pdf",
      summary: { ar: "سويتش PoE+ صناعي غير مُدار بأربعة منافذ Gigabit، منفذي SFP، وهيكل ملائم للتركيب على DIN.", en: "Unmanaged industrial PoE+ switch with four Gigabit ports, two SFP uplinks and a DIN-rail enclosure." },
      specs: [spec("منافذ PoE+", "PoE+ ports", "4 × Gigabit RJ45"), spec("منافذ الفايبر", "Fiber uplinks", "2 × Gigabit SFP"), spec("مدخل الطاقة", "Power input", "Dual DC 44–57 V"), spec("التركيب", "Mounting", "DIN rail"), spec("التشغيل", "Operation", "Unmanaged")],
      note: { ar: "مزود الطاقة ووحدات SFP غير مشمولة حسب الداتا شيت، ويُختار مزود الطاقة وفق حمل PoE المطلوب.", en: "Power supply and SFP modules are not included per the datasheet; choose the power supply for the required PoE load." },
    }],
  },
];
