export type Brand = "MikroTik" | "Ruijie" | "Must" | "Ubiquiti" | "TP-Link";
export type CategoryKey = "networking" | "solar" | "ups" | "accessories";

export interface Product {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  descAr?: string;
  descEn?: string;
  brand: Brand;
  category: CategoryKey;
  subcategory: string;
  priceIqd: number;
  stock: number;
  image: string;
  datasheetUrl?: string;
  datasheetName?: string;
}

export const categories: { key: CategoryKey; ar: string; en: string; subs: { ar: string; en: string }[] }[] = [
  {
    key: "networking",
    ar: "الشبكات",
    en: "Networking",
    subs: [
      { ar: "راوترات", en: "Routers" },
      { ar: "سويتشات", en: "Switches" },
      { ar: "نقاط وصول", en: "Access Points" },
    ],
  },
  {
    key: "solar",
    ar: "الطاقة الشمسية",
    en: "Solar Energy",
    subs: [
      { ar: "ألواح شمسية", en: "Solar Panels" },
      { ar: "إنفرترات", en: "Inverters" },
      { ar: "بطاريات", en: "Batteries" },
    ],
  },
  {
    key: "ups",
    ar: "أنظمة UPS",
    en: "UPS Systems",
    subs: [
      { ar: "UPS منزلي", en: "Home UPS" },
      { ar: "UPS مؤسسي", en: "Enterprise UPS" },
    ],
  },
  {
    key: "accessories",
    ar: "ملحقات",
    en: "Accessories",
    subs: [
      { ar: "كابلات", en: "Cables" },
      { ar: "مهايئات طاقة", en: "PoE Adapters" },
    ],
  },
];

export const products: Product[] = [
  {
    id: "p1", sku: "MK-CCR2004", nameAr: "راوتر ميكروتك CCR2004-1G-12S+2XS",
    nameEn: "MikroTik CCR2004-1G-12S+2XS Router", brand: "MikroTik", category: "networking",
    subcategory: "Routers", priceIqd: 1850000, stock: 14,
    image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80",
  },
  {
    id: "p2", sku: "MK-CRS328", nameAr: "سويتش ميكروتك CRS328-24P-4S+",
    nameEn: "MikroTik CRS328-24P-4S+ Switch", brand: "MikroTik", category: "networking",
    subcategory: "Switches", priceIqd: 980000, stock: 7,
    image: "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=400&q=80",
  },
  {
    id: "p3", sku: "RJ-RG-AP840", nameAr: "نقطة وصول روجي RG-AP840-I",
    nameEn: "Ruijie RG-AP840-I Access Point", brand: "Ruijie", category: "networking",
    subcategory: "Access Points", priceIqd: 540000, stock: 0,
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80",
  },
  {
    id: "p4", sku: "MUST-PV1800", nameAr: "إنفرتر مَست PV1800 5KW",
    nameEn: "Must PV1800 5KW Inverter", brand: "Must", category: "solar",
    subcategory: "Inverters", priceIqd: 1450000, stock: 22,
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80",
  },
  {
    id: "p5", sku: "MUST-PANEL-550", nameAr: "لوح شمسي 550W مونوكريستال",
    nameEn: "Solar Panel 550W Monocrystalline", brand: "Must", category: "solar",
    subcategory: "Panels", priceIqd: 165000, stock: 3,
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80",
  },
  {
    id: "p6", sku: "MUST-UPS-3K", nameAr: "UPS مَست 3KVA Online",
    nameEn: "Must 3KVA Online UPS", brand: "Must", category: "ups",
    subcategory: "Enterprise UPS", priceIqd: 720000, stock: 11,
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80",
  },
  {
    id: "p7", sku: "RJ-RG-S2910", nameAr: "سويتش روجي S2910-24GT4XS-E",
    nameEn: "Ruijie S2910-24GT4XS-E Switch", brand: "Ruijie", category: "networking",
    subcategory: "Switches", priceIqd: 880000, stock: 9,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",
  },
  {
    id: "p8", sku: "MK-HAP-AX3", nameAr: "ميكروتك hAP ax³",
    nameEn: "MikroTik hAP ax³", brand: "MikroTik", category: "networking",
    subcategory: "Routers", priceIqd: 285000, stock: 32,
    image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80",
  },
];

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";

export interface Order {
  id: string;
  customerName: string;
  customerCity: string;
  date: string;
  totalIqd: number;
  status: OrderStatus;
  items: number;
}

export const orders: Order[] = [
  { id: "ORD-10421", customerName: "علي حسين", customerCity: "البصرة", date: "2026-04-22", totalIqd: 2380000, status: "pending", items: 2 },
  { id: "ORD-10420", customerName: "Sara Al-Khafaji", customerCity: "بغداد", date: "2026-04-22", totalIqd: 540000, status: "processing", items: 1 },
  { id: "ORD-10419", customerName: "محمد كاظم", customerCity: "النجف", date: "2026-04-21", totalIqd: 1450000, status: "shipped", items: 1 },
  { id: "ORD-10418", customerName: "Fatima Hadi", customerCity: "أربيل", date: "2026-04-20", totalIqd: 880000, status: "delivered", items: 3 },
  { id: "ORD-10417", customerName: "حيدر عبد الله", customerCity: "الموصل", date: "2026-04-20", totalIqd: 165000, status: "canceled", items: 1 },
  { id: "ORD-10416", customerName: "Noor Jasim", customerCity: "البصرة", date: "2026-04-19", totalIqd: 720000, status: "delivered", items: 2 },
  { id: "ORD-10415", customerName: "زينب علي", customerCity: "بغداد", date: "2026-04-19", totalIqd: 285000, status: "processing", items: 1 },
  { id: "ORD-10414", customerName: "Omar Saad", customerCity: "الديوانية", date: "2026-04-18", totalIqd: 1850000, status: "delivered", items: 1 },
];

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  spentIqd: number;
  joined: string;
}

export const customers: Customer[] = [
  { id: "u1", name: "علي حسين", email: "ali.h@example.com", phone: "+9647701234567", city: "البصرة", orders: 6, spentIqd: 8450000, joined: "2024-08-12" },
  { id: "u2", name: "Sara Al-Khafaji", email: "sara@example.com", phone: "+9647811234567", city: "بغداد", orders: 3, spentIqd: 1620000, joined: "2025-01-04" },
  { id: "u3", name: "محمد كاظم", email: "m.kadhim@example.com", phone: "+9647901234567", city: "النجف", orders: 9, spentIqd: 12300000, joined: "2024-03-22" },
  { id: "u4", name: "Fatima Hadi", email: "fatima@example.com", phone: "+9647501234567", city: "أربيل", orders: 2, spentIqd: 880000, joined: "2025-09-18" },
  { id: "u5", name: "حيدر عبد الله", email: "haider@example.com", phone: "+9647601234567", city: "الموصل", orders: 1, spentIqd: 165000, joined: "2026-02-01" },
];

export const salesSeries = [
  { day: "السبت", en: "Sat", value: 1.8 },
  { day: "الأحد", en: "Sun", value: 2.4 },
  { day: "الإثنين", en: "Mon", value: 3.1 },
  { day: "الثلاثاء", en: "Tue", value: 2.6 },
  { day: "الأربعاء", en: "Wed", value: 3.8 },
  { day: "الخميس", en: "Thu", value: 4.2 },
  { day: "الجمعة", en: "Fri", value: 3.4 },
];

export const formatIqd = (n: number) => new Intl.NumberFormat("en-US").format(n);
