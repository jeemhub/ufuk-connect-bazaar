import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";

type Tier = "admin" | "dealer" | "wholesale" | "retail" | null | undefined;

const tierColor = (t: Tier) =>
  t === "admin"
    ? "hsl(45 90% 52%)"
    : t === "dealer"
    ? "hsl(0 84% 55%)"
    : t === "wholesale"
    ? "hsl(45 100% 51%)"
    : "hsl(142 71% 45%)";

interface Props {
  src?: string | null;
  name?: string | null;
  tier?: Tier;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { ring: "h-8 w-8 p-[2px]", inner: "h-7 w-7", badge: "h-3.5 w-3.5", badgeBox: "h-3.5 w-3.5", text: "text-[10px]", label: "text-[8px] px-1 py-[1px] -bottom-1.5" },
  md: { ring: "h-10 w-10 p-[2px]", inner: "h-9 w-9", badge: "h-4 w-4", badgeBox: "h-4 w-4", text: "text-xs", label: "text-[9px] px-1.5 py-[1px] -bottom-2" },
  lg: { ring: "h-12 w-12 p-[2px]", inner: "h-11 w-11", badge: "h-5 w-5", badgeBox: "h-5 w-5", text: "text-sm", label: "text-[10px] px-2 py-[2px] -bottom-2.5" },
};

export function TierAvatar({ src, name, tier, verified, size = "md" }: Props) {
  const s = sizes[size];
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const isAdmin = tier === "admin";
  const ringStyle = isAdmin
    ? {
        background:
          "linear-gradient(135deg, hsl(45 95% 60%) 0%, hsl(40 100% 50%) 35%, hsl(35 90% 45%) 70%, hsl(45 95% 65%) 100%)",
        boxShadow: "0 0 0 1px hsl(40 80% 35%), 0 0 10px hsl(45 95% 55% / 0.55)",
      }
    : { backgroundColor: tierColor(tier) };

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${s.ring} ${isAdmin ? "mb-2" : ""}`}
      style={ringStyle}
    >
      <Avatar className={s.inner}>
        {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
        <AvatarFallback className={`bg-gradient-brand font-bold text-primary-foreground ${s.text}`}>
          {initial}
        </AvatarFallback>
      </Avatar>
      {(verified || isAdmin) && (
        <span
          aria-label="verified"
          className={`absolute -bottom-0.5 -end-0.5 inline-flex items-center justify-center rounded-full bg-background ${s.badgeBox}`}
        >
          <BadgeCheck
            className={s.badge}
            style={{
              color: isAdmin ? "hsl(45 95% 50%)" : "hsl(210 100% 50%)",
              fill: isAdmin ? "hsl(45 95% 50%)" : "hsl(210 100% 50%)",
              stroke: "hsl(0 0% 100%)",
            }}
          />
        </span>
      )}
      {isAdmin && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 ${s.label} rounded-full font-bold uppercase tracking-wider text-black whitespace-nowrap`}
          style={{
            background: "linear-gradient(135deg, hsl(45 95% 65%), hsl(40 100% 50%))",
            boxShadow: "0 1px 4px hsl(40 80% 30% / 0.5)",
          }}
        >
          Admin
        </span>
      )}
    </span>
  );
}
