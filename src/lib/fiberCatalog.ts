import type { Product } from "@/data/mockData";

export type FiberCategoryId = "cables" | "patch" | "termination" | "optics" | "equipment" | "tools";

export const fiberCategories: {
  id: FiberCategoryId;
  number: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  code: string;
}[] = [
  { id: "cables", number: "01", code: "BACKBONE", title: { ar: "كيابل الفايبر", en: "Fiber cables" }, description: { ar: "كيابل متعددة الأنوية، مدرعة وخيارات تُباع بالمتر أو باللفة حسب المنتج.", en: "Multi-core and armored cables, with per-meter or reel options depending on the product." } },
  { id: "patch", number: "02", code: "CONNECT", title: { ar: "باتش كورد", en: "Patch cords" }, description: { ar: "وصلات SC وLC وFC، سنكل مود وملتي مود، بأطوال مختلفة.", en: "SC, LC and FC connections in single-mode and multimode, across a range of lengths." } },
  { id: "termination", number: "03", code: "DISTRIBUTE", title: { ar: "إنهاء وتوزيع", en: "Termination & distribution" }, description: { ar: "ODF وعلب فايبر وسبليترات وبيك تيل وكوبلرات ومستلزمات اللحام.", en: "ODFs, fiber boxes, splitters, pigtails, couplers and splice accessories." } },
  { id: "optics", number: "04", code: "TRANSMIT", title: { ar: "وحدات SFP الضوئية", en: "Optical transceivers" }, description: { ar: "موديولات فايبر بسرعات وموصلات ومسافات مختلفة من العلامات الموجودة في الكتالوج.", en: "Fiber modules with different speeds, connectors and reaches from brands in the catalog." } },
  { id: "equipment", number: "05", code: "ACTIVATE", title: { ar: "معدات الشبكة الضوئية", en: "Optical network devices" }, description: { ar: "ميديا كونفرتر وأجهزة ONT/ONU وسويتشات تدعم وصلات SFP.", en: "Media converters, ONT/ONU devices and switches with SFP links." } },
  { id: "tools", number: "06", code: "MEASURE", title: { ar: "فحص ولحام", en: "Testing & splicing" }, description: { ar: "أجهزة OTDR وآلات لحام وقياس وقص وتنظيف الألياف الضوئية.", en: "OTDRs, fusion splicers and tools for measuring, cutting and cleaning optical fiber." } },
];

const priorities: Partial<Record<FiberCategoryId, string[]>> = {
  cables: ["7ff99a80-45ec-48f1-ade6-a7078147d149", "951caee8-11bc-42a9-bd08-7fd0078ef776", "146ee11a-8640-496e-b35c-b62e9a732778", "492db358-1af6-4640-aef3-4330ed26f92a"],
  patch: ["6dd5b82a-c0b2-4948-92a3-08e20804a262", "49cbe52b-1be1-47a0-ad76-2ba862800bb7", "cf0848d1-da7e-40bc-a8ca-4a1bb4af3162", "ab514914-cf8c-4a17-8f7e-ce22a1559200", "3072cc59-a8ff-47b6-94e2-0ee19b1743bb", "b90d0ae4-da2b-480d-a609-14e33b5c1f5a"],
  termination: ["40f3d87f-5c60-4992-9718-6dda6a19fa79", "bf0614af-05b9-4828-bc51-4e1aedfa2406", "c6ecb450-243a-4d3c-b8a0-04d7850c936f", "9a1f779b-5c3d-4cfa-bd93-0ba763a1b047", "f4a26469-3808-49ab-8977-e9bdfe9c3ed3", "b8ccbedb-f5ee-4d3e-9c45-b260734ecfe4"],
  optics: ["6fea8230-b2bd-495f-85b8-81f913684cad", "e495d90c-caa6-4670-83d8-b1bb186852b9", "ff8645cd-b3bc-4d0c-be71-e5e0a80ca023", "2dae6239-de2d-41d6-bc6a-8778789959eb", "4618683f-9481-4a88-89f6-5c6831798901"],
  equipment: ["8c04af50-108e-4f50-8e38-9463a566dffb", "72ffd4e2-4e2c-4592-aac0-6fc921f4e4ef", "0ddd4d93-fe3b-4ae4-b469-e9742c741fe4", "1c8e4a67-7bb3-48b1-97a0-d015e32829d1", "f0721e95-1e19-4a34-acfc-62a2ac2a73f4"],
  tools: ["7bb6c1b6-4449-464e-af01-907152fd90b5", "58d56a2b-920f-4b60-8e6c-b2040fdfca11", "31fb2236-2731-41eb-8a8b-f5c559b83c2e", "625d47a9-6d7d-4086-b538-606ca7adf2d6", "cd40ddc2-1f76-4d7a-aa02-dfe4a79017e0"],
};

