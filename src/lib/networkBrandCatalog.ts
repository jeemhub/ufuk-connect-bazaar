import type { Product } from "@/data/mockData";

export type NetworkBrand = "mikrotik" | "huawei";
export type NetworkGroup = { id: string; title: { ar: string; en: string }; description: { ar: string; en: string }; code: string };

export const networkBrandGroups: Record<NetworkBrand, NetworkGroup[]> = {
  mikrotik: [
    { id: "routing", code: "ROUTING", title: { ar: "التوجيه وإدارة الشبكة", en: "Routing & network control" }, description: { ar: "راوترات وCloud Core Router للمكاتب والشبكات الأكبر، بحسب الموديل المتوفر.", en: "Routers and Cloud Core Router devices for offices and larger networks, depending on the model." } },
    { id: "switching", code: "SWITCHING", title: { ar: "السويتشات", en: "Switching" }, description: { ar: "موديلات CRS لتوزيع الشبكة وربط منافذ الإيثرنت وSFP حسب الجهاز.", en: "CRS models for Ethernet distribution and SFP links, depending on the device." } },
    { id: "wifi", code: "WI-FI", title: { ar: "Wi‑Fi ونقاط الوصول", en: "Wi-Fi & access points" }, description: { ar: "أجهزة hAP وcAP لتغطية المنازل والمكاتب ومساحات العمل.", en: "hAP and cAP devices for homes, offices and workspaces." } },
    { id: "wireless", code: "OUTDOOR", title: { ar: "الربط اللاسلكي الخارجي", en: "Outdoor wireless links" }, description: { ar: "أجهزة Groove وBaseBox وSXT وLDF وNetMetal للتركيبات الخارجية.", en: "Groove, BaseBox, SXT, LDF and NetMetal devices for outdoor installations." } },
    { id: "modules", code: "MODULES", title: { ar: "الوحدات والملحقات", en: "Modules & accessories" }, description: { ar: "وحدات ربط إضافية متاحة ضمن كتالوج MikroTik.", en: "Additional link modules available in the MikroTik catalog." } },
  ],
  huawei: [
    { id: "gateways", code: "GATEWAYS", title: { ar: "البوابات وأجهزة ONT", en: "Gateways & ONT" }, description: { ar: "بوابات شبكة وأجهزة طرفية للفايبر ضمن تشكيلة Huawei eKit.", en: "Network gateways and fiber terminals in the Huawei eKit range." } },
    { id: "switches", code: "SWITCHING", title: { ar: "سويتشات الشبكة", en: "Network switches" }, description: { ar: "خيارات S110 وS310 وS620 وغيرها لتوزيع المنافذ والطاقة والربط الضوئي.", en: "S110, S310, S620 and other options for ports, power and optical links." } },
    { id: "access", code: "WIRELESS", title: { ar: "نقاط الوصول اللاسلكية", en: "Wireless access points" }, description: { ar: "نقاط وصول داخلية وخارجية وبأشكال تركيب مختلفة حسب الموديل.", en: "Indoor and outdoor access points with different mounting styles by model." } },
    { id: "controllers", code: "CONTROL", title: { ar: "إدارة الشبكة اللاسلكية", en: "Wireless controllers" }, description: { ar: "متحكمات AC650 لإدارة نقاط الوصول في المواقع التي تتطلب إدارة مركزية.", en: "AC650 controllers for sites that call for central access-point management." } },
    { id: "optics", code: "OPTICAL", title: { ar: "وحدات الربط الضوئي", en: "Optical modules" }, description: { ar: "وحدات SFP وBiDi المتوفرة في كتالوج Huawei eKit.", en: "SFP and BiDi modules available in the Huawei eKit catalog." } },
  ],
};

const priority: Record<NetworkBrand, string[]> = {
  mikrotik: ["6aa61b02-e500-4c69-a7ee-fb896611da23", "92365127-732b-48f0-9636-a9cdf28c7580", "9b216a54-e471-4d11-82e7-65b72505ae2a", "34fa54b0-241b-4aac-a624-1933f8458a19", "f6ec6d17-b647-414e-a768-a7949c824bc3", "790efc47-71c5-4d0d-8e14-312522874d08", "40a750f5-2b70-4edc-8823-a791740bcb03"],
  huawei: ["c60039ae-e7f4-4ddc-91b4-58892cd1dcb5", "72ffd4e2-4e2c-4592-aac0-6fc921f4e4ef", "609330ff-a25f-4eb9-bc4e-292390aebb41", "d77bf66e-e8d3-4daa-adde-9b785238799c", "e4869e29-bec3-4239-873b-df76b61951ee", "f52be3f7-2150-41ac-a56c-4048843eeef2"],
};

function productGroup(brand: NetworkBrand, name: string): string | null {
  if (brand === "mikrotik") {
    if (/adapter|dapter|extension strips/i.test(name)) return null;
    if (/sfp|module/i.test(name) && !/router|switch|crs|ccr/i.test(name)) return "modules";
    if (/groove|basebox|sxt|ldf|netmetal/i.test(name)) return "wireless";
    if (/\bhap\b|\bcap\b|access point/i.test(name)) return "wifi";
    if (/\bccr\b|\bccr\d|\brb5009|\brb951|router/i.test(name)) return "routing";
    if (/\bcrs\d|switch/i.test(name)) return "switching";
    return null;
  }
  if (/\bsfp\b|module|bidi/i.test(name) && !/switch|gateway|router/i.test(name)) return "optics";
  if (/\bac650\b|controller/i.test(name)) return "controllers";
  if (/\bap\d|access point/i.test(name)) return "access";
  if (/\bont\b|gpon|gateway|router|\bar280\b/i.test(name)) return "gateways";
  if (/switch|\bs\d{3}\b|\bs\d{3}[- ]/i.test(name)) return "switches";
  return null;
}

export function groupNetworkBrandProducts(products: Product[], brand: NetworkBrand): Record<string, Product[]> {
  const groups = Object.fromEntries(networkBrandGroups[brand].map(group => [group.id, []])) as Record<string, Product[]>;
  const seen = new Set<string>();
  for (const product of products) {
    if ((product.brand || "").toLowerCase() !== brand) continue;
    const key = product.nameEn.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    const group = productGroup(brand, `${product.nameEn} ${product.nameAr}`);
    if (!group) continue;
    seen.add(key);
    groups[group].push(product);
  }
  for (const group of networkBrandGroups[brand]) {
    groups[group.id].sort((a, b) => {
      const ai = priority[brand].indexOf(a.id), bi = priority[brand].indexOf(b.id);
      if (ai !== -1 || bi !== -1) return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
      return a.nameEn.localeCompare(b.nameEn, "en");
    });
  }
  return groups;
}
