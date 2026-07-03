# Módulo 1 — Auth, JWT, Access Token e Refresh Token

Guia de estudo profundo, focado **neste projeto**, para você dominar autenticação e explicar com segurança no code review.

Leia na ordem. Cada seção constrói em cima da anterior.

---

## Índice

1. [O problema que a autenticação resolve](#1-o-problema-que-a-autenticação-resolve)
2. [Conceitos base (sem jargão)](#2-conceitos-base-sem-jargão)
3. [O que é um JWT por dentro](#3-o-que-é-um-jwt-por-dentro)
4. [Access Token vs Refresh Token](#4-access-token-vs-refresh-token)
5. [Mapa de arquivos do módulo Auth](#5-mapa-de-arquivos-do-módulo-auth)
6. [Fluxo 1 — Cadastro e Login](#6-fluxo-1--cadastro-e-login)
7. [Fluxo 2 — Como a API protege rotas](#7-fluxo-2--como-a-api-protege-rotas)
8. [Fluxo 3 — Onde os tokens ficam no browser](#8-fluxo-3--onde-os-tokens-ficam-no-browser)
9. [Fluxo 4 — Refresh automático (o que implementamos)](#9-fluxo-4--refresh-automático-o-que-implementamos)
10. [Fluxo 5 — Logout](#10-fluxo-5--logout)
11. [Linha a linha: arquivos-chave](#11-linha-a-linha-arquivos-chave)
12. [Perguntas de entrevista + respostas](#12-perguntas-de-entrevista--respostas)
13. [Checklist de domínio](#13-checklist-de-domínio)
14. [Próximo passo de estudo](#14-próximo-passo-de-estudo)

---

## 1. O problema que a autenticação resolve

Quando você faz login, o servidor precisa responder a uma pergunta em **cada requisição seguinte**:

> "Quem é você? Você tem permissão para fazer isso?"

Sem autenticação, qualquer pessoa poderia chamar:

```
POST /api/transactions/transfer
```

e transferir dinheiro da conta de outra pessoa.

**Autenticação** = provar identidade.  
**Autorização** = provar que você pode acessar aquele recurso específico.

Neste projeto:
- **Autenticação**: JWT prova quem é o usuário (`sub` = id do usuário).
- **Autorização**: regras como "só reverta transações em que você participou" (`ReversalStrategy`).

---

## 2. Conceitos base (sem jargão)

### Sessão vs Token

| Abordagem | Como funciona | Usado aqui? |
|-----------|---------------|-------------|
| **Sessão no servidor** | Servidor guarda "usuário X logado" em memória/Redis; browser só tem um `sessionId` | Não |
| **Token (JWT)** | Servidor **não guarda sessão**; emite um "crachá digital" assinado; o cliente apresenta o crachá em cada request | **Sim** |

JWT = **JSON Web Token**. É um texto que carrega dados + assinatura criptográfica.

### Por que não mandar email/senha em toda requisição?

- Senha trafegaria o tempo todo (risco enorme).
- Servidor validaria senha no banco a cada clique (lento).
- Não dá para "expirar" uma senha sem trocar a senha do usuário.

Por isso: **login uma vez** → recebe **tokens** → usa tokens nas próximas chamadas.

### O que NÃO é guardado no token

- Senha (nunca).
- Saldo da wallet (muda o tempo todo; token seria mentiroso).
- Permissões complexas (poderia, mas aqui guardamos só `sub` e `email`).

---

## 3. O que é um JWT por dentro

Um JWT tem **3 partes** separadas por ponto (`.`):

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoiam9hb0B0ZXN0LmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwOTAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│____________________││______________________________________________________________││________________________│
      HEADER                              PAYLOAD (dados)                                    ASSINATURA
```

### Header
Algoritmo de assinatura (ex.: HS256).

### Payload (o que nosso projeto coloca)

Gerado em `auth.service.ts` → `generateTokens()`:

```typescript
const payload = { sub: userId, email };
```

| Campo | Significado |
|-------|-------------|
| `sub` | **Subject** — ID do usuário (padrão JWT) |
| `email` | Email do usuário (conveniência; não é obrigatório no padrão) |
| `iat` | Issued at — adicionado automaticamente pelo library |
| `exp` | Expiration — quando o token deixa de valer |

### Assinatura

O servidor assina com um **segredo** (`JWT_ACCESS_SECRET` ou `JWT_REFRESH_SECRET`).

- Se alguém alterar o payload, a assinatura não bate → token inválido.
- Só quem tem o segredo pode **criar** tokens válidos.

**Importante:** JWT não é criptografia. Qualquer um pode **ler** o payload (é Base64). Por isso **nunca** coloque senha ou dados sensíveis no JWT.

### Configuração no `.env`

```env
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars-long
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

- Access: expira em **15 minutos**
- Refresh: expira em **7 dias**
- Segredos **diferentes** — um token access não pode ser "reutilizado" como refresh

---

## 4. Access Token vs Refresh Token

Pense em um prédio com segurança:

| | Access Token | Refresh Token |
|---|--------------|---------------|
| **Analogia** | Crachá de visitante do dia | Documento na recepção para pegar novo crachá |
| **Vida útil** | Curta (15 min) | Longa (7 dias) |
| **Usado onde** | Toda chamada à API protegida (`Authorization: Bearer ...`) | Só no endpoint `/api/auth/refresh` |
| **Se vazar** | Dano limitado (expira rápido) | Dano maior (válido por dias) |
| **Segredo de assinatura** | `JWT_ACCESS_SECRET` | `JWT_REFRESH_SECRET` |

### Por que dois tokens?

Se só existisse um token de longa duração:
- Roubado no browser → atacante tem acesso por dias.

Se só existisse um token de curta duração:
- Usuário teria que fazer login a cada 15 minutos (péssima UX).

**Solução:** access curto + refresh longo. Quando o access expira, o app usa o refresh para pegar um par novo **sem pedir senha de novo**.

```mermaid
sequenceDiagram
    participant U as Usuário
    participant App as Next.js
    participant API as Nest API

    U->>App: Login (email + senha)
    App->>API: POST /auth/login
    API-->>App: accessToken (15m) + refreshToken (7d)
    App->>App: Salva em cookies httpOnly

    Note over U,API: ... 20 minutos depois, access expirou ...

    App->>API: GET /wallet/balance (access expirado)
    API-->>App: 401 Unauthorized
    App->>API: POST /auth/refresh (refreshToken)
    API-->>App: novo access + novo refresh
    App->>API: GET /wallet/balance (novo access)
    API-->>App: 200 OK + saldo
```

---

## 5. Mapa de arquivos do módulo Auth

### Backend (`apps/api/src`)

```
auth/
├── auth.module.ts          # Registra providers, Passport, JWT
├── auth.controller.ts      # Rotas HTTP: register, login, refresh, me
├── auth.service.ts         # Regras: hash senha, gerar/validar tokens
├── jwt.strategy.ts         # Como extrair e validar JWT nas rotas protegidas
├── dto/auth.dto.ts         # Validação de entrada (email, senha, refreshToken)
└── repositories/
    ├── auth.repository.interface.ts
    └── auth.repository.ts  # findByEmail, findById, create

common/
├── guards/jwt-auth.guard.ts       # Bloqueia rota se não tiver JWT válido
└── decorators/current-user.decorator.ts  # @CurrentUser() injeta dados do JWT
```

### Frontend (`apps/web/src`)

```
app/actions/wallet.actions.ts   # loginAction, registerAction, logoutAction
lib/auth-cookies.ts             # get/set/clear cookies httpOnly
lib/api.ts                      # apiRequest + refreshAccessToken (retry em 401)
middleware.ts                   # Protege /dashboard + refresh preventivo
```

---

## 6. Fluxo 1 — Cadastro e Login

### Cadastro (register)

```mermaid
sequenceDiagram
    participant B as Browser
    participant SA as registerAction
    participant API as AuthController
    participant S as AuthService
    participant DB as PostgreSQL

    B->>SA: Formulário (name, email, password)
    SA->>API: POST /api/auth/register
    API->>S: register(dto)
    S->>DB: email já existe?
    alt email duplicado
        S-->>API: 409 EmailAlreadyExists
    else email livre
        S->>S: argon2.hash(password)
        S->>DB: TRANSACTION: create User + Wallet
        S->>S: generateTokens(userId, email)
        S-->>API: { user, tokens }
        API-->>SA: 201
        SA->>SA: setAuthCookies(access, refresh)
        SA->>B: redirect /dashboard
    end
```

### Login

Mesma lógica, mas em vez de criar usuário:

1. `findByEmail(email)`
2. `argon2.verify(passwordHash, password)`
3. Se OK → `generateTokens()`

**Segurança:** mensagem sempre `"Invalid email or password"` — não revela se o email existe.

### Onde a senha vive

| Momento | O que acontece com a senha |
|---------|---------------------------|
| Cadastro | `argon2.hash()` → salva `passwordHash` no banco |
| Login | Compara com `argon2.verify()` |
| Depois do login | Senha **nunca mais** é usada até o próximo login |

**argon2** é função de hash lenta e resistente a brute-force (recomendação OWASP).

---

## 7. Fluxo 2 — Como a API protege rotas

Exemplo: `GET /api/wallet/balance`

```mermaid
flowchart TD
    A[Request chega com header Authorization: Bearer TOKEN] --> B{JwtAuthGuard}
    B -->|sem header ou token inválido| C[401 Unauthorized]
    B -->|token válido| D[JwtStrategy.validate]
    D --> E[request.user = sub, email]
    E --> F[WalletController.getBalance]
    F --> G[@CurrentUser pega user.sub]
    G --> H[WalletService.getBalanceByUserId]
```

### Peças e papéis

**1. `@UseGuards(JwtAuthGuard)`** no controller  
Ativa a verificação antes do método rodar.

**2. `JwtStrategy`** (`jwt.strategy.ts`)

```typescript
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
secretOrKey: JWT_ACCESS_SECRET
ignoreExpiration: false
```

- Lê o token do header `Authorization: Bearer <token>`
- Valida assinatura com `JWT_ACCESS_SECRET`
- Rejeita se expirado (`exp` no passado)

**3. `validate(payload)`**  
Transforma o payload JWT em objeto que o Nest injeta em `request.user`:

```typescript
return { sub: payload.sub, email: payload.email };
```

**4. `@CurrentUser()`**  
Atalho para pegar `request.user` no controller:

```typescript
getBalance(@CurrentUser() user: JwtPayload) {
  return this.walletService.getBalanceByUserId(user.sub);
}
```

### Rotas públicas vs protegidas

| Rota | Guard? |
|------|--------|
| `POST /auth/register` | Não |
| `POST /auth/login` | Não |
| `POST /auth/refresh` | Não (mas precisa refresh token válido no body) |
| `GET /auth/me` | Sim |
| `GET /wallet/balance` | Sim |
| `POST /transactions/*` | Sim |

---

## 8. Fluxo 3 — Onde os tokens ficam no browser

### O que NÃO fazemos (e por quê)

```javascript
// ERRADO — vulnerável a XSS
localStorage.setItem('token', accessToken);
```

Se um script malicioso rodar na página, ele lê `localStorage`.

### O que fazemos: cookies `httpOnly`

Arquivo: `apps/web/src/lib/auth-cookies.ts`

```typescript
cookieStore.set('access_token', accessToken, {
  httpOnly: true,      // JavaScript do browser NÃO consegue ler
  secure: isProduction, // só HTTPS em produção
  sameSite: 'lax',     // proteção básica contra CSRF
  path: '/',
  maxAge: 60 * 15,     // 15 minutos
});
```

| Cookie | maxAge | Conteúdo |
|--------|--------|----------|
| `access_token` | 15 min | JWT access |
| `refresh_token` | 7 dias | JWT refresh |

### Padrão BFF (Backend for Frontend)

```mermaid
flowchart LR
    Browser["Browser\n(só vê cookies)"] --> Next["Next.js Server\n(Server Actions)"]
    Next -->|"Authorization: Bearer"| API["Nest API"]
```

O **browser nunca vê o JWT em JavaScript**. Só o servidor Next.js:
1. Lê o cookie (`getAccessToken()`)
2. Coloca no header `Authorization` ao chamar a API
3. Grava novos cookies após refresh

**Frase para entrevista:**  
> "Usei Next como BFF: tokens em cookies httpOnly, Server Actions como única ponte para a API. O client não manipula JWT."

---

## 9. Fluxo 4 — Refresh automático (o que implementamos)

Há **dois mecanismos** complementares.

### Mecanismo A — Middleware (navegação)

Arquivo: `apps/web/src/middleware.ts`

Quando o usuário acessa `/dashboard`:

```
1. Tem access_token E/OU refresh_token?
   → Se nenhum: redirect /login

2. Access expirado ou expira em ≤ 30 segundos?
   → shouldRefreshAccessToken() decodifica o JWT e lê o campo `exp`

3. Se sim: POST /api/auth/refresh com refresh_token do cookie

4. Se refresh OK:
   → Grava novos cookies
   → Redirect para a mesma URL (para o Server Component ler cookie novo)

5. Se refresh falhou:
   → Limpa cookies
   → Redirect /login
```

**Por que redirect após refresh?**  
Cookies setados no middleware só valem na **próxima** request. O redirect garante que o dashboard carregue com token fresco.

### Mecanismo B — apiRequest (mutações)

Arquivo: `apps/web/src/lib/api.ts`

Usado em `depositAction`, `transferAction`, `reverseTransactionAction` com `refreshOnUnauthorized: true`:

```
1. Chama API com access_token atual
2. Se resposta = 401:
   a. refreshAccessToken() → POST /auth/refresh
   b. Atualiza cookies
   c. Repete a mesma chamada com novo access
3. Se refresh falhar → retorna "Session expired"
```

### Backend: o que `/auth/refresh` faz

Arquivo: `apps/api/src/auth/auth.service.ts` → `refresh()`

```typescript
async refresh(refreshToken: string): Promise<TokenPair> {
  // 1. Verifica assinatura com JWT_REFRESH_SECRET (não ACCESS!)
  const payload = await this.jwtService.verifyAsync(refreshToken, {
    secret: JWT_REFRESH_SECRET,
  });

  // 2. Usuário ainda existe no banco?
  const user = await this.authRepository.findById(payload.sub);

  // 3. Gera par NOVO (access + refresh)
  return this.generateTokens(user.id, user.email);
}
```

**Rotação:** cada refresh devolve **novo access E novo refresh**. O refresh antigo tecnicamente ainda vale até expirar (não temos blacklist ainda — gap honesto para mencionar na entrevista).

```mermaid
sequenceDiagram
    participant MW as middleware.ts
    participant API as AuthService.refresh
    participant DB as PostgreSQL

    MW->>MW: access expira em 20s
    MW->>API: POST /auth/refresh { refreshToken }
    API->>API: verify com JWT_REFRESH_SECRET
    API->>DB: findById(payload.sub)
    API->>API: generateTokens() — par novo
    API-->>MW: { accessToken, refreshToken }
    MW->>MW: setAuthCookies + redirect
```

---

## 10. Fluxo 5 — Logout

Arquivo: `wallet.actions.ts` → `logoutAction()`

```typescript
await clearAuthCookies();  // apaga access_token e refresh_token
redirect('/login');
```

**O que logout NÃO faz neste projeto:**
- Não invalida o JWT no servidor (não há blacklist).
- Tokens ainda seriam válidos até expirar se alguém tivesse copiado.

**Melhoria futura:** guardar refresh tokens revogados no Redis. Para o desafio, limpar cookies é suficiente.

---

## 11. Linha a linha: arquivos-chave

### `auth.service.ts` — `generateTokens()` (coração da emissão)

```typescript
private async generateTokens(userId: string, email: string): Promise<TokenPair> {
  const payload = { sub: userId, email };

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: JWT_ACCESS_SECRET,
      expiresIn: '15m',
    }),
    this.jwtService.signAsync(payload, {
      secret: JWT_REFRESH_SECRET,
      expiresIn: '7d',
    }),
  ]);

  return { accessToken, refreshToken };
}
```

**Pergunta que pode cair:** Por que `Promise.all`?  
**Resposta:** Os dois tokens são independentes; gerar em paralelo é mais rápido.

---

### `jwt.strategy.ts` — validação em rotas protegidas

```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: JWT_ACCESS_SECRET,
});
```

Só valida com **ACCESS** secret. Se alguém mandar refresh token no header Bearer, **falha** (segredo diferente).

---

### `loginAction` — ponte frontend

```typescript
const result = await apiRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

await setAuthCookies(
  result.data.tokens.accessToken,
  result.data.tokens.refreshToken,
);
redirect('/dashboard');
```

Ordem importa: cookies **antes** do redirect, senão o dashboard chegaria sem sessão.

---

### `middleware.ts` — `shouldRefreshAccessToken()`

```typescript
const expiresInSeconds = payload.exp - Math.floor(Date.now() / 1000);
return expiresInSeconds <= 30;  // renova 30s antes de expirar
```

Evita race condition: usuário abre dashboard no segundo exato da expiração.

---

## 12. Perguntas de entrevista + respostas

**1. O que é JWT e por que usamos?**  
> Token auto-contido e assinado que prova identidade sem sessão no servidor. Escalável e stateless.

**2. Diferença entre autenticação e autorização?**  
> Autenticação: quem é você (JWT). Autorização: pode fazer isso (ex.: só participantes revertem transação).

**3. Por que access curto e refresh longo?**  
> Balanceia segurança (access roubado expira rápido) com UX (não pedir senha a cada 15 min).

**4. Onde o token fica no browser e por quê?**  
> Cookie httpOnly no Next.js. JavaScript malicioso não acessa. Next envia Bearer para API.

**5. O que acontece se o access expirar durante um depósito?**  
> `apiRequest` recebe 401, chama refresh, repete depósito com novo token. Transparente pro usuário.

**6. O refresh token pode ser usado como access?**  
> Não. Segredos diferentes (`JWT_REFRESH_SECRET` vs `JWT_ACCESS_SECRET`). Strategy só aceita access.

**7. Por que argon2 e não guardar senha em texto?**  
> Hash irreversível. Vazamento do banco não expõe senhas reais.

**8. O servidor guarda sessão?**  
> Não. Estado está no JWT. Refresh só valida assinatura + usuário existe no banco.

**9. Qual a fraqueza do JWT puro?**  
> Não dá para revogar antes de expirar sem blacklist/Redis. Logout aqui só apaga cookies do cliente.

**10. O que é o padrão BFF neste projeto?**  
> Next.js como backend do frontend: cookies, refresh e chamadas à API ficam no servidor Next, não no browser.

---

## 13. Checklist de domínio

Marque quando conseguir explicar **sem olhar o código**:

- [ ] Diferença entre sessão server-side e JWT stateless
- [ ] Estrutura de um JWT (header.payload.signature)
- [ ] O que vai no payload (`sub`, `email`, `exp`)
- [ ] Por que access e refresh têm segredos diferentes
- [ ] Fluxo completo do login até cookie no browser
- [ ] Como `JwtAuthGuard` + `JwtStrategy` protegem uma rota
- [ ] O que `@CurrentUser()` faz
- [ ] Por que cookies httpOnly e não localStorage
- [ ] O que o middleware faz no refresh preventivo
- [ ] O que `apiRequest` faz no retry após 401
- [ ] O que `AuthService.refresh()` valida antes de emitir novos tokens
- [ ] Limitação: logout não invalida JWT no servidor

---

## 14. Próximo passo de estudo

Quando dominar este módulo, o próximo da série será:

**Módulo 2 — Transações financeiras** (`transactions.service.ts`, strategies, lock pessimista, ledger)

Enquanto isso, exercício prático:

1. Faça login e abra DevTools → Application → Cookies. Veja `access_token` e `refresh_token` (valores opacos — normal).
2. No Swagger (`/api/docs`), copie um access token e chame `GET /auth/me` com Authorize.
3. Espere 15+ minutos (ou altere temporariamente `JWT_ACCESS_EXPIRES_IN=1m` no `.env`) e acesse `/dashboard` de novo — o refresh deve renovar silenciosamente.
4. Leia na ordem: `auth.controller.ts` → `auth.service.ts` → `jwt.strategy.ts` → `auth-cookies.ts` → `middleware.ts` → `api.ts`.

---

## Referência rápida de endpoints

| Método | Rota | Auth? | Função |
|--------|------|-------|--------|
| POST | `/api/auth/register` | Não | Cria user + wallet + tokens |
| POST | `/api/auth/login` | Não | Valida senha + tokens |
| POST | `/api/auth/refresh` | Não* | Novo par de tokens |
| GET | `/api/auth/me` | Sim | Dados do usuário logado |

\* Precisa de `refreshToken` válido no body, não de access no header.
