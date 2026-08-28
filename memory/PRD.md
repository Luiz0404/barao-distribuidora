# PRD — Barão Distribuidora & Tabacaria

## Problema
Criar um site premium + admin para a Barão Distribuidora & Tabacaria (Rondonópolis-MT). Foco: venda rápida via WhatsApp, catálogo administrável, promoções, experiência mobile-first, identidade dark/dourado com toques de vermelho/laranja.

## Personas
- **Cliente final** (mobile): quer ver produtos, adicionar ao carrinho e finalizar via WhatsApp em poucos toques.
- **Proprietário Barão** (desktop/mobile): quer cadastrar produtos, subir fotos, criar promoções, configurar horário/endereço.

## Core Requirements
- Landing dark premium com hero, categorias, catálogo filtrado, Promoção do Dia, localização, rodapé.
- Carrinho persistente (localStorage), checkout via WhatsApp com nome + observações.
- Admin login JWT (email/senha).
- CRUD: produtos, categorias, promoções, configurações (WhatsApp, Instagram, endereço, horário, mapa).
- Upload de imagens no object storage Emergent.
- Botão flutuante do WhatsApp com pulso.

## What's implemented (v1 — Fev/2026)
- FastAPI backend com `/api/auth/login`, `/api/auth/me`, CRUD `/api/products`, `/api/categories`, `/api/promotions`, `/api/config`, `POST /api/upload`, `GET /api/files/{path}`.
- Admin seed (`luizcarlos221fg@gmail.com` / `barao123`) + 4 categorias padrão.
- Frontend: Loader com coroa, Header sticky glass, Hero com logo, Cards de categorias, ProductsGrid, PromoDoDia, Localizacao (Google Maps embed), Footer, FloatingWhatsapp, CartSheet, CheckoutDialog.
- AdminDashboard com abas Dashboard/Produtos/Categorias/Promoções/Config + upload de imagem.
- Validação de promoção (>0, < preço original, produto existente) e 404 correto nos DELETEs.
- Testes: 35/35 pytest verdes, frontend 100% após fixes.

## Backlog (P1)
- Combos como carrossel dedicado (hoje aparecem via categoria "Combos").
- Rate limiting de login (5 tentativas → 15 min).
- CORS restrito ao domínio da app.
- Alerta de confirm de exclusão usando AlertDialog (não window.confirm).
- Recentes no Dashboard admin (últimos produtos/promos).

## Backlog (P2)
- Sistema de pedidos persistidos no banco.
- Endereço, forma de entrega e forma de pagamento no checkout.
- Login social (opcional).
- Analytics de conversão.

## Credenciais
Ver `/app/memory/test_credentials.md`.
