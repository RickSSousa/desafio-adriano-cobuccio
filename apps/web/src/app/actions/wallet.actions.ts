'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { apiRequest, ActionResult, AuthTokens, User, WalletBalance, Transaction, PaginatedTransactions, TransactionListFilters } from '@/lib/api';
import { setAuthCookies, clearAuthCookies, getAccessToken } from '@/lib/auth-cookies';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const depositSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
});

const transferSchema = z.object({
  recipientEmail: z.string().email(),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
});

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid data' };
  }

  const result = await apiRequest<{ user: User; tokens: AuthTokens }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!result.success || !result.data) {
    return result;
  }

  await setAuthCookies(result.data.tokens.accessToken, result.data.tokens.refreshToken);
  redirect('/dashboard');
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid data' };
  }

  const result = await apiRequest<{ user: User; tokens: AuthTokens }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });

  if (!result.success || !result.data) {
    return result;
  }

  await setAuthCookies(result.data.tokens.accessToken, result.data.tokens.refreshToken);
  redirect('/dashboard');
}

export async function logoutAction() {
  await clearAuthCookies();
  redirect('/login');
}

export async function getBalanceAction(): Promise<ActionResult<WalletBalance>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  return apiRequest<WalletBalance>('/wallet/balance', {
    method: 'GET',
    accessToken,
  });
}

export async function getTransactionsAction(
  page = 1,
  filters: TransactionListFilters = {},
): Promise<ActionResult<PaginatedTransactions>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  const params = new URLSearchParams({ page: String(page) });
  const trimmedSearch = filters.search?.trim();
  const trimmedStartDate = filters.startDate?.trim();
  const trimmedEndDate = filters.endDate?.trim();

  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }
  if (trimmedStartDate) {
    params.set('startDate', trimmedStartDate);
  }
  if (trimmedEndDate) {
    params.set('endDate', trimmedEndDate);
  }

  return apiRequest<PaginatedTransactions>(`/transactions?${params}`, {
    method: 'GET',
    accessToken,
  });
}

export async function depositAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult<Transaction>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  const parsed = depositSchema.safeParse({
    amount: formData.get('amount'),
    description: formData.get('description') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid amount' };
  }

  const result = await apiRequest<Transaction>('/transactions/deposit', {
    method: 'POST',
    accessToken,
    refreshOnUnauthorized: true,
    body: JSON.stringify({
      ...parsed.data,
      idempotencyKey: crypto.randomUUID(),
    }),
  });

  if (result.success) {
    revalidatePath('/dashboard');
  }

  return result;
}

export async function transferAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult<Transaction>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  const parsed = transferSchema.safeParse({
    recipientEmail: formData.get('recipientEmail'),
    amount: formData.get('amount'),
    description: formData.get('description') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid data' };
  }

  const result = await apiRequest<Transaction>('/transactions/transfer', {
    method: 'POST',
    accessToken,
    refreshOnUnauthorized: true,
    body: JSON.stringify({
      ...parsed.data,
      idempotencyKey: crypto.randomUUID(),
    }),
  });

  if (result.success) {
    revalidatePath('/dashboard');
  }

  return result;
}

export async function reverseTransactionAction(transactionId: string): Promise<ActionResult<Transaction>> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  const result = await apiRequest<Transaction>(`/transactions/${transactionId}/reverse`, {
    method: 'POST',
    accessToken,
    refreshOnUnauthorized: true,
  });

  if (result.success) {
    revalidatePath('/dashboard');
  }

  return result;
}
