'use client';

import { useActionState, useTransition, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  depositAction,
  transferAction,
  reverseTransactionAction,
  logoutAction,
  getTransactionsAction,
} from '@/app/actions/wallet.actions';
import type { Transaction, TransactionListFilters } from '@/lib/api';
import { Logo } from '@/components/ui/logo';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge, TypeBadge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';

interface DashboardClientProps {
  balance: string;
  initialTransactions: Transaction[];
  initialHasMore: boolean;
  initialTotal: number;
  initialPage: number;
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

const EMPTY_TRANSACTION_FILTERS: TransactionListFilters = {
  search: '',
  startDate: '',
  endDate: '',
};

function hasActiveFilters(filters: TransactionListFilters) {
  return Boolean(filters.search?.trim() || filters.startDate?.trim() || filters.endDate?.trim());
}

export function DashboardClient({
  balance,
  initialTransactions,
  initialHasMore,
  initialTotal,
  initialPage,
}: DashboardClientProps) {
  const router = useRouter();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<TransactionListFilters>(EMPTY_TRANSACTION_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<TransactionListFilters>(
    EMPTY_TRANSACTION_FILTERS,
  );
  const [filtering, setFiltering] = useState(false);
  const skipFilterFetch = useRef(true);
  const [depositState, depositFormAction, depositPending] = useActionState(depositAction, {
    success: false,
  });
  const [transferState, transferFormAction, transferPending] = useActionState(transferAction, {
    success: false,
  });
  const [, startTransition] = useTransition();
  const [depositAmountKey, setDepositAmountKey] = useState(0);
  const [transferAmountKey, setTransferAmountKey] = useState(0);
  const wasDepositPending = useRef(false);
  const wasTransferPending = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const reloadTransactions = useCallback(async (activeFilters: TransactionListFilters) => {
    const startDate = activeFilters.startDate?.trim() ?? '';
    const endDate = activeFilters.endDate?.trim() ?? '';

    if (startDate && endDate && startDate > endDate) {
      toast.error('Data inicial não pode ser posterior à data final');
      return;
    }

    setFiltering(true);
    const result = await getTransactionsAction(1, {
      search: activeFilters.search?.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setFiltering(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? 'Não foi possível filtrar transações');
      return;
    }

    setTransactions(result.data.items);
    setHasMore(result.data.hasMore);
    setPage(result.data.page);
    setTotal(result.data.total);
  }, []);

  useEffect(() => {
    if (!hasActiveFilters(debouncedFilters)) {
      setTransactions(initialTransactions);
      setHasMore(initialHasMore);
      setTotal(initialTotal);
      setPage(initialPage);
    }
  }, [initialTransactions, initialHasMore, initialTotal, initialPage, debouncedFilters]);

  useEffect(() => {
    if (skipFilterFetch.current) {
      skipFilterFetch.current = false;
      return;
    }

    void reloadTransactions(debouncedFilters);
  }, [debouncedFilters, reloadTransactions]);

  useEffect(() => {
    if (wasDepositPending.current && !depositPending) {
      if (depositState.success) {
        toast.success('Depósito realizado!');
        setDepositAmountKey((key) => key + 1);
        router.refresh();
        void reloadTransactions(debouncedFilters);
      } else if (depositState.error) {
        toast.error(depositState.error);
      }
    }
    wasDepositPending.current = depositPending;
  }, [depositPending, depositState.success, depositState.error, router, debouncedFilters, reloadTransactions]);

  useEffect(() => {
    if (wasTransferPending.current && !transferPending) {
      if (transferState.success) {
        toast.success('Transferência realizada!');
        setTransferAmountKey((key) => key + 1);
        router.refresh();
        void reloadTransactions(debouncedFilters);
      } else if (transferState.error) {
        toast.error(transferState.error);
      }
    }
    wasTransferPending.current = transferPending;
  }, [transferPending, transferState.success, transferState.error, router, debouncedFilters, reloadTransactions]);

  const handleLoadMore = () => {
    startTransition(async () => {
      setLoadingMore(true);
      const result = await getTransactionsAction(page + 1, {
        search: debouncedFilters.search?.trim(),
        startDate: debouncedFilters.startDate?.trim() || undefined,
        endDate: debouncedFilters.endDate?.trim() || undefined,
      });
      setLoadingMore(false);

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Não foi possível carregar mais transações');
        return;
      }

      setTransactions((current) => [...current, ...result.data!.items]);
      setHasMore(result.data.hasMore);
      setPage(result.data.page);
      setTotal(result.data.total);
    });
  };

  const handleReverse = (transactionId: string) => {
    startTransition(async () => {
      const result = await reverseTransactionAction(transactionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Transação revertida!');
      router.refresh();
      void reloadTransactions(debouncedFilters);
    });
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_TRANSACTION_FILTERS);
  };

  const balanceNumber = Number(balance);
  const isNegative = balanceNumber < 0;
  const isFiltering = hasActiveFilters(debouncedFilters);

  return (
    <PageShell wide>
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo size="sm" />
          <div>
            <p className="section-title">Dashboard</p>
            <h1 className="heading-lg mt-1">Minha Carteira</h1>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-secondary">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path
                fillRule="evenodd"
                d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z"
                clipRule="evenodd"
              />
            </svg>
            Sair
          </button>
        </form>
      </header>

      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="card-highlight lg:col-span-1">
          <p className="text-sm font-medium text-vault-400">Saldo disponível</p>
          <p
            className={`mt-3 font-display text-4xl font-bold tracking-tight ${
              isNegative ? 'text-red-400' : 'bg-gradient-to-r from-accent-300 to-glow-cyan bg-clip-text text-transparent'
            }`}
          >
            {formatCurrency(balance)}
          </p>
          <p className="mt-3 text-xs text-vault-500">
            {isFiltering
              ? `${total} encontrada${total !== 1 ? 's' : ''}`
              : `${total} transação${total !== 1 ? 'ões' : ''} registrada${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="card lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </div>
            <h2 className="heading-md">Depositar</h2>
          </div>
          <form action={depositFormAction} className="space-y-3">
            <CurrencyInput key={depositAmountKey} name="amount" required />
            <input
              name="description"
              type="text"
              className="input"
              placeholder="Descrição (opcional)"
            />
            <button type="submit" disabled={depositPending} className="btn-primary w-full">
              {depositPending ? 'Processando...' : 'Depositar'}
            </button>
          </form>
        </div>

        <div className="card lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </div>
            <h2 className="heading-md">Transferir</h2>
          </div>
          <form action={transferFormAction} className="space-y-3">
            <input
              name="recipientEmail"
              type="email"
              required
              className="input"
              placeholder="E-mail do destinatário"
            />
            <CurrencyInput key={transferAmountKey} name="amount" required />
            <input
              name="description"
              type="text"
              className="input"
              placeholder="Descrição (opcional)"
            />
            <button type="submit" disabled={transferPending} className="btn-primary w-full">
              {transferPending ? 'Processando...' : 'Transferir'}
            </button>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="heading-md">Histórico de transações</h2>
              <span className="text-xs text-vault-500">Ledger append-only</span>
            </div>
            {isFiltering && (
              <button type="button" onClick={handleClearFilters} className="btn-ghost self-start text-xs">
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_10rem]">
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="transaction-search" className="label text-xs">
                Buscar
              </label>
              <div className="relative">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vault-500"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  id="transaction-search"
                  type="search"
                  value={filters.search ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, search: event.target.value }))
                  }
                  className="input pl-9"
                  placeholder="Descrição, tipo, status..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="start-date" className="label text-xs">
                De
              </label>
              <input
                id="start-date"
                type="date"
                value={filters.startDate ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, startDate: event.target.value }))
                }
                className="input"
              />
            </div>

            <div>
              <label htmlFor="end-date" className="label text-xs">
                Até
              </label>
              <input
                id="end-date"
                type="date"
                value={filters.endDate ?? ''}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, endDate: event.target.value }))
                }
                className="input"
              />
            </div>
          </div>
        </div>

        {filtering ? (
          <div className="flex items-center justify-center py-12 text-sm text-vault-400">
            Filtrando transações...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vault-800 text-vault-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-muted">
              {isFiltering
                ? 'Nenhuma transação encontrada para os filtros aplicados.'
                : 'Nenhuma transação registrada ainda.'}
            </p>
            {!isFiltering && (
              <p className="mt-1 text-xs text-vault-500">Faça um depósito para começar.</p>
            )}
          </div>
        ) : (
          <>
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="whitespace-nowrap font-mono text-xs text-vault-400">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td>
                        <TypeBadge type={transaction.type} />
                      </td>
                      <td className="font-semibold text-vault-100">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>
                        <StatusBadge status={transaction.status} />
                      </td>
                      <td className="max-w-[200px] truncate text-vault-400">
                        {transaction.description ?? '—'}
                      </td>
                      <td>
                        {transaction.status === 'COMPLETED' && transaction.type !== 'REVERSAL' ? (
                          <button
                            type="button"
                            onClick={() => handleReverse(transaction.id)}
                            className="btn-danger px-3 py-1.5 text-xs"
                          >
                            Reverter
                          </button>
                        ) : (
                          <span className="text-vault-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="btn-secondary min-w-[180px]"
                >
                  {loadingMore ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}
