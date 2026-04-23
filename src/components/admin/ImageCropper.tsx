import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";

interface ImageCropperProps {
  open: boolean;
  src: string;
  onClose: () => void;
  onCropped: (dataUrl: string) => void;
  aspect?: number;
}

async function getCroppedDataUrl(src: string, area: Area): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function ImageCropper({ open, src, onClose, onCropped, aspect = 1 }: ImageCropperProps) {
  const { t } = useLanguage();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);

  const onComplete = useCallback((_: Area, pixels: Area) => setAreaPx(pixels), []);

  const save = async () => {
    if (!areaPx) return;
    const url = await getCroppedDataUrl(src, areaPx);
    onCropped(url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("crop_image")}</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 w-full overflow-hidden rounded-md bg-secondary">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">{t("zoom")}</label>
          <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>{t("cancel")}</Button>
          <Button type="button" onClick={save} className="bg-gradient-brand">{t("crop_save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
