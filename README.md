# Carteira Financeira - Desafio Técnico

Aplicação fullstack de carteira financeira com cadastro, autenticação JWT, depósito, transferência e reversão de transações.

## Stack

| Camada        | Tecnologia                                 |
| ------------- | ------------------------------------------ |
| Backend       | NestJS 11 + TypeScript                     |
| Frontend      | Next.js 16 (App Router + Server Actions)   |
| Banco         | PostgreSQL + Prisma ORM                    |
| Auth          | JWT (access + refresh) em cookies httpOnly |
| Hash de senha | argon2                                     |
| Monorepo      | pnpm workspaces                            |
| Infra         | Docker Compose                             |

## Arquitetura

```
Browser → Next.js (Server Actions + BFF) → NestJS API → PostgreSQL
```

### Backend (NestJS)

Organizado por módulos de feature (`auth`, `wallet`, `transactions`):

- **Controller** — recebe DTOs, validação com `class-validator`
- **Service** — regras de negócio
- **Strategy** — `DepositStrategy`, `TransferStrategy`, `ReversalStrategy` (Open/Closed)
- **Repository** — interfaces (`IWalletRepository`, `ITransactionRepository`) com implementação Prisma
- **GlobalExceptionFilter** — erros de domínio com payload consistente

### Modelagem financeira (Ledger append-only)

- Transações nunca são apagadas; reversão cria uma transação compensatória (`REVERSAL`)
- Saldo pode ficar negativo (depósito sempre soma ao valor atual)
- `idempotencyKey` evita duplicidade por duplo clique
- Lock pessimista (`SELECT ... FOR UPDATE`) em operações concorrentes

## Como rodar

### Pré-requisitos

- Node.js >= 20.9
- pnpm >= 9
- Docker e Docker Compose (recomendado)

### Opção 1: Docker Compose (recomendado para entrevista)

```bash
cp .env.example .env
docker compose up --build
```

Acesse:

- Frontend: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs
- Health: http://localhost:3001/api/health

### Opção 2: Desenvolvimento local

```bash
cp .env.example .env

# Subir apenas o Postgres
docker compose up postgres -d

# Instalar dependências
pnpm install

# Migrar banco e gerar Prisma Client
pnpm --filter api db:generate
pnpm --filter api db:migrate:dev

# Rodar API e Web em paralelo
pnpm dev
```

## Testes

```bash
# Unitários
pnpm test

# Integração (requer Postgres rodando via Docker)
docker compose up postgres -d
pnpm db:migrate:dev
pnpm test:e2e
```

## Roteiro de teste manual (5 minutos)

Use este fluxo para validar tudo antes ou durante a entrevista:

1. **Cadastro** — acesse http://localhost:3000/register e crie `alice@test.com`
2. **Segundo usuário** — crie `bob@test.com` em outra aba anônima
3. **Depósito** — no dashboard da Alice, deposite `R$ 200,00`
4. **Transferência** — transfira `R$ 50,00` para `bob@test.com`
5. **Saldo** — Alice deve ter `R$ 150,00`, Bob `R$ 50,00`
6. **Saldo insuficiente** — tente transferir `R$ 9999,00` (deve falhar)
7. **Reversão** — clique em "Reverter" na transferência; saldos voltam ao estado anterior
8. **Swagger** — teste os mesmos endpoints em http://localhost:3001/api/docs
9. **Health** — confirme http://localhost:3001/api/health retorna `status: ok`
