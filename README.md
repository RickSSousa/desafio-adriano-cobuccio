# Carteira Financeira - Desafio Técnico

Aplicação fullstack de carteira financeira com cadastro, autenticação JWT, depósito, transferência e reversão de transações.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | NestJS 11 + TypeScript |
| Frontend | Next.js 16 (App Router + Server Actions) |
| Banco | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh) em cookies httpOnly |
| Hash de senha | argon2 |
| Monorepo | pnpm workspaces |
| Infra | Docker Compose |

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

### Script rápido (Windows)

Com Docker Desktop aberto:

```powershell
.\scripts\start-interview.ps1
```

## O que explicar no code review

### Por que NestJS + Next.js separados?
- NestJS expõe API REST documentada (Swagger) e regras de negócio testáveis
- Next.js atua como BFF: Server Actions + cookies httpOnly protegem o JWT

### Por que ledger append-only?
- Transações financeiras precisam de audit trail
- Reversão = nova transação compensatória, nunca DELETE
- Permite rastrear inconsistências e quem solicitou a reversão

### Por que Strategy pattern?
- Cada tipo de operação (depósito, transferência, reversão) tem regras distintas
- Open/Closed: adicionar novo tipo sem alterar `TransactionsService`

### Por que lock pessimista?
- Duas transferências simultâneas do mesmo saldo causariam double-spend
- `SELECT ... FOR UPDATE` dentro de `prisma.$transaction` garante atomicidade

### Por que saldo negativo é permitido?
- Requisito do desafio: depósito soma ao valor atual mesmo se negativo
- Cenário real: reversão de transferência quando o destinatário já gastou o valor

### Segurança
- argon2id para senhas (OWASP)
- JWT nunca no localStorage (XSS)
- Rate limiting em auth
- Validação whitelist nos DTOs
- Autorização por recurso (só vê próprias transações)

## Endpoints principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Cadastro + criação de wallet |
| POST | `/api/auth/login` | Login |
| GET | `/api/wallet/balance` | Saldo da carteira |
| POST | `/api/transactions/deposit` | Depósito |
| POST | `/api/transactions/transfer` | Transferência |
| POST | `/api/transactions/:id/reverse` | Reversão |
| GET | `/api/transactions` | Histórico |

## Segurança

- Senhas com **argon2id**
- JWT nunca exposto ao browser (cookies `httpOnly`)
- Rate limiting em login/registro
- Helmet + CORS restrito
- Validação de entrada com whitelist
- Autorização por recurso (usuário só acessa própria wallet/transações)

## Decisões de design (para o code review)

1. **Ledger append-only** — auditabilidade e reversão sem perder histórico
2. **Strategy pattern** — novos tipos de transação sem alterar service existente
3. **Repository interfaces** — Dependency Inversion, facilita testes unitários
4. **Next.js como BFF** — Server Actions + cookies httpOnly eliminam XSS em tokens
5. **Prisma Decimal** — precisão monetária (sem float)

## Próximos passos (fora do escopo)

- Observabilidade completa (OpenTelemetry, Prometheus/Grafana)
- CI/CD pipeline
- Refresh token rotation com blacklist
- Notificações em tempo real
