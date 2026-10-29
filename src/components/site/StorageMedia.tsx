import { forwardRef, type ImgHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { isApplicationStorage } from "@/lib/storageReferences";
import { signStorageReference, SIGNED_MEDIA_STALE_MS, SIGNED_MEDIA_REFRESH_MS } from "@/lib/storageSigning";

export function useSignedStorageUrl(value: string) {
  const { user, loading } = useAuth();
  const scope = user?.id ?? "anonymous";
  return useQuery({
    queryKey: ["private-storage-url", scope, value],
    queryFn: () => signStorageReference(value, scope),
    enabled: !loading,
    staleTime: SIGNED_MEDIA_STALE_MS,
    gcTime: SIGNED_MEDIA_REFRESH_MS,
    refetchInterval: SIGNED_MEDIA_REFRESH_MS,
    retry: false,
  });
}

const SignedImage = forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(({ src, srcSet: _srcSet, ...props }, ref) => {
  const { data } = useSignedStorageUrl(src!);
  // Old public transform/srcset endpoints cannot serve the private target bucket.
  return <img {...props} ref={ref} src={data} />;
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
