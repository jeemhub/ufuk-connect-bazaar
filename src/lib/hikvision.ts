export const hikvisionProducts = [
  {
    slug: "colorvu", id: "602476c1-1800-4126-a897-6f47efdafe53", model: "DS-2CD2T87G3-LIS2UY/SL",
    image: "/images/hikvision/bullet.jpg", pdf: "DS-2CD2T87G3-LIS2UY-SLRB_20250411.pdf", family: "ColorVu",
    ar: { name: "التفاصيل تبقى واضحة، حتى ليلاً.", use: "المداخل ومحيط المبنى", body: "كاميرا Bullet تجمع دقة 8 ميغابكسل مع ColorVu وإضاءة هجينة ذكية. تميّز الأشخاص والمركبات، وتتيح الاستماع والتحدث عبر الصوت المدمج.", specs: [["دقة الصورة", "3840 × 2160"], ["العدسة", "4 mm · F1.0"], ["الإضاءة الهجينة — حتى", "60 m · IR + White"], ["الحماية", "IP67"]], detail: "وميض أبيض وتنبيه صوتي للتنبيه عند الأحداث، مع ميكروفونين مدمجين وصوت باتجاهين." },
    en: { name: "Details stay clear. Even at night.", use: "Entrances & building perimeters", body: "An 8 MP Bullet camera with ColorVu and Smart Hybrid Light. Classify people and vehicles, listen to events and respond through built-in two-way audio.", specs: [["Image resolution", "3840 × 2160"], ["Lens", "4 mm · F1.0"], ["Lighting", "IR + White · up to 60 m"], ["Protection", "IP67"]], detail: "A white strobe and audible warning respond to events, with built-in dual microphones and two-way audio." },
  },
  {
    slug: "panoramic", id: "f5894a7c-c34d-448d-b01d-a5ff29ac6cdb", model: "DS-2CD2387G2P-LSU/SL",
    image: "/images/hikvision/panoramic.jpg", pdf: "DS-2CD2387G2P-LSU-SL.pdf", family: "Panoramic ColorVu",
    ar: { name: "المشهد كاملًا. في صورة واحدة.", use: "المساحات الواسعة", body: "رؤية بانورامية بزاوية 180° تجمع مشهدي العدستين في صورة واحدة. ColorVu يحافظ على تفاصيل الألوان، مع تمييز الأشخاص والمركبات وتنبيه ضوئي وصوتي.", specs: [["دقة الصورة", "5120 × 1440"], ["مجال الرؤية الأفقي", "180° ± 10°"], ["العدستان", "4 mm · F1.0"], ["الحماية", "IP67"]], detail: "مناسبة لعرض واجهة واسعة أو ساحة في مشهد واحد. سرعة الصورة عند أعلى دقة تتغير حسب إعداد WDR؛ راجع الداتا شيت للتفاصيل." },
    en: { name: "The wider picture. In one view.", use: "Wide open areas", body: "A 180° panoramic view combines both lenses into one image. ColorVu preserves color detail, with human and vehicle classification plus a strobe and audible warning.", specs: [["Image resolution", "5120 × 1440"], ["Horizontal view", "180° ± 10°"], ["Dual lenses", "4 mm · F1.0"], ["Protection", "IP67"]], detail: "See a broad frontage or courtyard in one view. Frame rate at maximum resolution depends on WDR settings; see the datasheet for details." },
  },
  {
    slug: "tandemvu", id: "e042834f-8a57-41fe-933f-bd20f4f19496", model: "DS-2SE7C432MW-AEB(14F1)(P3)",
    image: "/images/hikvision/ptz.jpg", pdf: "DS-2SE7C432MW-AEB-14F1-P3_20250522.pdf", family: "TandemVu PTZ",
    ar: { name: "راقب المشهد. واقترب من التفاصيل.", use: "الساحات والمواقع الكبيرة", body: "قناة ثابتة للمشهد العام وأخرى متحركة للتفاصيل في جهاز واحد. تقريب بصري 32× مع دوران أفقي 360° لمتابعة مناطق مختلفة من الموقع.", specs: [["دقة القناتين", "4 MP + 4 MP"], ["التقريب البصري PTZ", "32×"], ["إضاءة IR المتحركة — حتى", "200 m"], ["إضاءة بيضاء ثابتة — حتى", "30 m"]], detail: "تقنية DarkFighter للقناة المتحركة في الإضاءة المنخفضة، مع تنبيه ضوئي وصوتي. تبقى القناة الثابتة مخصّصة للمشهد العام أثناء تحريك قناة PTZ." },
    en: { name: "Keep the overview. Get the detail.", use: "Courtyards & larger sites", body: "A fixed overview channel and a moving detail channel in one device. A 32× optical zoom and 360° horizontal rotation let you inspect different areas of the site.", specs: [["Channel resolution", "4 MP + 4 MP"], ["PTZ optical zoom", "32×"], ["PTZ infrared light", "Up to 200 m"], ["Fixed-channel light", "White · up to 30 m"]], detail: "Powered-by-DarkFighter imaging for the PTZ channel in low light, with active light and audio warnings. The fixed channel retains the overview while the PTZ channel moves." },
  },
  {
    slug: "acusense", id: "6b6e16ef-ef32-4697-91b9-11bea98c3140", model: "DS-7608NXI-K2",
    image: "/images/hikvision/nvr.png", pdf: "DS-7608NXI-K2_20231021.pdf", family: "AcuSense NVR",
    ar: { name: "تسجيل منظّم. وصول أسهل للأحداث.", use: "التسجيل وإدارة الكاميرات", body: "مسجل شبكي يدعم حتى 8 كاميرات IP، مع ضغط H.265+ وإخراج HDMI حتى 4K. أدوات البحث والتشغيل الذكي تساعدك على الوصول إلى التسجيلات المطلوبة.", specs: [["قنوات IP", "8"], ["عرض نطاق الدخل", "80 Mbps"], ["أقصى إخراج HDMI", "4K"], ["التخزين", "2 × SATA"]], detail: "يدعم حتى 10TB لكل قرص بحسب الداتا شيت لهذه النسخة. هذا الطراز دون منافذ PoE مدمجة؛ يمكن لفريقنا مساعدتك باختيار السويتش والتخزين المناسبين." },
    en: { name: "Organized recording. Easier retrieval.", use: "Recording & camera management", body: "A network recorder for up to 8 IP cameras, with H.265+ compression and HDMI output up to 4K. Smart search and playback tools help you find the events you need.", specs: [["IP channels", "8"], ["Incoming bandwidth", "80 Mbps"], ["HDMI output", "Up to 4K"], ["Storage", "2 × SATA"]], detail: "Supports up to 10 TB per drive according to this version’s datasheet. This model has no built-in PoE ports; our team can help size the switch and storage for your installation." },
  },
];
