# Barão Distribuidora & Tabacaria

Site premium (dark/gold) + painel administrativo para a **Barão Distribuidora & Tabacaria**.
Pedidos são fechados pelo WhatsApp e o proprietário gerencia produtos, categorias, promoções,
cupons de desconto, pedidos recebidos e configurações da loja pelo painel.

**Stack:** React 19 (CRA + craco) · Tailwind + shadcn/ui · FastAPI · MongoDB · JWT

Para o guia completo de dependências e deploy externo, ver [`DEPENDENCIES.md`](./DEPENDENCIES.md).

---

## Estrutura

```
/app
├── backend/          FastAPI + Motor (Mongo async)
│   ├── server.py     Todos os endpoints em /api
│   ├── uploads/      Fotos de produtos/categorias/promoções (disco local)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env          MONGO_URL, JWT_SECRET, ADMIN_EMAIL, ...
└── frontend/         React CRA + craco
    ├── src/
    │   ├── pages/    HomePage, AdminLogin, AdminDashboard
    │   ├── components/
    │   ├── context/  AuthContext, CartContext
    │   └── lib/api.js
    ├── public/logo.jpg
    ├── .env.example
    └── .env          REACT_APP_BACKEND_URL
```

---

## Rodar localmente

### Requisitos
- Node ≥ 18, Yarn
- Python ≥ 3.10
- MongoDB rodando (local, Docker ou Atlas)

### Backend
```bash
cd backend
cp .env.example .env    # ajuste MONGO_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
cp .env.example .env    # REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start              # http://localhost:3000
```

Ao subir o backend pela primeira vez, ele:
1. cria índices no MongoDB,
2. cadastra um usuário admin com `ADMIN_EMAIL` / `ADMIN_PASSWORD`,
3. semeia as 4 categorias padrão (Bebidas, Tabacaria, Combos, Gelo/Carvão),
4. cria uma configuração padrão de WhatsApp/horários.

Acesse `/admin/login` com essas credenciais para gerenciar tudo.

---

## Variáveis de ambiente

### Backend (`backend/.env`)

| Chave | Descrição |
|---|---|
| `MONGO_URL` | Conexão do MongoDB (`mongodb://...` local ou `mongodb+srv://...` do Atlas) |
| `DB_NAME` | Nome do banco (ex.: `barao`) |
| `CORS_ORIGINS` | Origem(ns) do frontend, separadas por vírgula. Use `*` só para testes |
| `JWT_SECRET` | 64 chars aleatórios. Gere com `python -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_EMAIL` | E-mail do proprietário — usado no login do painel |
| `ADMIN_PASSWORD` | Senha inicial (reaplicada a cada boot se mudar no .env) |

### Frontend (`frontend/.env`)

| Chave | Descrição |
|---|---|
| `REACT_APP_BACKEND_URL` | URL pública do backend (ex.: `https://api.baraodistribuidora.com`) |

---

## Endpoints (todos sob `/api`)

| Grupo | Rota | Público? |
|---|---|---|
| Auth | `POST /auth/login`, `GET /auth/me` | mistas |
| Categorias | `GET /categories` público · `POST/PUT/DELETE` admin |
| Produtos | `GET /products` público · `POST/PUT/DELETE` admin |
| Promoções | `GET /promotions` público · `POST/PUT/DELETE` admin |
| Cupons | `POST /coupons/validate` público · CRUD admin |
| Pedidos | `POST /orders` público · `GET/DELETE/stats` admin |
| Configurações | `GET /config` público · `PUT /config` admin |
| Uploads | `POST /upload` admin · `GET /files/{path}` público |

Autenticação: `Authorization: Bearer <token JWT>` (token retornado pelo `/api/auth/login`).

---

## Upload de imagens

As fotos ficam em disco local dentro de `backend/uploads/`. É portátil, mas exige:

- **Volume persistente no host** — em Render/Railway/Fly.io ative *persistent disk*.
- Em plataformas serverless (Vercel Functions, AWS Lambda) o disco é volátil e as fotos somem no próximo deploy — nesses casos, troque `put_object`/`get_object` em `backend/server.py` por S3/R2/Supabase.
- **Backup**: inclua `backend/uploads/` no seu backup (ou substitua por object storage).

---

## Deploy externo sugerido (grátis)

| Camada | Serviço | Observação |
|---|---|---|
| MongoDB | **MongoDB Atlas** free (512 MB) | Copie a URI para `MONGO_URL` |
| Backend | **Render** / **Railway** / **Fly.io** | Ative disco persistente para `uploads/` |
| Frontend | **Vercel** / **Netlify** / **Lovable** | Configure `REACT_APP_BACKEND_URL` |

Passo a passo detalhado em `DEPENDENCIES.md`.

---

## Credenciais padrão de desenvolvimento

Ver `/app/memory/test_credentials.md`. **Troque `ADMIN_PASSWORD` antes de subir em produção.**

---

## Licença
Uso interno da Barão Distribuidora & Tabacaria.
