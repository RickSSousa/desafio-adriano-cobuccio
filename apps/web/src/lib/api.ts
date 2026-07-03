import {
  clearAuthCookies,
  getRefreshToken,
  setAuthCookies,
} from './auth-cookies';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  senderWalletId: string | null;
  receiverWalletId: string;
  reversalOfId: string | null;
  description: string | null;
  createdAt: string;
}

export interface WalletBalance {
  id: string;
  userId: string;
  balance: string;
}

async function parseResponse<T>(response: Response): Promise<ActionResult<T>> {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof body.message === 'string'
        ? body.message
        : Array.isArray(body.message)
          ? body.message.join(', ')
          : 'Request failed';
    return { success: false, error: message, statusCode: response.status };
  }

  return { success: true, data: body as T };
}

async function refreshAccessToken(): Promise<string | undefined> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return undefined;
  }

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!response.ok) {
    await clearAuthCookies();
    return undefined;
  }

  const tokens = (await response.json()) as AuthTokens;
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string; refreshOnUnauthorized?: boolean } = {},
): Promise<ActionResult<T>> {
  const { accessToken, refreshOnUnauthorized = false, headers, ...rest } = options;

  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      cache: 'no-store',
    });

    if (response.status === 401 && refreshOnUnauthorized) {
      const refreshedAccessToken = await refreshAccessToken();

      if (!refreshedAccessToken) {
        return { success: false, error: 'Session expired', statusCode: 401 };
      }

      const retryResponse = await fetch(`${API_URL}/api${path}`, {
        ...rest,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshedAccessToken}`,
          ...headers,
        },
        cache: 'no-store',
      });

      return parseResponse<T>(retryResponse);
    }

    return parseResponse<T>(response);
  } catch {
    return { success: false, error: 'Unable to reach API server' };
  }
}
