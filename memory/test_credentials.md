# Barão Distribuidora & Tabacaria — Test Credentials

## Admin (Proprietário)
- **Email**: luizcarlos221fg@gmail.com
- **Senha**: barao123
- **Role**: admin
- **Login URL**: `/admin/login`

## Auth Endpoints
- `POST /api/auth/login` — returns `{ token, user }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`

## Admin CRUD Endpoints (require Bearer token)
- Categories: `GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`
- Products:  `GET/POST /api/products`,   `PUT/DELETE /api/products/{id}`
- Promotions:`GET/POST /api/promotions`, `PUT/DELETE /api/promotions/{id}`
- Config:    `GET/PUT  /api/config`
- Upload:    `POST     /api/upload` (multipart file)
