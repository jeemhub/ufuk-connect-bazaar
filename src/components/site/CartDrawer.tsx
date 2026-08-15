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
import { useAuth } from "@/auth/AuthProvider";
import { formatIqd } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateInvoicePdf, resolveEnglishNames, type InvoiceData } from "@/lib/invoice";

type Step = "cart" | "checkout" | "done";

export function CartDrawer() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { items, count, totalIqd, isOpen, setOpen, setQty, remove, clear } = useCart();
  const ar = lang === "ar";

  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [orderNo, setOrderNo] = useState<string>("");
  const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleCheckout = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error(ar ? "أدخل الاسم الكامل" : "Enter your full name");
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      toast.error(ar ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number");
      return;
    }
    if (!address.trim()) {
      toast.error(ar ? "أدخل عنوان التوصيل" : "Enter delivery address");
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_city: city.trim() || null,
          customer_address: address.trim(),
          notes: notes.trim() || null,
          total_iqd: totalIqd,
          status: "pending",
        })
        .select("id, order_no")
        .single();
      if (orderErr) throw orderErr;

      const itemsPayload = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price_iqd: i.priceIqd,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      const enNames = await resolveEnglishNames(items.map((i) => i.id));
      const invoice: InvoiceData = {
        orderNo: order.order_no,
        createdAt: new Date(),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerCity: city.trim() || null,
        customerAddress: address.trim(),
        notes: notes.trim() || null,
        items: items.map((i) => ({
          name: enNames[i.id] ?? i.name,
          quantity: i.quantity,
          unitPriceIqd: i.priceIqd,
        })),
        totalIqd,
      };
      setLastInvoice(invoice);
      setOrderNo(order.order_no);
      setStep("done");
      // Auto-download invoice PDF
      try {
        await generateInvoicePdf(invoice);
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
    }, 300);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <SheetContent side={ar ? "left" : "right"} className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
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
                    <li key={it.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="line-clamp-2 text-sm font-semibold">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{formatIqd(it.priceIqd)} {ar ? "د.ع" : "IQD"}</div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-border">
                            <button
                              type="button"
                              onClick={() => setQty(it.id, it.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                              aria-label="decrease"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm font-bold">{it.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQty(it.id, it.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                              aria-label="increase"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(it.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label="remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-end text-sm font-bold text-primary">
                        {formatIqd(it.priceIqd * it.quantity)}
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
                  <span className="text-xl font-extrabold text-primary">
                    {formatIqd(totalIqd)} <span className="text-xs">{ar ? "د.ع" : "IQD"}</span>
                  </span>
                </div>
                <Button className="w-full bg-gradient-brand text-base font-bold" size="lg" onClick={() => setStep("checkout")}>
                  {ar ? "إكمال الطلب" : "Proceed to checkout"}
                </Button>
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
                <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="co-phone">{ar ? "رقم الهاتف" : "Phone number"} *</Label>
                <Input id="co-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="07XXXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="co-city">{ar ? "المدينة" : "City"}</Label>
                <Input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" placeholder={ar ? "البصرة" : "Basra"} />
              </div>
              <div>
                <Label htmlFor="co-address">{ar ? "العنوان التفصيلي" : "Delivery address"} *</Label>
                <Textarea id="co-address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" rows={2} placeholder={ar ? "الحي، الشارع، أقرب نقطة دالة" : "Neighborhood, street, landmark"} />
              </div>
              <div>
                <Label htmlFor="co-notes">{ar ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Textarea id="co-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" rows={2} />
              </div>

              <Separator />
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">{ar ? "ملخص الطلب" : "Order summary"}</div>
                <ul className="space-y-1 text-sm">
                  {items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <span className="line-clamp-1">{it.name} × {it.quantity}</span>
                      <span className="font-semibold">{formatIqd(it.priceIqd * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span>{ar ? "الإجمالي" : "Total"}</span>
                  <span className="text-primary">{formatIqd(totalIqd)} {ar ? "د.ع" : "IQD"}</span>
                </div>
              </div>
            </div>
            <div className="border-t border-border bg-muted/30 px-5 py-4 flex gap-2">
              <Button variant="outline" onClick={() => setStep("cart")} disabled={submitting}>
                {ar ? "رجوع" : "Back"}
              </Button>
              <Button className="flex-1 bg-gradient-brand font-bold" onClick={handleCheckout} disabled={submitting}>
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
              {ar ? "تم تنزيل فاتورة PDF تلقائيًا. سنتواصل معك قريبًا." : "Your PDF invoice was downloaded. We'll contact you shortly."}
            </p>
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
