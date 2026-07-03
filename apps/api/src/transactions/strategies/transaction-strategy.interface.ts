import { Prisma, Transaction } from '@prisma/client';

export interface TransactionContext {
  tx: Prisma.TransactionClient;
  userId: string;
  walletId: string;
  amount: Prisma.Decimal;
  description?: string;
  idempotencyKey?: string;
}

export interface TransferContext extends TransactionContext {
  recipientWalletId: string;
}

export interface ReversalContext {
  tx: Prisma.TransactionClient;
  userId: string;
  originalTransaction: Transaction & {
    senderWallet?: { id: string; userId: string } | null;
    receiverWallet?: { id: string; userId: string };
  };
}

export interface ITransactionStrategy<TContext> {
  execute(context: TContext): Promise<Transaction>;
}

export const DEPOSIT_STRATEGY = Symbol('DEPOSIT_STRATEGY');
export const TRANSFER_STRATEGY = Symbol('TRANSFER_STRATEGY');
export const REVERSAL_STRATEGY = Symbol('REVERSAL_STRATEGY');
