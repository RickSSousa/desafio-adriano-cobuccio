import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.module';
import { IWalletRepository } from './wallet.repository.interface';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  findById(id: string) {
    return this.prisma.wallet.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.wallet.findFirst({
      where: { user: { email } },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async lockById(tx: Prisma.TransactionClient, id: string) {
    await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${id} FOR UPDATE`;
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id } });
    return wallet;
  }

  async updateBalance(tx: Prisma.TransactionClient, id: string, delta: Prisma.Decimal) {
    return tx.wallet.update({
      where: { id },
      data: {
        balance: { increment: delta },
      },
    });
  }
}
