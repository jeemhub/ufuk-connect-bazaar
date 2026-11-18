import { afterEach, expect, it, vi } from 'vitest';
import { optimizeUpload } from './optimizeUpload';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('bounds a large raster and uploads a smaller WebP instead of the original megabyte PNG', async () => {
  const close = vi.fn(); const drawImage = vi.fn();
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 2000, close })));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback) {
    expect(this.width).toBe(1600); expect(this.height).toBe(800); callback(new Blob(['small'], { type: 'image/webp' }));
  });
  const result = await optimizeUpload(new File([new Uint8Array(1_000_000)], 'photo.png', { type: 'image/png' }));
  expect(result.type).toBe('image/webp'); expect(result.name).toBe('photo.webp'); expect(result.size).toBeLessThan(1_000_000); expect(close).toHaveBeenCalledTimes(1);
});
it('leaves animated images and documents intact', async () => {
  const decode = vi.fn(); vi.stubGlobal('createImageBitmap', decode);
  for (const type of ['image/gif', 'image/svg+xml', 'application/pdf']) {
    const file = new File(['original'], 'asset', { type }); expect(await optimizeUpload(file)).toBe(file);
  }
  expect(decode).not.toHaveBeenCalled();
});
