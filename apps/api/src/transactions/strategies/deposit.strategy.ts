import { Inject, Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import {
  ITransactionStrategy,
  TransactionContext,
} from './transaction-strategy.interface';
import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from '../repositories/transaction.repository.interface';
import {
  WALLET_REPOSITORY,
  IWalletRepository,
} from '../../wallet/repositories/wallet.repository.interface';

@Injectable()
export class DepositStrategy implements ITransactionStrategy<TransactionContext> {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: IWalletRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(context: TransactionContext) {
    const { tx, walletId, amount, description, idempotencyKey } = context;

    await this.walletRepository.lockById(tx, walletId);
    await this.walletRepository.updateBalance(tx, walletId, amount);

    return this.transactionRepository.create(tx, {
      type: TransactionType.DEPOSIT,
      amount,
      senderWalletId: null,
      receiverWalletId: walletId,
      description,
      idempotencyKey,
    });
  }
}
