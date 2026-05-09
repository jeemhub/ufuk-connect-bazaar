import { useEffect, useState } from "react";
import { Mail, Phone, Building2, Loader2, Paperclip } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Quote {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  product_name: string | null;
  message: string | null;
  status: string;
  created_at: string;
  attachments: string[] | null;
}

export default function Quotes() {
  const { t, lang } = useLanguage();
  const [list, setList] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t("quotes_title")} · ${t("brand")}`;
    supabase.from("quote_requests").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setList((data as Quote[]) || []); setLoading(false); });
  }, [t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("quotes_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("quotes_subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="me-2 h-4 w-4 animate-spin" /> {t("auth_loading")}</div>
      ) : list.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t("no_products")}</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{q.full_name}</CardTitle>
                    <CardDescription>{new Date(q.created_at).toLocaleString(lang === "ar" ? "ar-IQ-u-nu-latn" : "en-US")}</CardDescription>
                  </div>
                  <Badge variant={q.status === "new" ? "default" : "secondary"}>
                    {q.status === "new" ? t("quote_status_new") : q.status === "contacted" ? t("quote_status_contacted") : t("quote_status_closed")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <a href={`tel:${q.phone}`} className="font-medium hover:text-primary">{q.phone}</a></div>
                {q.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${q.email}`} className="font-medium hover:text-primary">{q.email}</a></div>}
                {q.company && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {q.company}</div>}
                {q.product_name && <div className="rounded-md bg-secondary/60 p-2 text-xs"><span className="font-semibold">{t("nav_products")}:</span> {q.product_name}</div>}
                {q.message && <p className="rounded-md border border-border p-3 text-sm text-foreground/80">{q.message}</p>}
                {q.attachments && q.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border bg-secondary/40 px-2 py-1 text-xs hover:bg-secondary"
                      >
                        <Paperclip className="h-3 w-3" />
                        {`#${i + 1}`}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
