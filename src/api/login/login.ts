import { apiClient, setToken } from '@/api/client';
import type { LoginRequest, LoginResponse } from './types';
import { API_ENDPOINTS } from '@/api/constants';

// TODO: Remove this mock login and use the actual login API
export async function login(email: LoginRequest['email'], password: LoginRequest['password']) {
  // const { data } = await apiClient.post<LoginResponse>(API_ENDPOINTS.LOGIN, {
  //   email,
  //   password,
  // });
  // setToken(data.token);
  setToken('fe3cc8eebde4a84eb3880ab017122e3bafc64a48');
  // return data;
}
