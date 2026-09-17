/**
 * API client for Admin frontend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: 'Request failed', code: 'UNKNOWN_ERROR' },
      }));
      throw new Error(error.error?.message || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
