import { redirect } from 'next/navigation';
import { getBalanceAction, getTransactionsAction } from '@/app/actions/wallet.actions';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const [balanceResult, transactionsResult] = await Promise.all([
    getBalanceAction(),
    getTransactionsAction(),
  ]);

  if (!balanceResult.success || !transactionsResult.success) {
    redirect('/login');
  }

  return (
    <DashboardClient
      balance={balanceResult.data!.balance}
      transactions={transactionsResult.data ?? []}
    />
  );
}
