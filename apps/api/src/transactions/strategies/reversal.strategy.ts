import { Inject, Injectable } from '@nestjs/common';
import { TransactionStatus, TransactionType } from '@prisma/client';
import {
  ITransactionStrategy,
  ReversalContext,
} from './transaction-strategy.interface';
import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from '../repositories/transaction.repository.interface';
import {
  WALLET_REPOSITORY,
  IWalletRepository,
} from '../../wallet/repositories/wallet.repository.interface';
import {
  InvalidTransactionTypeException,
  TransactionAlreadyReversedException,
  UnauthorizedTransactionAccessException,
} from '../../common/exceptions/business.exceptions';

@Injectable()
export class ReversalStrategy implements ITransactionStrategy<ReversalContext> {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: IWalletRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(context: ReversalContext) {
    const { tx, userId, originalTransaction } = context;

    if (originalTransaction.type === TransactionType.REVERSAL) {
      throw new InvalidTransactionTypeException();
    }

    if (originalTransaction.status === TransactionStatus.REVERSED) {
      throw new TransactionAlreadyReversedException();
    }

    const senderUserId = originalTransaction.senderWallet?.userId;
    const receiverUserId = originalTransaction.receiverWallet?.userId;

    if (userId !== senderUserId && userId !== receiverUserId) {
      throw new UnauthorizedTransactionAccessException();
    }

    const amount = originalTransaction.amount;

    if (originalTransaction.type === TransactionType.DEPOSIT) {
      await this.walletRepository.lockById(tx, originalTransaction.receiverWalletId);
      await this.walletRepository.updateBalance(
        tx,
        originalTransaction.receiverWalletId,
        amount.negated(),
      );
    } else if (originalTransaction.type === TransactionType.TRANSFER) {
      const senderWalletId = originalTransaction.senderWalletId!;
      const receiverWalletId = originalTransaction.receiverWalletId;

      await this.walletRepository.lockById(tx, senderWalletId);
      await this.walletRepository.lockById(tx, receiverWalletId);

      await this.walletRepository.updateBalance(tx, receiverWalletId, amount.negated());
      await this.walletRepository.updateBalance(tx, senderWalletId, amount);
    }

    const reversal = await this.transactionRepository.create(tx, {
      type: TransactionType.REVERSAL,
      amount,
      senderWalletId: originalTransaction.receiverWalletId,
      receiverWalletId: originalTransaction.senderWalletId ?? originalTransaction.receiverWalletId,
      reversalOfId: originalTransaction.id,
      description: `Reversal of transaction ${originalTransaction.id}`,
    });

    await this.transactionRepository.markAsReversed(tx, originalTransaction.id);

    return reversal;
  }
}
