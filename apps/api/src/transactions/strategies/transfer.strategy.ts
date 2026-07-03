import { Inject, Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import {
  ITransactionStrategy,
  TransferContext,
} from './transaction-strategy.interface';
import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from '../repositories/transaction.repository.interface';
import {
  WALLET_REPOSITORY,
  IWalletRepository,
} from '../../wallet/repositories/wallet.repository.interface';
import { InsufficientBalanceException } from '../../common/exceptions/business.exceptions';

@Injectable()
export class TransferStrategy implements ITransactionStrategy<TransferContext> {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: IWalletRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(context: TransferContext) {
    const { tx, walletId, recipientWalletId, amount, description, idempotencyKey } =
      context;

    const sender = await this.walletRepository.lockById(tx, walletId);
    await this.walletRepository.lockById(tx, recipientWalletId);

    if (sender.balance.lessThan(amount)) {
      throw new InsufficientBalanceException();
    }

    await this.walletRepository.updateBalance(tx, walletId, amount.negated());
    await this.walletRepository.updateBalance(tx, recipientWalletId, amount);

    return this.transactionRepository.create(tx, {
      type: TransactionType.TRANSFER,
      amount,
      senderWalletId: walletId,
      receiverWalletId: recipientWalletId,
      description,
      idempotencyKey,
    });
  }
}
