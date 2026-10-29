import { useMemo, type HTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { prepareStorageHtml, resolvedStorageHtml } from "@/lib/storageHtml";
import { SIGNED_MEDIA_STALE_MS, SIGNED_MEDIA_REFRESH_MS } from "@/lib/storageSigning";
type Props = Omit<HTMLAttributes<HTMLElement>, "children" | "dangerouslySetInnerHTML"> & { html: string };
function SignedRichText({ html, ...props }: Props) {
  const { user, loading } = useAuth();const scope = user?.id ?? "anonymous";
  const { data } = useQuery({ queryKey: ["private-storage-html", scope, html], queryFn: () => resolvedStorageHtml(html, scope), enabled: !loading, staleTime: SIGNED_MEDIA_STALE_MS, gcTime: SIGNED_MEDIA_REFRESH_MS, refetchInterval: SIGNED_MEDIA_REFRESH_MS, retry: false });
  return <article {...props} dangerouslySetInnerHTML={{ __html: data ?? html }} />;
}
export function StorageRichText({ html, ...props }: Props) {
  const prepared = useMemo(() => prepareStorageHtml(html), [html]);
  return prepared.includes("data-ufuk-storage-reference") ? <SignedRichText {...props} html={prepared} /> : <article {...props} dangerouslySetInnerHTML={{ __html: prepared }} />;
}
