import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module';
import { ITransactionRepository } from './transaction.repository.interface';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        senderWallet: { select: { id: true, userId: true } },
        receiverWallet: { select: { id: true, userId: true } },
      },
    });
  }

  findByIdempotencyKey(key: string) {
    return this.prisma.transaction.findUnique({ where: { idempotencyKey: key } });
  }

  findByUserWallet(userId: string) {
    return this.prisma.transaction.findMany({
      where: {
        OR: [
          { senderWallet: { userId } },
          { receiverWallet: { userId } },
        ],
      },
      include: {
        senderWallet: { select: { id: true, userId: true } },
        receiverWallet: { select: { id: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(
    tx: Prisma.TransactionClient,
    data: Parameters<ITransactionRepository['create']>[1],
  ) {
    return tx.transaction.create({ data });
  }

  markAsReversed(tx: Prisma.TransactionClient, id: string) {
    return tx.transaction.update({
      where: { id },
      data: { status: 'REVERSED' },
    });
  }
}
