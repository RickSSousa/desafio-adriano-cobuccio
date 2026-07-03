/** Extrai apenas dígitos (valor em centavos como string). */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formata centavos para exibição em pt-BR (R$ 1.234,56). */
export function formatCurrencyMask(digits: string): string {
  const cents = Number(extractDigits(digits) || '0');
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/** Converte centavos para string decimal com ponto (ex: "10.50") para o servidor. */
export function digitsToSubmitValue(digits: string): string {
  const cents = Number(extractDigits(digits) || '0');
  if (cents <= 0) return '';
  return (cents / 100).toFixed(2);
}
