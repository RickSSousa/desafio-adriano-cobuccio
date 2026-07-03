'use client';

import { useActionState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  depositAction,
  transferAction,
  reverseTransactionAction,
  logoutAction,
} from '@/app/actions/wallet.actions';
import type { Transaction } from '@/lib/api';

interface DashboardClientProps {
  balance: string;
  transactions: Transaction[];
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

export function DashboardClient({ balance, transactions }: DashboardClientProps) {
  const router = useRouter();
  const [depositState, depositFormAction, depositPending] = useActionState(depositAction, {
    success: false,
  });
  const [transferState, transferFormAction, transferPending] = useActionState(transferAction, {
    success: false,
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (depositState.success || transferState.success) {
      router.refresh();
    }
  }, [depositState.success, transferState.success, router]);

  const handleReverse = (transactionId: string) => {
    startTransition(async () => {
      const result = await reverseTransactionAction(transactionId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Dashboard</p>
          <h1 className="text-3xl font-bold">Minha Carteira</h1>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-secondary">
            Sair
          </button>
        </form>
      </header>

      <section className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="card md:col-span-1">
          <p className="text-sm text-slate-600">Saldo disponível</p>
          <p className="mt-2 text-3xl font-bold text-brand-700">{formatCurrency(balance)}</p>
        </div>

        <div className="card md:col-span-1">
          <h2 className="text-lg font-semibold">Depositar</h2>
          <form action={depositFormAction} className="mt-4 space-y-3">
            <input name="amount" type="number" step="0.01" min="0.01" required className="input" placeholder="Valor" />
            <input name="description" type="text" className="input" placeholder="Descrição (opcional)" />
            {depositState.error && <p className="text-sm text-red-600">{depositState.error}</p>}
            {depositState.success && <p className="text-sm text-green-600">Depósito realizado!</p>}
            <button type="submit" disabled={depositPending} className="btn-primary w-full">
              {depositPending ? 'Processando...' : 'Depositar'}
            </button>
          </form>
        </div>

        <div className="card md:col-span-1">
          <h2 className="text-lg font-semibold">Transferir</h2>
          <form action={transferFormAction} className="mt-4 space-y-3">
            <input name="recipientEmail" type="email" required className="input" placeholder="E-mail do destinatário" />
            <input name="amount" type="number" step="0.01" min="0.01" required className="input" placeholder="Valor" />
            <input name="description" type="text" className="input" placeholder="Descrição (opcional)" />
            {transferState.error && <p className="text-sm text-red-600">{transferState.error}</p>}
            {transferState.success && <p className="text-sm text-green-600">Transferência realizada!</p>}
            <button type="submit" disabled={transferPending} className="btn-primary w-full">
              {transferPending ? 'Processando...' : 'Transferir'}
            </button>
          </form>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Histórico de transações</h2>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Nenhuma transação registrada ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Valor</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">{formatDate(transaction.createdAt)}</td>
                    <td className="px-3 py-3">{transaction.type}</td>
                    <td className="px-3 py-3 font-medium">{formatCurrency(transaction.amount)}</td>
                    <td className="px-3 py-3">{transaction.status}</td>
                    <td className="px-3 py-3">{transaction.description ?? '-'}</td>
                    <td className="px-3 py-3">
                      {transaction.status === 'COMPLETED' && transaction.type !== 'REVERSAL' ? (
                        <button
                          type="button"
                          onClick={() => handleReverse(transaction.id)}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          Reverter
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
