import type { PresignedUrlFields } from '@/api/get-presigned-url/types';

export async function uploadImage(
  url: string,
  fields: PresignedUrlFields,
  blob: Blob,
): Promise<void> {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  formData.append('file', blob);
  const response = await fetch(url, { method: 'POST', body: formData });
  if (!response.ok && response.status !== 204) {
    throw new Error(`Upload failed: ${response.status}`);
  }
}
