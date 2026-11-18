import { forwardRef, useCallback, useEffect, useState, type ImgHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { isApplicationStorage } from "@/lib/storageReferences";
import { signStorageReference, mediaTiming } from "@/lib/storageSigning";

export function useSignedStorageUrl(value: string, enabled = true) {
  const { user, loading } = useAuth();
  const scope = user?.id ?? "anonymous";
  const timing = mediaTiming(value);
  return useQuery({
    queryKey: ["private-storage-url", scope, value],
    queryFn: () => signStorageReference(value, scope),
    enabled: !loading && enabled,
    staleTime: timing.stale,
    gcTime: timing.refresh,
    refetchInterval: timing.refresh,
    retry: false,
  });
}

const SignedImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(({ src, srcSet: _srcSet, loading = "lazy", ...props }, ref) => {
  const [node, setNode] = useState<HTMLImageElement | null>(null);
  const [near, setNear] = useState(loading === "eager" || props.fetchPriority === "high" || typeof IntersectionObserver === "undefined");
  const attach = useCallback((element: HTMLImageElement | null) => {
    setNode(element);
    if (typeof ref === "function") ref(element); else if (ref) ref.current = element;
  }, [ref]);
  useEffect(() => {
    if (near || !node) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: "300px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, near]);
  const { data } = useSignedStorageUrl(src!, near);
  // Lazy images are not even signed until approaching the viewport.
  return <img {...props} loading={loading} decoding={props.decoding ?? "async"} ref={attach} src={data} />;
});
SignedImage.displayName = "SignedImage";

export const StorageImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>((props, ref) =>
  isApplicationStorage(props.src) ? <SignedImage {...props} ref={ref} /> : <img {...props} ref={ref} />,
);
StorageImage.displayName = "StorageImage";

const SignedLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(({ href, onClick, ...props }, ref) => {
  const { data, isError } = useSignedStorageUrl(href!);
  return <a {...props} ref={ref} href={data} aria-disabled={!data || undefined} title={isError ? "File unavailable" : props.title} onClick={event => {
    if (!data) { event.preventDefault(); return; }
    onClick?.(event);
  }} />;
});
SignedLink.displayName = "SignedLink";

export const StorageLink = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>((props, ref) =>
  isApplicationStorage(props.href) ? <SignedLink {...props} ref={ref} /> : <a {...props} ref={ref} />,
);
StorageLink.displayName = "StorageLink";
