type TransactionType = 'DEPOSIT' | 'TRANSFER' | 'REVERSAL';
type TransactionStatus = 'COMPLETED' | 'REVERSED';

const typeLabels: Record<TransactionType, string> = {
  DEPOSIT: 'Depósito',
  TRANSFER: 'Transferência',
  REVERSAL: 'Reversão',
};

const typeBadgeClass: Record<TransactionType, string> = {
  DEPOSIT: 'badge-deposit',
  TRANSFER: 'badge-transfer',
  REVERSAL: 'badge-reversal',
};

const statusLabels: Record<TransactionStatus, string> = {
  COMPLETED: 'Concluída',
  REVERSED: 'Revertida',
};

const statusBadgeClass: Record<TransactionStatus, string> = {
  COMPLETED: 'badge-completed',
  REVERSED: 'badge-reversed',
};

export function TypeBadge({ type }: { type: string }) {
  const key = type as TransactionType;
  return (
    <span className={typeBadgeClass[key] ?? 'badge bg-vault-700 text-vault-300'}>
      {typeLabels[key] ?? type}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const key = status as TransactionStatus;
  return (
    <span className={statusBadgeClass[key] ?? 'badge bg-vault-700 text-vault-300'}>
      {statusLabels[key] ?? status}
    </span>
  );
}
