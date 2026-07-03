import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.module';
import { WalletService } from '../wallet/wallet.service';
import { TRANSACTION_REPOSITORY } from './repositories/transaction.repository.interface';
import { WALLET_REPOSITORY } from '../wallet/repositories/wallet.repository.interface';
import { DepositStrategy } from './strategies/deposit.strategy';
import { TransferStrategy } from './strategies/transfer.strategy';
import { ReversalStrategy } from './strategies/reversal.strategy';
import { InsufficientBalanceException } from '../common/exceptions/business.exceptions';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const walletService = {
    getWalletByUserId: jest.fn(),
  };
  const transactionRepository = {
    findByIdempotencyKey: jest.fn(),
    findById: jest.fn(),
    findByUserWallet: jest.fn(),
  };
  const walletRepository = {
    findByEmail: jest.fn(),
  };
  const depositStrategy = { execute: jest.fn() };
  const transferStrategy = { execute: jest.fn() };
  const reversalStrategy = { execute: jest.fn() };
  const prisma = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: WalletService, useValue: walletService },
        { provide: TRANSACTION_REPOSITORY, useValue: transactionRepository },
        { provide: WALLET_REPOSITORY, useValue: walletRepository },
        { provide: DepositStrategy, useValue: depositStrategy },
        { provide: TransferStrategy, useValue: transferStrategy },
        { provide: ReversalStrategy, useValue: reversalStrategy },
      ],
    }).compile();

    service = module.get(TransactionsService);
  });

  it('should deposit money', async () => {
    walletService.getWalletByUserId.mockResolvedValue({ id: 'wallet-1' });
    transactionRepository.findByIdempotencyKey.mockResolvedValue(null);
    depositStrategy.execute.mockResolvedValue({
      id: 'tx-1',
      type: 'DEPOSIT',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(100),
      senderWalletId: null,
      receiverWalletId: 'wallet-1',
      reversalOfId: null,
      description: null,
      createdAt: new Date(),
    });
    prisma.$transaction.mockImplementation(async (fn) => fn({}));

    const result = await service.deposit('user-1', { amount: 100 });

    expect(result.type).toBe('DEPOSIT');
    expect(result.amount).toBe('100');
  });

  it('should return existing transaction for duplicate idempotency key', async () => {
    transactionRepository.findByIdempotencyKey.mockResolvedValue({
      id: 'tx-existing',
      type: 'DEPOSIT',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(50),
      senderWalletId: null,
      receiverWalletId: 'wallet-1',
      reversalOfId: null,
      description: null,
      createdAt: new Date(),
    });

    const result = await service.deposit('user-1', {
      amount: 50,
      idempotencyKey: 'key-1',
    });

    expect(result.id).toBe('tx-existing');
    expect(depositStrategy.execute).not.toHaveBeenCalled();
  });

  it('should throw InsufficientBalanceException from transfer strategy', async () => {
    walletService.getWalletByUserId.mockResolvedValue({ id: 'wallet-1' });
    walletRepository.findByEmail.mockResolvedValue({ id: 'wallet-2' });
    transactionRepository.findByIdempotencyKey.mockResolvedValue(null);
    transferStrategy.execute.mockRejectedValue(new InsufficientBalanceException());
    prisma.$transaction.mockImplementation(async (fn) => fn({}));

    await expect(
      service.transfer('user-1', {
        recipientEmail: 'other@test.com',
        amount: 999,
      }),
    ).rejects.toBeInstanceOf(InsufficientBalanceException);
  });

  it('should reverse a transaction', async () => {
    transactionRepository.findById.mockResolvedValue({
      id: 'tx-1',
      type: 'TRANSFER',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(30),
      senderWalletId: 'wallet-1',
      receiverWalletId: 'wallet-2',
      senderWallet: { id: 'wallet-1', userId: 'user-1' },
      receiverWallet: { id: 'wallet-2', userId: 'user-2' },
    });
    reversalStrategy.execute.mockResolvedValue({
      id: 'tx-reversal',
      type: 'REVERSAL',
      status: 'COMPLETED',
      amount: new Prisma.Decimal(30),
      senderWalletId: 'wallet-2',
      receiverWalletId: 'wallet-1',
      reversalOfId: 'tx-1',
      description: 'Reversal',
      createdAt: new Date(),
    });
    prisma.$transaction.mockImplementation(async (fn) => fn({}));

    const result = await service.reverse('user-1', 'tx-1');

    expect(result.type).toBe('REVERSAL');
    expect(result.reversalOfId).toBe('tx-1');
  });
});
