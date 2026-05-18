import type { BackgroundContentType, ImageContentType } from '@/api/get-presigned-url/types';

export const MAX_BACKGROUND_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_BACKGROUND_VIDEO_BYTES = 100 * 1024 * 1024;

const JPEG_MIME = new Set([
  'image/jpeg',
  'image/jpg',
]);

const RASTER_EXT = /\.(jpe?g|png)$/i;
const VIDEO_EXT = /\.mp4$/i;

export function isRasterBackgroundFile(file: File): boolean {
  const type = (file.type || '').toLowerCase().trim();
  if (type) {
    if (type === 'image/png') return true;
    if (JPEG_MIME.has(type)) return true;
    return false;
  }
  const name = file.name || '';
  return RASTER_EXT.test(name);
}

export function isVideoBackgroundFile(file: File): boolean {
  const type = (file.type || '').toLowerCase().trim();
  if (type) return type === 'video/mp4';
  return VIDEO_EXT.test(file.name || '');
}

export function isBackgroundFile(file: File): boolean {
  return isRasterBackgroundFile(file) || isVideoBackgroundFile(file);
}

export function extensionForRasterContentType(contentType: ImageContentType): string {
  if (contentType === 'image/png') return 'png';
  return 'jpg';
}

export function extensionForBackgroundContentType(contentType: BackgroundContentType): string {
  if (contentType === 'video/mp4') return 'mp4';
  return extensionForRasterContentType(contentType);
}

export function rasterContentTypeFromDataUrl(dataUrl: string): ImageContentType | null {
  const m = /^data:([^;,]+)/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].trim().toLowerCase();
  if (mime === 'image/png') return mime;
  if (JPEG_MIME.has(mime)) return 'image/jpeg';
  return null;
}

export function normalizeBackgroundUploadContentType(
  blob: Blob,
  dataUrl?: string | null,
): BackgroundContentType {
  const mime = (blob.type || '').toLowerCase().trim();
  if (mime === 'video/mp4') return 'video/mp4';
  if (mime === 'image/png' || mime === 'image/jpeg') return mime;
  if (mime && JPEG_MIME.has(mime)) return 'image/jpeg';

  if (dataUrl && dataUrl.startsWith('data:')) {
    const m = /^data:([^;,]+)/i.exec(dataUrl);
    if (m) {
      const dMime = m[1].trim().toLowerCase();
      if (dMime === 'video/mp4') return 'video/mp4';
      const fromUrl = rasterContentTypeFromDataUrl(dataUrl);
      if (fromUrl) return fromUrl;
    }
  }

  return 'image/jpeg';
}

/** @deprecated Use normalizeBackgroundUploadContentType */
export function normalizeRasterUploadContentType(
  blob: Blob,
  dataUrl?: string | null,
): ImageContentType {
  const result = normalizeBackgroundUploadContentType(blob, dataUrl);
  return result === 'video/mp4' ? 'image/jpeg' : result;
}
