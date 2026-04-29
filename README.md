# Sistema de Rastreamento de Entregas

Sistema completo de rastreamento com:

- painel administrativo com login JWT
- CRUD de rastreios
- atualizacao de status com historico
- consulta do cliente por CPF + codigo
- PostgreSQL com criacao automatica das tabelas
- frontend responsivo com HTML, CSS e JavaScript puro

## Requisitos

- Node.js 18+
- PostgreSQL local em execucao
- arquivo `.env` com `DATABASE_URL` e `JWT_SECRET`

## Instalacao

1. Instale as dependencias:

```bash
npm install
```

2. Configure o ambiente com base em `.env.example`.

3. Inicie o projeto:

```bash
npm run dev
```

Ou em modo normal:

```bash
npm start
```

## Acesso

- Cliente: `http://localhost:3000/rastrear.html`
- Admin: `http://localhost:3000/admin`

## Admin inicial

O sistema cria automaticamente um admin inicial no primeiro start:

- usuario: valor de `ADMIN_USERNAME` ou `admin`
- senha: valor de `ADMIN_PASSWORD` ou `admin123456`

## Estrutura

```text
src/
  config/db.js
  controllers/
  db/ensureSchema.js
  middlewares/
  routes/
public/
  admin/
  scripts/
  styles/
server.js
```

## Tabelas criadas automaticamente

- `admins`
- `trackings`
- `tracking_history`

## Fluxo principal

- Admin faz login
- Admin cria rastreios e atualiza status
- Cada criacao ou atualizacao relevante gera um item em `tracking_history`
- Cliente consulta usando CPF e codigo do rastreio
- Sistema exibe resumo da entrega e linha do tempo
