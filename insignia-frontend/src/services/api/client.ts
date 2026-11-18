import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '@/app/config';

export interface ApiError {
  isApiError: true;
  message: string;
  statusCode?: number;
  originalError?: unknown;
}

let currentAuthToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const setApiAuthToken = (token: string | null) => {
  currentAuthToken = token;
};

export const registerUnauthorizedHandler = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Authorization header if token exists
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentAuthToken && !config.headers.Authorization) {
      // Per Stoplight docs: "Authorization: <user token>" (no automatic Bearer)
      config.headers.Authorization = currentAuthToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and normalize error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginEndpoint =
      error.config?.url?.includes('/login') ||
      error.config?.url === APP_CONFIG.authLoginPath;

    // Trigger unauthorized callback only for protected routes, not the login endpoint itself
    if (error.response?.status === 401 && !isLoginEndpoint) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);

/**
 * Normalizes Axios errors into a consistent ApiError object with friendly human-readable messages.
 */
export function normalizeApiError(error: unknown): ApiError {
  // If it's already an ApiError object, return as-is
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<string, unknown>).isApiError === true
  ) {
    return error as ApiError;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;

    let message = 'An unexpected network error occurred.';

    if (data?.message) {
      message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    } else if (data?.error) {
      message = data.error;
    } else if (status === 400) {
      message = 'Invalid request parameters or insufficient balance.';
    } else if (status === 401) {
      message = 'Unauthorized: invalid or expired session token.';
    } else if (status === 404) {
      message = 'Recipient user or requested resource not found.';
    } else if (status === 409) {
      message = 'Conflict: this username is already registered.';
    } else if (status === 500) {
      message = 'Internal server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timeout. Please check your connection and try again.';
    } else if (!error.response && error.request) {
      message = 'Unable to connect to the backend server. Please verify your network connection.';
    }

    return {
      isApiError: true,
      message,
      statusCode: status,
      originalError: error,
    };
  }

  if (error instanceof Error) {
    return {
      isApiError: true,
      message: error.message,
      originalError: error,
    };
  }

  return {
    isApiError: true,
    message: 'An unknown error occurred.',
    originalError: error,
  };
}
