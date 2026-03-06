import { apiClient } from '@/api/client';
import type { GetPresignedUrlRequest, GetPresignedUrlResponse } from './types';
import { API_ENDPOINTS } from '@/api/constants';

export async function getPresignedUrl(body: GetPresignedUrlRequest): Promise<GetPresignedUrlResponse> {
  const { data } = await apiClient.post<GetPresignedUrlResponse>(API_ENDPOINTS.PRESIGNED_URL, body);
  return data;
}
