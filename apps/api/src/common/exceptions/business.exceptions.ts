import { DomainException } from './domain.exception';
import { HttpStatus } from '@nestjs/common';

export class InsufficientBalanceException extends DomainException {
  constructor() {
    super('Insufficient balance for this transfer', HttpStatus.BAD_REQUEST);
  }
}

export class TransactionAlreadyReversedException extends DomainException {
  constructor() {
    super('Transaction has already been reversed', HttpStatus.CONFLICT);
  }
}

export class UnauthorizedTransactionAccessException extends DomainException {
  constructor() {
    super('You are not authorized to access this transaction', HttpStatus.FORBIDDEN);
  }
}

export class WalletNotFoundException extends DomainException {
  constructor() {
    super('Wallet not found', HttpStatus.NOT_FOUND);
  }
}

export class TransactionNotFoundException extends DomainException {
  constructor() {
    super('Transaction not found', HttpStatus.NOT_FOUND);
  }
}

export class UserNotFoundException extends DomainException {
  constructor() {
    super('User not found', HttpStatus.NOT_FOUND);
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super('Invalid email or password', HttpStatus.UNAUTHORIZED);
  }
}

export class EmailAlreadyExistsException extends DomainException {
  constructor() {
    super('Email already registered', HttpStatus.CONFLICT);
  }
}

export class InvalidTransactionTypeException extends DomainException {
  constructor() {
    super('This transaction type cannot be reversed', HttpStatus.BAD_REQUEST);
  }
}
