import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
  exp?: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const REFRESH_THRESHOLD_SECONDS = 30;

function decodeJwtPayload(token: string): JwtPayload | undefined {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return undefined;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return undefined;
  }
}

function shouldRefreshAccessToken(accessToken?: string): boolean {
  if (!accessToken) {
    return true;
  }

  const payload = decodeJwtPayload(accessToken);
  if (!payload?.exp) {
    return true;
  }

  const expiresInSeconds = payload.exp - Math.floor(Date.now() / 1000);
  return expiresInSeconds <= REFRESH_THRESHOLD_SECONDS;
}

function setAuthCookies(response: NextResponse, tokens: TokenPair) {
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15,
  });

  response.cookies.set('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
}

async function refreshSession(
  request: NextRequest,
  redirectUrl: string | URL = request.nextUrl,
): Promise<NextResponse> {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    clearAuthCookies(response);
    return response;
  }

  const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });

  if (!refreshResponse.ok) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    clearAuthCookies(response);
    return response;
  }

  const tokens = (await refreshResponse.json()) as TokenPair;
  // Redirect so the next request reaches Server Components with the fresh cookie.
  const response = NextResponse.redirect(redirectUrl);
  setAuthCookies(response, tokens);
  return response;
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (shouldRefreshAccessToken(accessToken)) {
      return refreshSession(request);
    }

    return NextResponse.next();
  }

  if ((pathname === '/login' || pathname === '/register') && accessToken) {
    if (shouldRefreshAccessToken(accessToken) && refreshToken) {
      return refreshSession(request, new URL('/dashboard', request.url));
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
