import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import { clearTokens, getTokens, saveTokens } from './tokenStorage';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

httpClient.interceptors.request.use(async (config) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Token ${tokens.accessToken}`;
  }
  return config;
});

let refreshingPromise = null;

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (!refreshingPromise) {
      refreshingPromise = (async () => {
        const tokens = await getTokens();
        if (!tokens?.refreshToken) throw error;
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        });
        await saveTokens({
          accessToken: refreshResponse.data.accessToken,
          refreshToken: refreshResponse.data.refreshToken,
        });
      })().finally(() => {
        refreshingPromise = null;
      });
    }

    try {
      await refreshingPromise;
      const newTokens = await getTokens();
      if (!newTokens?.accessToken) throw refreshError;
      originalRequest._retry = true;
      originalRequest.headers.Authorization = `Token ${newTokens.accessToken}`;
      return httpClient(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      return Promise.reject(refreshError);
    }
  },
);
