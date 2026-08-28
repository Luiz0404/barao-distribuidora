# Dependências externas — Barão Distribuidora & Tabacaria

Este documento lista **todas** as dependências externas que o projeto usa após a migração,
para você provisionar antes/durante o deploy fora do Emergent.

---

## 1. Infraestrutura obrigatória

| Serviço | Papel | Obrigatório? | Alternativa gratuita sugerida |
|---|---|---|---|
| **MongoDB** | Banco de dados (produtos, categorias, promoções, cupons, pedidos, config, usuários) | ✅ Sim | [MongoDB Atlas](https://www.mongodb.com/atlas) — free tier M0 (512 MB) |
| **Host do backend** | Rodar o FastAPI (uvicorn) | ✅ Sim | Render / Railway / Fly.io / Lovable (se suportar Python) |
| **Host do frontend** | Servir o build React estático | ✅ Sim | Vercel / Netlify / Lovable |
| **Volume persistente** no backend | Guardar fotos em `backend/uploads/` entre deploys | ✅ Sim (se usar disco local) | Render Persistent Disk, Fly Volume, Railway Volume. Se o host for serverless, trocar por S3/R2 |

---

## 2. Bibliotecas de código (já dentro do projeto)

### Backend (`backend/requirements.txt`)

Núcleo em produção:
- `fastapi==0.110.1`, `uvicorn==0.25.0`
- `motor==3.3.1`, `pymongo==4.6.3` — driver MongoDB
- `pydantic>=2.6.4`, `email-validator>=2.2.0`
- `pyjwt>=2.10.1`, `bcrypt==4.1.3` — autenticação
- `python-dotenv>=1.0.1`
- `python-multipart>=0.0.9` — upload de arquivos

Nenhuma dependência de SDK proprietário do Emergent permanece. A biblioteca
`emergentintegrations` está listada no requirements.txt mas **não é mais importada** pelo `server.py` — pode ser removida sem impacto, se preferir enxugar.

### Frontend (`frontend/package.json`)

- `react@19`, `react-router-dom@7`
- `@tanstack/react-query`, `axios`
- `tailwindcss`, `tailwindcss-animate`, `class-variance-authority`
- `@radix-ui/*` (base do shadcn/ui) — todos os componentes visuais
- `framer-motion` — animações
- `lucide-react` — ícones
- `sonner` — toasts
- `embla-carousel-react` — carrossel

Todos são pacotes públicos do npm. Nada é do Emergent.

---

## 3. Integrações de terceiros usadas em runtime

| Integração | Como é usada | Chave necessária |
|---|---|---|
| **WhatsApp** (link `wa.me`) | Deep link para abrir a conversa. Não usa API do WhatsApp Business. | Nenhuma |
| **Google Maps** (iframe embed) | Mapa da loja na seção *Localização*. Usa o embed público. | Nenhuma (o admin pode colar uma embed URL customizada) |
| **Unsplash** | Imagens de fallback nos cards de categorias, servidas direto do CDN público. | Nenhuma |
| **Google Fonts** (Outfit + Manrope) | Tipografia carregada via CSS `@import`. | Nenhuma |

---

## 4. O que **não** existe mais no projeto (removido do Emergent)

| Antes | Agora |
|---|---|
| `EMERGENT_LLM_KEY` + `INTEGRATION_PROXY_URL` para object storage | Substituído por **disco local** em `backend/uploads/` |
| Logo hospedado em `customer-assets.emergentagent.com` | Baixado para `frontend/public/logo.jpg` |
| Nenhum LLM (GPT/Claude/Gemini) usado — nada a remover | — |
| Nenhum Stripe/pagamento — nada a remover | — |

Você **não precisa** mais das chaves `EMERGENT_LLM_KEY` nem `INTEGRATION_PROXY_URL` em nenhum ambiente.

---

## 5. Variáveis de ambiente por camada

### Backend
```
MONGO_URL=            # obrigatório
DB_NAME=              # obrigatório (ex: barao)
CORS_ORIGINS=         # domínio(s) do frontend, separados por vírgula
JWT_SECRET=           # gere: python -c "import secrets; print(secrets.token_hex(32))"
ADMIN_EMAIL=          # e-mail do proprietário
ADMIN_PASSWORD=       # senha inicial (será reaplicada se mudar)
```

### Frontend
```
REACT_APP_BACKEND_URL= # URL pública do backend
```

---

## 6. Passo a passo — deploy Lovable/Vercel/Render

1. **MongoDB Atlas** → criar cluster free M0 → *Database Access* (user/senha) → *Network Access* (0.0.0.0/0) → copiar connection string.
2. **Backend em Render** (ou Lovable, se suportar Python long-running):
   - New Web Service → conectar repo → *Root Directory* `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Env vars: as 6 do item 5 acima.
   - **Ativar Persistent Disk** montado em `/opt/render/project/src/backend/uploads` (Render) — imprescindível para as fotos persistirem.
3. **Frontend na Vercel/Netlify/Lovable**:
   - Root: `frontend`
   - Framework: Create React App
   - Env: `REACT_APP_BACKEND_URL=https://<url-do-backend>`
4. **Ajustar CORS**: depois de saber a URL do frontend, seta `CORS_ORIGINS=https://<seu-dominio>` no backend e redeploy.
5. **Login inicial**: `/admin/login` com `ADMIN_EMAIL` + `ADMIN_PASSWORD` do env.

**Custo total nesta configuração: R$ 0/mês** enquanto ficar dentro do free tier.

---

## 7. Riscos e observações

- **Serverless (Vercel Functions, Cloud Run scale-to-zero)**: o disco `backend/uploads/` é volátil — se planeja usar, troque a implementação de `put_object`/`get_object` em `backend/server.py` por Cloudflare R2 (S3-compatible, 10 GB free) ou Supabase Storage.
- **Cold start** em free tiers (Render, Fly free): o primeiro request após inatividade demora ~30 s. Aceitável para uma loja pequena.
- **Backup**: exporte periodicamente `backend/uploads/` **e** um `mongodump` do Atlas.
- **Segurança**: `CORS_ORIGINS="*"` é ok em dev, mas em produção coloque o domínio exato do frontend para não vazar acesso.
