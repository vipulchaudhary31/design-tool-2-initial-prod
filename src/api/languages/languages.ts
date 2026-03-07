import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/constants';

export async function getLanguages(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>(API_ENDPOINTS.LANGUAGES);
  return data;
}
