/// <reference types="vite/client" />

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api.types';
import { tokenService } from './token.service';


class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();        
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = tokenService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log the request for debugging
        console.log('API Request:', {
          method: config.method,
          url: config.url,
          data: config.data,
          headers: config.headers
        });
        
        // Extra logging for POST requests
        if (config.method === 'post' && config.data) {
          console.log('POST Body:', JSON.stringify(config.data, null, 2));
        }
        
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Response:', {
          url: response.config.url,
          status: response.status,
          data: response.data
        });
        return response;
      },
      async (error: AxiosError) => {
        console.error('API Error Response:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });

        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 errors (unauthorized) - but not for login/register
        if (
          error.response?.status === 401 && 
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/login') &&
          !originalRequest.url?.includes('/auth/register')
        ) {
          if (this.isRefreshing) {
            // Wait for token refresh
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.api(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = tokenService.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.api.post('/auth/refresh', {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            tokenService.setTokens(accessToken, newRefreshToken);

            // Process queued requests
            this.processQueue(null, accessToken);

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            tokenService.clearTokens();
            // Only redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private formatError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        message: data.message || data.error || 'An error occurred',
        status: error.response.status,
        code: data.code,
        details: data.details || data,
      };
    } else if (error.request) {
      return {
        message: 'No response from server. Please check if the backend is running.',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'An error occurred',
      };
    }
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.api.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.put<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.api.delete<T>(url, config);
  }
}

export const apiService = new ApiService();