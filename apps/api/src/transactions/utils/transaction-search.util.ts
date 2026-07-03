import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';

const TYPE_KEYWORDS: Record<string, TransactionType> = {
  deposit: 'DEPOSIT',
  deposito: 'DEPOSIT',
  depósito: 'DEPOSIT',
  transfer: 'TRANSFER',
  transferencia: 'TRANSFER',
  transferência: 'TRANSFER',
  reversal: 'REVERSAL',
  reversao: 'REVERSAL',
  reversão: 'REVERSAL',
  estorno: 'REVERSAL',
};

const STATUS_KEYWORDS: Record<string, TransactionStatus> = {
  completed: 'COMPLETED',
  concluida: 'COMPLETED',
  concluída: 'COMPLETED',
  reversed: 'REVERSED',
  revertida: 'REVERSED',
};

const TRANSACTION_TYPES = new Set<string>(['DEPOSIT', 'TRANSFER', 'REVERSAL']);
const TRANSACTION_STATUSES = new Set<string>(['COMPLETED', 'REVERSED']);

export function buildTransactionSearchFilter(
  search?: string,
): Prisma.TransactionWhereInput | undefined {
  const term = search?.trim();
  if (!term) {
    return undefined;
  }

  const normalized = term.toLowerCase();
  const orConditions: Prisma.TransactionWhereInput[] = [
    { description: { contains: term, mode: 'insensitive' } },
  ];

  const typeKeyword = TYPE_KEYWORDS[normalized];
  if (typeKeyword) {
    orConditions.push({ type: typeKeyword });
  } else if (TRANSACTION_TYPES.has(term.toUpperCase())) {
    orConditions.push({ type: term.toUpperCase() as TransactionType });
  }

  const statusKeyword = STATUS_KEYWORDS[normalized];
  if (statusKeyword) {
    orConditions.push({ status: statusKeyword });
  } else if (TRANSACTION_STATUSES.has(term.toUpperCase())) {
    orConditions.push({ status: term.toUpperCase() as TransactionStatus });
  }

  const amountValue = Number(term.replace(',', '.'));
  if (!Number.isNaN(amountValue) && amountValue > 0) {
    orConditions.push({ amount: { equals: new Prisma.Decimal(amountValue) } });
  }

  return { OR: orConditions };
}
