import { Bell, BellOff, Check, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

function NotificationPushSwitch() {
  const { t } = useLanguage();
  const { supported, enabled, loading, enable, disable, permission } = usePushSubscription();

  if (!supported) return null;

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const res = await enable();
      if (res.ok) toast.success(t("notif_push_enabled"));
      else if (res.reason === "denied") toast.error(t("notif_push_denied"));
      else toast.error(t("notif_push_denied"));
    } else {
      await disable();
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b p-3 bg-muted/30">
      <div className="flex items-center gap-2 min-w-0">
        {enabled ? <Bell className="h-4 w-4 text-primary shrink-0" /> : <BellOff className="h-4 w-4 text-muted-foreground shrink-0" />}
        <div className="text-xs font-medium truncate">{t("notif_enable_push")}</div>
      </div>
      <Switch checked={enabled} onCheckedChange={handleToggle} disabled={loading || permission === "denied"} />
    </div>
  );
}

function TestNotificationButton() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user) return null;

  const isAr = language === "ar";

  const handleSend = async () => {
    setSending(true);
    const { error } = await supabase.from("notifications").insert({
      user_id: user.id,
      type: "test",
      title: isAr ? "إشعار تجريبي 🔔" : "Test notification 🔔",
      body: isAr
        ? "إذا وصلك هذا الإشعار على هاتفك، فإن الإعدادات تعمل بشكل صحيح."
        : "If you got this on your phone, push notifications are working.",
      link: "/",
    });
    setSending(false);
    if (error) {
      toast.error(isAr ? "فشل إرسال الإشعار" : "Failed to send notification");
    } else {
      toast.success(isAr ? "تم إرسال الإشعار التجريبي" : "Test notification sent");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b p-3">
      <div className="text-xs font-medium truncate">
        {isAr ? "اختبار الإشعارات" : "Test notifications"}
      </div>
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleSend} disabled={sending}>
        {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        {isAr ? "إرسال" : "Send"}
      </Button>
    </div>
  );
}

export function NotificationBell() {
  const { t } = useLanguage();
  const { items, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("notif_title")}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px] bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="font-semibold text-sm">{t("notif_title")}</div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
              <Check className="h-3 w-3" />{t("notif_mark_all_read")}
            </Button>
          )}
        </div>
        <NotificationPushSwitch />
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{t("notif_empty")}</div>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const content = (
                  <div className={`p-3 hover:bg-accent transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        {n.body && <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} to={n.link} onClick={() => markRead(n.id)}>{content}</Link>
                ) : (
                  <div key={n.id} onClick={() => markRead(n.id)} className="cursor-pointer">{content}</div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
