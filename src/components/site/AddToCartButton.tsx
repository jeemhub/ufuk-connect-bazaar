import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/cart/CartContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import type { Product } from "@/data/mockData";
import { toast } from "sonner";

interface Props {
  product: Product;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
  fullWidth?: boolean;
}

export function AddToCartButton({ product, size = "default", variant = "default", className, fullWidth }: Props) {
  const { add, setOpen } = useCart();
  const { lang } = useLanguage();
  const { pricingTier } = useAuth();
  const ar = lang === "ar";
  const disabled = product.stock <= 0;

  const price =
    pricingTier === "dealer" && product.priceDealerIqd
      ? product.priceDealerIqd
      : pricingTier === "wholesale" && product.priceWholesaleIqd
      ? product.priceWholesaleIqd
      : product.priceIqd;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    add({
      id: product.id,
      name: ar ? product.nameAr : product.nameEn,
      image: product.image,
      priceIqd: price,
    });
    toast.success(ar ? "تمت الإضافة إلى السلة" : "Added to cart", {
      action: {
        label: ar ? "عرض السلة" : "View cart",
        onClick: () => setOpen(true),
      },
    });
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleAdd}
      disabled={disabled}
      className={`${fullWidth ? "w-full" : ""} ${variant === "default" ? "bg-gradient-brand font-bold" : ""} ${className ?? ""}`}
    >
      <ShoppingCart className="me-2 h-4 w-4" />
      {disabled ? (ar ? "نافد" : "Out of stock") : (ar ? "أضف للسلة" : "Add to cart")}
    </Button>
  );
}
