import { apiClient } from '@/api/client';
import type { CreatePosterTemplateRequest, PosterTemplate } from './types';
import { API_ENDPOINTS } from '@/api/constants';

export async function createPosterTemplate(
  body: CreatePosterTemplateRequest,
): Promise<PosterTemplate> {
  const { data } = await apiClient.post<PosterTemplate>(API_ENDPOINTS.POSTER_TEMPLATE, body);
  return data;
}
