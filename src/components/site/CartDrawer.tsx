import { useSelection } from "@/catalog/SelectionContext";
import { useCartPrices } from "@/hooks/useCartPrices";
import { Link } from "react-router-dom";
import { useCommerceSettings } from "@/hooks/useCommerceSettings";
import { normalizePhone, validIraqiPhone, unstablePriceMessage } from "@/lib/catalog";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, CheckCircle2, FileDown } from "lucide-react";
import { useCart } from "@/cart/CartContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateInvoicePdf, resolveEnglishNames, type InvoiceData } from "@/lib/invoice";

type Step = "cart" | "checkout" | "done";

export function CartDrawer() {
  const { lang } = useLanguage();
  const { items, count, isOpen, setOpen, setQty, remove, clear } = useCart();
  const { setQuoteQty } = useSelection();
  const ar = lang === "ar";
  const { prices, loading: pricesLoading } = useCartPrices(items.map(item => item.id), isOpen);
  const pricesUnavailable = pricesLoading || items.some(item => !prices[item.id] || prices[item.id].unstable || prices[item.id].price <= 0);
  const totalIqd = items.reduce((sum, item) => sum + (prices[item.id]?.price ?? 0) * item.quantity, 0);
  const priceText = (id: string, quantity = 1) => pricesLoading
    ? (ar ? "جارٍ التحقق من السعر…" : "Checking price…")
    : prices[id]?.unstable ? unstablePriceMessage(lang)
    : !prices[id] || prices[id].price <= 0 ? (ar ? "تواصل مع الشركة لتأكيد السعر" : "Contact the company to confirm the price")
    : `${formatIqd(prices[id].price * quantity)} ${ar ? "د.ع" : "IQD"}`;
  const { settings } = useCommerceSettings();

  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [orderNo, setOrderNo] = useState<string>("");
  const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const zone = settings.zones.find(z => z.enabled && z.city === city.trim());
  const shippingFee = zone?.fee ?? null;
  const payableTotal = totalIqd + (shippingFee ?? 0);

  const handleCheckout = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error(ar ? "أدخل الاسم الكامل" : "Enter your full name");
      return;
    }
    if (!validIraqiPhone(phone)) {
      toast.error(ar ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number");
      return;
    }
    if (!address.trim()) {
      toast.error(ar ? "أدخل عنوان التوصيل" : "Enter delivery address");
      return;
    }
    if (items.length === 0 || pricesUnavailable) return;

    setSubmitting(true);
    try {
      const { data, error: orderErr } = await supabase.rpc("place_order", {
        p_name: name.trim(), p_phone: normalizePhone(phone), p_city: city.trim(),
        p_address: address.trim(), p_notes: notes.trim(),
        p_items: items.map(i => ({ id: i.id, quantity: i.quantity })),
      });
      if (orderErr) throw orderErr;
      const order = data as unknown as {
        order_no: string; total_iqd: number; created_at: string; notes: string;
        items: { id: string; name: string; quantity: number; unitPriceIqd: number }[];
      };
      if (!order?.order_no || !order.items?.length) throw new Error("Invalid order response");

      const enNames = await resolveEnglishNames(items.map((i) => i.id));
      const invoice: InvoiceData = {
        orderNo: order.order_no,
        createdAt: new Date(order.created_at),
        customerName: name.trim(),
        customerPhone: normalizePhone(phone),
        customerCity: city.trim() || null,
        customerAddress: address.trim(),
        notes: order.notes,
        items: order.items.map((i) => ({
          name: enNames[i.id] ?? i.name,
          quantity: i.quantity,
          unitPriceIqd: i.unitPriceIqd,
        })),
        totalIqd: order.total_iqd,
      };
      setLastInvoice(invoice);
      setOrderNo(order.order_no);
      setStep("done");
      // Auto-download invoice PDF
      try {
        await generateInvoicePdf(invoice);
        setPdfDownloaded(true);
      } catch (pdfErr) {
        console.error("PDF generation failed", pdfErr);
      }
      clear();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error((ar ? "تعذّر إرسال الطلب: " : "Failed to submit order: ") + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setStep("cart");
      setOrderNo("");
      setLastInvoice(null);
      setPdfDownloaded(false);
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <SheetContent dir={ar ? "rtl" : "ltr"} side={ar ? "left" : "right"} className="flex w-[100vw] max-w-full flex-col gap-0 overflow-x-hidden p-0 sm:max-w-md" closeLabel={ar ? "إغلاق" : "Close"}>
        <SheetHeader className="border-b border-border px-5 py-4 pe-14">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 shrink-0 text-primary" />
            <span>
              {step === "checkout"
                ? ar ? "إكمال الطلب" : "Checkout"
                : step === "done"
                ? ar ? "تم استلام طلبك" : "Order received"
                : ar ? "سلة المشتريات" : "Cart"}
            </span>
            {step === "cart" && (
              <span className="text-sm font-semibold text-muted-foreground">
                {count}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* CART STEP */}
        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <ShoppingBag className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold">{ar ? "سلتك فارغة" : "Your cart is empty"}</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((it) => (
                    <li key={it.id} className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="line-clamp-2 text-sm font-semibold">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{priceText(it.id)}</div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-border">
                            <button
                              type="button"
                              onClick={() => setQty(it.id, it.quantity - 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
                              aria-label={ar ? "تقليل الكمية" : "Decrease quantity"}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm font-bold">{it.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQty(it.id, it.quantity + 1)}
                              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
                              aria-label={ar ? "زيادة الكمية" : "Increase quantity"}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(it.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={ar ? "إزالة المنتج" : "Remove product"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="shrink-0 whitespace-nowrap text-end text-sm font-bold text-primary">
                        {priceText(it.id, it.quantity)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-border bg-muted/30 px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">{ar ? "الإجمالي" : "Total"}</span>
                  <span dir="ltr" className="shrink-0 whitespace-nowrap text-xl font-extrabold text-primary">
                    {pricesUnavailable ? (ar ? "يُؤكَّد مع الشركة" : "Confirm with company") : `${formatIqd(totalIqd)} ${ar ? "د.ع" : "IQD"}`}
                  </span>
                </div>
                <Button className="w-full bg-gradient-brand text-base font-bold" size="lg" disabled={pricesUnavailable} onClick={() => setStep("checkout")}>
                  {ar ? "إكمال الطلب" : "Proceed to checkout"}
                </Button>
                {pricesUnavailable && !pricesLoading && <Button asChild variant="outline" className="mt-2 w-full"><Link to="/quote" onClick={() => { items.forEach(item => setQuoteQty(item.id, item.quantity)); close(); }}>{ar ? "تواصل لطلب عرض سعر" : "Request a price quote"}</Link></Button>}
              </div>
            )}
          </>
        )}

        {/* CHECKOUT STEP */}
        {step === "checkout" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <Label htmlFor="co-name">{ar ? "الاسم الكامل" : "Full name"} *</Label>
                <Input id="co-name" maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="co-phone">{ar ? "رقم الهاتف" : "Phone number"} *</Label>
                <Input id="co-phone" dir="ltr" autoComplete="tel" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="07XXXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="co-city">{ar ? "المدينة" : "City"}</Label>
                <Input id="co-city" list="delivery-cities" maxLength={120} value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" placeholder={ar ? "البصرة" : "Basra"} />
                <datalist id="delivery-cities">{settings.zones.filter(z=>z.enabled).map(z=><option key={z.city} value={z.city} />)}</datalist>
              </div>
              <div>
                <Label htmlFor="co-address">{ar ? "العنوان التفصيلي" : "Delivery address"} *</Label>
                <Textarea id="co-address" maxLength={500} autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" rows={2} placeholder={ar ? "الحي، الشارع، أقرب نقطة دالة" : "Neighborhood, street, landmark"} />
              </div>
              <div>
                <Label htmlFor="co-notes">{ar ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Textarea id="co-notes" maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" rows={2} />
              </div>

              <section className="rounded-xl border bg-muted/30 p-3 text-sm leading-7">
                <h3 className="font-bold">{ar ? "الدفع والتوصيل" : "Payment and delivery"}</h3>
                <p>{settings.payments || (ar ? "تُؤكَّد طريقة الدفع مع المبيعات قبل إتمام الطلب." : "Payment method is confirmed with sales before completion.")}</p>
                <p>{zone?.duration || settings.delivery || (ar ? "تُؤكَّد مدة التوصيل مع المبيعات." : "Confirm delivery time with sales.")}</p>
                <p>{ar ? "تكلفة التوصيل: " : "Delivery fee: "}{shippingFee === null ? (ar ? "تُحدَّد مع المبيعات؛ الإجمالي الحالي لا يشمل التوصيل." : "Confirmed with sales; current total excludes delivery.") : `${formatIqd(shippingFee)} IQD`}</p>
                <Link to="/policies" onClick={close} className="text-primary underline">{ar ? "الضمان وشروط التوصيل" : "Warranty and delivery terms"}</Link>
              </section>
              <Separator />
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">{ar ? "ملخص الطلب" : "Order summary"}</div>
                <ul className="space-y-1 text-sm">
                  {items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <span className="line-clamp-1">{it.name} × {it.quantity}</span>
                      <span dir="ltr" className="shrink-0 whitespace-nowrap font-semibold">{priceText(it.id, it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span>{ar ? "الإجمالي" : "Total"}</span>
                  <span className="text-primary">{pricesUnavailable ? (ar ? "يُؤكَّد مع الشركة" : "Confirm with company") : `${formatIqd(payableTotal)} ${ar ? "د.ع" : "IQD"}`}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-border bg-muted/30 px-5 py-4 flex gap-2">
              <Button variant="outline" onClick={() => setStep("cart")} disabled={submitting}>
                {ar ? "رجوع" : "Back"}
              </Button>
              <Button className="flex-1 bg-gradient-brand font-bold" onClick={handleCheckout} disabled={submitting || pricesUnavailable}>
                {submitting ? (ar ? "جاري الإرسال..." : "Submitting...") : (ar ? "تأكيد الطلب" : "Confirm order")}
              </Button>
            </div>
          </>
        )}

        {/* DONE STEP */}
        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-xl font-extrabold">{ar ? "تم استلام طلبك بنجاح!" : "Order placed successfully!"}</h3>
            <p className="text-sm text-muted-foreground">
              {ar ? "رقم الطلب" : "Order number"}: <span className="font-mono font-bold text-foreground">{orderNo}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {pdfDownloaded ? (ar ? "تم تنزيل ملف الطلب PDF. سنتواصل معك للتأكيد." : "Order PDF downloaded. We'll contact you to confirm.") : (ar ? "تم حفظ طلبك. يمكنك تنزيل ملف PDF من الزر أدناه." : "Order saved. Download the PDF using the button below.")}
            </p>
            <Button asChild variant="outline"><Link to="/track-order" onClick={close}>{ar ? "تتبع الطلب" : "Track order"}</Link></Button>
            {lastInvoice && (
              <Button
                variant="outline"
                className="mt-2 w-full gap-2 font-bold"
                onClick={() => generateInvoicePdf(lastInvoice)}
              >
                <FileDown className="h-4 w-4" />
                {ar ? "تنزيل الفاتورة (PDF)" : "Download invoice (PDF)"}
              </Button>
            )}
            <Button className="mt-2 w-full bg-gradient-brand font-bold" onClick={close}>
              {ar ? "تم" : "Done"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
