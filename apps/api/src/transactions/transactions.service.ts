import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.module';
import { WalletService } from '../wallet/wallet.service';
import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from './repositories/transaction.repository.interface';
import {
  WALLET_REPOSITORY,
  IWalletRepository,
} from '../wallet/repositories/wallet.repository.interface';
import { DepositDto, TransferDto } from '../wallet/dto/wallet.dto';
import {
  TransactionNotFoundException,
  WalletNotFoundException,
} from '../common/exceptions/business.exceptions';
import { DepositStrategy } from './strategies/deposit.strategy';
import { TransferStrategy } from './strategies/transfer.strategy';
import { ReversalStrategy } from './strategies/reversal.strategy';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(WALLET_REPOSITORY) private readonly walletRepository: IWalletRepository,
    private readonly depositStrategy: DepositStrategy,
    private readonly transferStrategy: TransferStrategy,
    private readonly reversalStrategy: ReversalStrategy,
  ) {}

  async deposit(userId: string, dto: DepositDto) {
    if (dto.idempotencyKey) {
      const existing = await this.transactionRepository.findByIdempotencyKey(
        dto.idempotencyKey,
      );
      if (existing) {
        return this.formatTransaction(existing);
      }
    }

    const wallet = await this.walletService.getWalletByUserId(userId);
    const amount = new Prisma.Decimal(dto.amount);

    const transaction = await this.prisma.$transaction((tx) =>
      this.depositStrategy.execute({
        tx,
        userId,
        walletId: wallet.id,
        amount,
        description: dto.description,
        idempotencyKey: dto.idempotencyKey,
      }),
    );

    return this.formatTransaction(transaction);
  }

  async transfer(userId: string, dto: TransferDto) {
    if (dto.idempotencyKey) {
      const existing = await this.transactionRepository.findByIdempotencyKey(
        dto.idempotencyKey,
      );
      if (existing) {
        return this.formatTransaction(existing);
      }
    }

    const senderWallet = await this.walletService.getWalletByUserId(userId);
    const recipientWallet = await this.walletRepository.findByEmail(dto.recipientEmail);

    if (!recipientWallet) {
      throw new WalletNotFoundException();
    }

    if (recipientWallet.id === senderWallet.id) {
      throw new WalletNotFoundException();
    }

    const amount = new Prisma.Decimal(dto.amount);

    const transaction = await this.prisma.$transaction((tx) =>
      this.transferStrategy.execute({
        tx,
        userId,
        walletId: senderWallet.id,
        recipientWalletId: recipientWallet.id,
        amount,
        description: dto.description,
        idempotencyKey: dto.idempotencyKey,
      }),
    );

    return this.formatTransaction(transaction);
  }

  async reverse(userId: string, transactionId: string) {
    const original = await this.transactionRepository.findById(transactionId);
    if (!original) {
      throw new TransactionNotFoundException();
    }

    const reversal = await this.prisma.$transaction((tx) =>
      this.reversalStrategy.execute({
        tx,
        userId,
        originalTransaction: original,
      }),
    );

    return this.formatTransaction(reversal);
  }

  async listByUser(userId: string) {
    const transactions = await this.transactionRepository.findByUserWallet(userId);
    return transactions.map((t) => this.formatTransaction(t));
  }

  private formatTransaction(transaction: {
    id: string;
    type: string;
    status: string;
    amount: Prisma.Decimal;
    senderWalletId: string | null;
    receiverWalletId: string;
    reversalOfId: string | null;
    description: string | null;
    createdAt: Date;
  }) {
    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount.toString(),
      senderWalletId: transaction.senderWalletId,
      receiverWalletId: transaction.receiverWalletId,
      reversalOfId: transaction.reversalOfId,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
    };
  }
}
