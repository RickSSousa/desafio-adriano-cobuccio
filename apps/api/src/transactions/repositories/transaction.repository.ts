import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module';
import { ITransactionRepository } from './transaction.repository.interface';
import { buildTransactionSearchFilter } from '../utils/transaction-search.util';

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

  private userWalletWhere(userId: string, search?: string): Prisma.TransactionWhereInput {
    const walletScope: Prisma.TransactionWhereInput = {
      OR: [{ senderWallet: { userId } }, { receiverWallet: { userId } }],
    };

    const searchFilter = buildTransactionSearchFilter(search);
    if (!searchFilter) {
      return walletScope;
    }

    return { AND: [walletScope, searchFilter] };
  }

  async findByUserWalletPaginated(userId: string, page: number, take: number, search?: string) {
    const where = this.userWalletWhere(userId, search);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          senderWallet: { select: { id: true, userId: true } },
          receiverWallet: { select: { id: true, userId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, total };
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
