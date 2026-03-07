export type ImageContentType = 'image/jpeg' | 'image/webp' | 'image/png';

export interface GetPresignedUrlRequest {
  file_name: string;
  content_type: ImageContentType;
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
