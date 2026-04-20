import type { ImageContentType } from '@/api/get-presigned-url/types';

const JPEG_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/jfif',
]);

const RASTER_EXT = /\.(jpe?g|jfif|png|webp)$/i;

export function isRasterBackgroundFile(file: File): boolean {
  const type = (file.type || '').toLowerCase().trim();
  if (type) {
    if (type === 'image/png' || type === 'image/webp') return true;
    if (JPEG_MIME.has(type)) return true;
    return false;
  }
  const name = file.name || '';
  return RASTER_EXT.test(name);
}

export function extensionForRasterContentType(contentType: ImageContentType): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

export function rasterContentTypeFromDataUrl(dataUrl: string): ImageContentType | null {
  const m = /^data:([^;,]+)/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].trim().toLowerCase();
  if (mime === 'image/png' || mime === 'image/webp') return mime;
  if (JPEG_MIME.has(mime)) return 'image/jpeg';
  return null;
}

export function normalizeRasterUploadContentType(
  blob: Blob,
  dataUrl?: string | null,
): ImageContentType {
  const mime = (blob.type || '').toLowerCase().trim();
  if (mime === 'image/png' || mime === 'image/webp' || mime === 'image/jpeg') return mime;
  if (mime && JPEG_MIME.has(mime)) return 'image/jpeg';

  if (dataUrl && dataUrl.startsWith('data:')) {
    const fromUrl = rasterContentTypeFromDataUrl(dataUrl);
    if (fromUrl) return fromUrl;
  }

  return 'image/jpeg';
}
