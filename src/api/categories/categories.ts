import { apiClient } from '@/api/client';
import type { Category } from './types';
import { API_ENDPOINTS } from '@/api/constants';

export async function getCategories() {
  const { data } = await apiClient.get<Category[]>(API_ENDPOINTS.CATEGORIES);
  return data;
}
