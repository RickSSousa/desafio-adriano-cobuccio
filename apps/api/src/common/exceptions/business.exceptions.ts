import { DomainException } from "./domain.exception";
import { HttpStatus } from "@nestjs/common";

export class InsufficientBalanceException extends DomainException {
  constructor() {
    super("Saldo insuficiente para esta transferência", HttpStatus.BAD_REQUEST);
  }
}

export class TransactionAlreadyReversedException extends DomainException {
  constructor() {
    super("Transação já foi revertida", HttpStatus.CONFLICT);
  }
}

export class UnauthorizedTransactionAccessException extends DomainException {
  constructor() {
    super(
      "Você não tem permissão para acessar esta transação",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class WalletNotFoundException extends DomainException {
  constructor() {
    super("Carteira não encontrada", HttpStatus.NOT_FOUND);
  }
}

export class TransactionNotFoundException extends DomainException {
  constructor() {
    super("Transação não encontrada", HttpStatus.NOT_FOUND);
  }
}

export class UserNotFoundException extends DomainException {
  constructor() {
    super("Usuário não encontrado", HttpStatus.NOT_FOUND);
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
    super("Email ou senha inválidos", HttpStatus.UNAUTHORIZED);
  }
}

export class EmailAlreadyExistsException extends DomainException {
  constructor() {
    super("Email já registrado", HttpStatus.CONFLICT);
  }
}

export class InvalidTransactionTypeException extends DomainException {
  constructor() {
    super(
      "Este tipo de transação não pode ser revertido",
      HttpStatus.BAD_REQUEST,
    );
  }
}
