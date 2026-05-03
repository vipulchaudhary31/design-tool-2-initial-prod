export type ImageContentType = 'image/jpeg' | 'image/webp' | 'image/png';
export type VideoContentType = 'video/mp4';
export type BackgroundContentType = ImageContentType | VideoContentType;

export interface GetPresignedUrlRequest {
  file_name: string;
  content_type: BackgroundContentType;
}

export interface PresignedUrlFields {
  acl: string;
  key: string;
  'x-amz-algorithm': string;
  'x-amz-credential': string;
  'x-amz-date': string;
  policy: string;
  'x-amz-signature': string;
}

export interface GetPresignedUrlResponse {
  url: string;
  fields: PresignedUrlFields;
}
