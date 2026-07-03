import { redirect } from 'next/navigation';
import { getBalanceAction, getTransactionsAction } from '@/app/actions/wallet.actions';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const [balanceResult, transactionsResult] = await Promise.all([
    getBalanceAction(),
    getTransactionsAction(1),
  ]);

  if (!balanceResult.success || !transactionsResult.success || !transactionsResult.data) {
    redirect('/login');
  }

  const { items, hasMore, total, page } = transactionsResult.data;

  return (
    <DashboardClient
      balance={balanceResult.data!.balance}
      initialTransactions={items}
      initialHasMore={hasMore}
      initialTotal={total}
      initialPage={page}
    />
  );
}
