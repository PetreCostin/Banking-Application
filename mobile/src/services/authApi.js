import { httpClient } from './httpClient';
import { clearTokens, getTokens, saveTokens } from './tokenStorage';

export const register = async (payload) => {
  const response = await httpClient.post('/auth/register', payload);
  await saveTokens({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken });
  return response.data;
};

export const login = async (payload) => {
  const response = await httpClient.post('/auth/login', payload);
  await saveTokens({ accessToken: response.data.accessToken, refreshToken: response.data.refreshToken });
  return response.data;
};

export const logout = async () => {
  const tokens = await getTokens();
  if (tokens?.refreshToken) {
    await httpClient.post('/auth/logout', { refreshToken: tokens.refreshToken });
  }
  await clearTokens();
};

export const getProfile = async () => {
  const response = await httpClient.get('/users/me');
  return response.data;
};