export function classifyFiberProduct(product: Product): FiberCategoryId | null {
  const name = `${product.nameEn} ${product.nameAr}`.toLowerCase();
  if (/airfiber|optical mouse|wireless optical|hdmi|cat[5678]/.test(name)) return null;
  if (/otdr|fusion splicer|power meter|fiber cleaver|fiber stripper|fiber slitter|fiber optic cable cutter|visual fault locator|one.click cleaner|fiber laser|fiber tool kit|fiber wips|fiber cutter|fiber cable cutter|أداة شق غلاف كيبل الفايبر|قاشطة|كليفر|ماكنة لحام|مؤشر ليزر فايبر|قلم تنظيف فايبر|عدة فايبر|بور ميتر|باور ميتر/.test(name)) return "tools";
  if (/fiber patch cord|pc fiber|patch cord (?:lc|sc|fc)|fiber (?:lc|sc|fc)\s+(?:to|\d)|باتش كورد.*(?:lc|sc|fc)|باتش كورد.*فايبر/.test(name)) return "patch";
  if (/odf|fiber box|fiber termination box|fiber optic box|fiber patch panel|splice closure|splitter|pigtail|coupler|fiber adapter|fast connector|fiber face plate|splice cassette|splice protection|fiber optic hook|plastic clamp|هوك بلاستك فايبر|حامل كيبل ضوئي|كوبلر|سبليتر|بيك تيل|بكتيل|كلوجر|كاسيت لحام|فيس بليت فايبر|فيشة فاست كونكتر/.test(name)) return "termination";
  if (/fiber cable|fiber optic cable|\d+\s*(?:core|f)\s*(?:sm\s*)?fiber|fiber with power|كيبل فايبر|كيبل بلوستورم فايبر/.test(name)) return "cables";
  if (/sfp|transceiver|gbic|optic module|optical module|موديول/.test(name) && !/switch|سويتج|سويج|سويتش|router|راوتر/.test(name)) return "optics";
  if (/media converter|ont\b|onu\b|xpon|gpon|fiber router|راوتر ألياف ضوئية|راوتر ضوئي|تحويلة.*فايبر/.test(name)) return "equipment";
  if (/sfp|fiber|فايبر/.test(name) && /switch|سويتج|سويج|سويتش|router|راوتر/.test(name)) return "equipment";
  return null;
}

export function groupFiberProducts(products: Product[]): Record<FiberCategoryId, Product[]> {
  const groups = Object.fromEntries(fiberCategories.map(category => [category.id, []])) as Record<FiberCategoryId, Product[]>;
  const seen = new Set<string>();
  for (const product of products) {
    const category = classifyFiberProduct(product);
    if (!category) continue;
    const nameKey = (product.nameEn || product.nameAr).toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(nameKey)) continue;
    seen.add(nameKey);
    groups[category].push(product);
  }
  for (const category of fiberCategories) {
    const preferred = priorities[category.id] ?? [];
    groups[category.id].sort((a, b) => {
      const ai = preferred.indexOf(a.id), bi = preferred.indexOf(b.id);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
      return a.nameEn.localeCompare(b.nameEn, "en");
    });
  }
  return groups;
}
