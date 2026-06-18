import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Catches lazy-import failures (commonly caused by a new deploy invalidating
 * the previous JS chunks while the user still has the old HTML loaded).
 * Triggers a one-time hard reload so the user gets the fresh asset manifest
 * instead of a blank screen.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    const isChunkError =
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
        msg,
      );
    if (isChunkError && typeof window !== "undefined") {
      const key = "ufuk_chunk_reload_at";
      const last = Number(sessionStorage.getItem(key) || 0);
      // Only auto-reload once per minute to avoid loops on real network errors
      if (Date.now() - last > 60_000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
    }
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ChunkErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Something went wrong loading this page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            إعادة تحميل / Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
