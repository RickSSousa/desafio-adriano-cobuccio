'use client';

import { useState, type ChangeEvent } from 'react';
import { digitsToSubmitValue, extractDigits, formatCurrencyMask } from '@/lib/currency-mask';

interface CurrencyInputProps {
  name?: string;
  id?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function CurrencyInput({
  name = 'amount',
  id,
  required = false,
  className = 'input',
  placeholder = 'R$ 0,00',
}: CurrencyInputProps) {
  const [digits, setDigits] = useState('');
  const displayValue = digits ? formatCurrencyMask(digits) : '';
  const submitValue = digitsToSubmitValue(digits);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDigits(extractDigits(event.target.value));
  };

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={className}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        aria-label="Valor em reais"
      />
      <input type="hidden" name={name} value={submitValue} required={required} />
    </>
  );
}
