import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck } from "lucide-react";

type Tier = "dealer" | "wholesale" | "retail" | null | undefined;

const tierColor = (t: Tier) =>
  t === "dealer" ? "hsl(0 84% 55%)" : t === "wholesale" ? "hsl(45 100% 51%)" : "hsl(142 71% 45%)";

interface Props {
  src?: string | null;
  name?: string | null;
  tier?: Tier;
  verified?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { ring: "h-8 w-8 p-[2px]", inner: "h-7 w-7", badge: "h-3.5 w-3.5", badgeBox: "h-3.5 w-3.5", text: "text-[10px]" },
  md: { ring: "h-10 w-10 p-[2px]", inner: "h-9 w-9", badge: "h-4 w-4", badgeBox: "h-4 w-4", text: "text-xs" },
  lg: { ring: "h-12 w-12 p-[2px]", inner: "h-11 w-11", badge: "h-5 w-5", badgeBox: "h-5 w-5", text: "text-sm" },
};

export function TierAvatar({ src, name, tier, verified, size = "md" }: Props) {
  const s = sizes[size];
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${s.ring}`}
      style={{ backgroundColor: tierColor(tier) }}
    >
      <Avatar className={s.inner}>
        {src ? <AvatarImage src={src} alt={name ?? ""} /> : null}
        <AvatarFallback className={`bg-gradient-brand font-bold text-primary-foreground ${s.text}`}>
          {initial}
        </AvatarFallback>
      </Avatar>
      {verified && (
        <span
          aria-label="verified"
          className={`absolute -bottom-0.5 -end-0.5 inline-flex items-center justify-center rounded-full bg-background ${s.badgeBox}`}
        >
          <BadgeCheck
            className={s.badge}
            style={{ color: "hsl(210 100% 50%)", fill: "hsl(210 100% 50%)", stroke: "hsl(0 0% 100%)" }}
          />
        </span>
      )}
    </span>
  );
}
