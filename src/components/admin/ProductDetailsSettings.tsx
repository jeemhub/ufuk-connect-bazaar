import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProducts } from "@/hooks/useProducts";
import { useProductDetails, safeHttps } from "@/hooks/useCommerceSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ProductDetailsSettings() {
  const {products}=useProducts({activeOnly:true}); const {data:details={},isLoading,isError}=useProductDetails(); const cache=useQueryClient(); const {lang}=useLanguage(); const ar=lang==="ar";
  const [id,setId]=useState(""); const [specs,setSpecs]=useState(""); const [warranty,setWarranty]=useState(""); const [manual,setManual]=useState(""); const [busy,setBusy]=useState(false);
  function select(value:string){setId(value);const d=details[value] || {};setSpecs(Object.entries(d.specs || {}).map(([k,v])=>`${k}: ${v}`).join("\n"));setWarranty(d.warranty || "");setManual(d.manualUrl || "");}
  async function save(e:React.FormEvent){e.preventDefault(); if(!id)return; if(manual && !safeHttps(manual)){toast.error(ar ? "أدخل رابط HTTPS صحيحًا للدليل" : "Enter a valid HTTPS manual URL");return;}
    const lines=specs.split("\n").filter(x=>x.trim()); if(lines.some(x=>x.indexOf(":")<1 || !x.slice(x.indexOf(":")+1).trim())){toast.error(ar ? "كل مواصفة بصيغة الاسم: القيمة" : "Use name: value for each specification");return;}
    setBusy(true);const next={...details,[id]:{specs:Object.fromEntries(lines.map(x=>[({"عدد المنافذ":"ports","القدرة":"power","السعة":"capacity","سعة البطارية":"capacity","جيل Wi-Fi":"wifi","PoE":"poe"} as Record<string,string>)[x.slice(0,x.indexOf(":")).trim()] || x.slice(0,x.indexOf(":")).trim(),x.slice(x.indexOf(":")+1).trim()])),warranty,manualUrl:manual}};
    const {error}=await supabase.from("site_pages").upsert({key:"product-details",title_ar:"تفاصيل المنتجات",title_en:"Product details",content_ar:JSON.stringify(next)},{onConflict:"key"});setBusy(false);
    if(error){toast.error(ar ? "تعذر الحفظ" : "Save failed");return;}await cache.invalidateQueries({queryKey:["product-details"]});toast.success(ar ? "تم حفظ تفاصيل المنتج" : "Product details saved");}
  return <form onSubmit={save} className="surface-card space-y-4 p-5"><h2 className="text-xl font-bold">{ar ? "المواصفات والضمان ودليل الاستخدام لكل منتج" : "Product specifications, warranty and manual"}</h2><div><Label htmlFor="details-product">{ar ? "المنتج" : "Product"}</Label><select id="details-product" className="mt-2 w-full rounded-md border bg-background p-3" value={id} onChange={e=>select(e.target.value)} disabled={isLoading || isError}><option value="">{ar ? "اختر منتجًا" : "Choose a product"}</option>{products.map(p=><option key={p.id} value={p.id}>{ar ? p.nameAr : p.nameEn}</option>)}</select></div><div><Label htmlFor="details-specs">{ar ? "مواصفة في كل سطر: الاسم: القيمة" : "One specification per line: name: value"}</Label><Textarea id="details-specs" rows={5} value={specs} onChange={e=>setSpecs(e.target.value)} placeholder={ar ? "عدد المنافذ: 16" : "Ports: 16"} /></div><div><Label htmlFor="details-warranty">{ar ? "ضمان المنتج" : "Product warranty"}</Label><Textarea id="details-warranty" value={warranty} onChange={e=>setWarranty(e.target.value)} /></div><div><Label htmlFor="details-manual">{ar ? "رابط دليل الاستخدام HTTPS" : "Manual HTTPS URL"}</Label><Input id="details-manual" type="url" value={manual} onChange={e=>setManual(e.target.value)} /></div><Button disabled={!id || busy || isLoading || isError} type="submit">{ar ? "حفظ تفاصيل المنتج" : "Save product details"}</Button></form>;
}
