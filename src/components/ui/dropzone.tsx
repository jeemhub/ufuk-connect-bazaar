import { useCallback, useState, type ReactNode, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string; // e.g. "image/*" or "application/pdf"
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  overlayLabel?: string;
  children?: ReactNode;
}

/**
 * Lightweight wrapper that adds drag-and-drop file support to any region.
 * Visually highlights when a file is dragged over and accepts files matching `accept`.
 */
export function Dropzone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  className,
  overlayLabel,
  children,
}: DropzoneProps) {
  const [over, setOver] = useState(false);

  const matchesAccept = useCallback(
    (file: File) => {
      if (!accept) return true;
      const types = accept.split(",").map((s) => s.trim().toLowerCase());
      const name = file.name.toLowerCase();
      const type = file.type.toLowerCase();
      return types.some((t) => {
        if (!t) return false;
        if (t.startsWith(".")) return name.endsWith(t);
        if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1));
        return type === t;
      });
    },
    [accept]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (!over) setOver(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setOver(false);
    const dropped = Array.from(e.dataTransfer?.files ?? []);
    if (dropped.length === 0) return;
    const valid = dropped.filter(matchesAccept);
    if (valid.length === 0) return;
    onFiles(multiple ? valid : [valid[0]]);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-md transition-all",
        over &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background outline-none",
        className
      )}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-md bg-primary/10 backdrop-blur-sm">
          <UploadCloud className="h-8 w-8 text-primary" />
          {overlayLabel && (
            <span className="text-sm font-semibold text-primary">{overlayLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
