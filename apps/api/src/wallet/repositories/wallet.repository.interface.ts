import { Wallet, Prisma } from '@prisma/client';

export type WalletWithUser = Wallet & {
  user?: { id: string; email: string; name: string };
};

export interface IWalletRepository {
  findByUserId(userId: string): Promise<Wallet | null>;
  findById(id: string): Promise<Wallet | null>;
  findByEmail(email: string): Promise<WalletWithUser | null>;
  lockById(tx: Prisma.TransactionClient, id: string): Promise<Wallet>;
  updateBalance(tx: Prisma.TransactionClient, id: string, delta: Prisma.Decimal): Promise<Wallet>;
}

export const WALLET_REPOSITORY = Symbol('WALLET_REPOSITORY');
