import { Prisma } from '@prisma/client';

export function buildTransactionDateRangeFilter(
  startDate?: string,
  endDate?: string,
): Prisma.TransactionWhereInput | undefined {
  const createdAt: Prisma.DateTimeFilter = {};

  const start = startDate?.trim();
  const end = endDate?.trim();

  if (start) {
    createdAt.gte = new Date(`${start}T00:00:00.000Z`);
  }

  if (end) {
    createdAt.lte = new Date(`${end}T23:59:59.999Z`);
  }

  if (Object.keys(createdAt).length === 0) {
    return undefined;
  }

  return { createdAt };
}
