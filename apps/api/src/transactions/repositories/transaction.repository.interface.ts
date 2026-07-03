import { Transaction, Prisma, TransactionType } from '@prisma/client';

export type TransactionWithWallets = Transaction & {
  senderWallet?: { id: string; userId: string } | null;
  receiverWallet?: { id: string; userId: string };
};

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionWithWallets | null>;
  findByIdempotencyKey(key: string): Promise<Transaction | null>;
  findByUserWallet(userId: string): Promise<TransactionWithWallets[]>;
  create(
    tx: Prisma.TransactionClient,
    data: {
      type: TransactionType;
      amount: Prisma.Decimal;
      senderWalletId?: string | null;
      receiverWalletId: string;
      reversalOfId?: string;
      idempotencyKey?: string;
      description?: string;
    },
  ): Promise<Transaction>;
  markAsReversed(tx: Prisma.TransactionClient, id: string): Promise<Transaction>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
