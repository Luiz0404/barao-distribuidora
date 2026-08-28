from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Request, Response
from fastapi.responses import Response as FastAPIResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


# =========================
# CONFIG
# =========================
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "barao-distribuidora"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Barão Distribuidora & Tabacaria")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("barao")

storage_key = None


# =========================
# UTILS
# =========================
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pwd: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pwd.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autenticado")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user or user.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Usuário não autorizado")
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# =========================
# MODELS
# =========================
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class CategoryIn(BaseModel):
    name: str
    slug: str
    image_url: Optional[str] = None
    active: bool = True
    order: int = 0


class ProductIn(BaseModel):
    name: str
    description: Optional[str] = ""
    category_slug: str
    price: float
    promo_price: Optional[float] = None
    image_url: Optional[str] = None
    active: bool = True


class PromotionIn(BaseModel):
    product_id: str
    promo_price: float
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    image_url: Optional[str] = None
    active: bool = True


class ConfigIn(BaseModel):
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    address: Optional[str] = None
    hours: Optional[str] = None
    map_embed: Optional[str] = None


class OrderItemIn(BaseModel):
    product_id: Optional[str] = None
    name: str
    qty: int
    unit_price: float


class OrderIn(BaseModel):
    customer_name: str
    notes: Optional[str] = ""
    items: List[OrderItemIn]
    subtotal: float
    discount: float = 0
    total: float
    coupon_code: Optional[str] = None


class CouponIn(BaseModel):
    code: str
    percent_off: float
    active: bool = True
    expires_at: Optional[str] = None
    max_uses: Optional[int] = None


class CouponValidateIn(BaseModel):
    code: str


def strip_id(doc):
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# =========================
# AUTH
# =========================
@api.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    token = create_access_token(user["id"], email)
    return {"token": token, "user": {"id": user["id"], "email": email, "name": user.get("name", "Admin"), "role": user["role"]}}


@api.get("/auth/me")
async def me(current=Depends(get_current_admin)):
    return current


# =========================
# CATEGORIES
# =========================
@api.get("/categories")
async def list_categories(all: bool = False):
    q = {} if all else {"active": True}
    items = await db.categories.find(q).sort([("order", 1), ("name", 1)]).to_list(500)
    return [strip_id(i) for i in items]


@api.post("/categories")
async def create_category(body: CategoryIn, _=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.categories.insert_one(doc)
    return strip_id(doc)


@api.put("/categories/{cat_id}")
async def update_category(cat_id: str, body: CategoryIn, _=Depends(get_current_admin)):
    doc = body.model_dump()
    result = await db.categories.update_one({"id": cat_id}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(404, "Categoria não encontrada")
    updated = await db.categories.find_one({"id": cat_id})
    return strip_id(updated)


@api.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, _=Depends(get_current_admin)):
    result = await db.categories.delete_one({"id": cat_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Categoria não encontrada")
    return {"ok": True}


# =========================
# PRODUCTS
# =========================
@api.get("/products")
async def list_products(category: Optional[str] = None, all: bool = False):
    q = {}
    if not all:
        q["active"] = True
    if category:
        q["category_slug"] = category
    items = await db.products.find(q).sort([("created_at", -1)]).to_list(1000)
    return [strip_id(i) for i in items]


@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Produto não encontrado")
    return strip_id(p)


@api.post("/products")
async def create_product(body: ProductIn, _=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    return strip_id(doc)


@api.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, _=Depends(get_current_admin)):
    doc = body.model_dump()
    result = await db.products.update_one({"id": pid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(404, "Produto não encontrado")
    updated = await db.products.find_one({"id": pid})
    return strip_id(updated)


@api.delete("/products/{pid}")
async def delete_product(pid: str, _=Depends(get_current_admin)):
    result = await db.products.delete_one({"id": pid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Produto não encontrado")
    await db.promotions.delete_many({"product_id": pid})
    return {"ok": True}


# =========================
# PROMOTIONS
# =========================
@api.get("/promotions")
async def list_promotions(all: bool = False):
    q = {} if all else {"active": True}
    now = datetime.now(timezone.utc).isoformat()
    promos = await db.promotions.find(q).to_list(500)
    result = []
    for p in promos:
        p.pop("_id", None)
        if not all:
            if p.get("starts_at") and p["starts_at"] > now:
                continue
            if p.get("ends_at") and p["ends_at"] < now:
                continue
        prod = await db.products.find_one({"id": p["product_id"]})
        if prod:
            prod.pop("_id", None)
            p["product"] = prod
        result.append(p)
    return result


async def _validate_promotion(body: PromotionIn):
    prod = await db.products.find_one({"id": body.product_id})
    if not prod:
        raise HTTPException(400, "Produto vinculado não encontrado")
    if body.promo_price is None or body.promo_price <= 0:
        raise HTTPException(400, "Preço promocional deve ser maior que zero")
    if prod.get("price") and body.promo_price >= prod["price"]:
        raise HTTPException(400, "Preço promocional deve ser menor que o preço original")


@api.post("/promotions")
async def create_promotion(body: PromotionIn, _=Depends(get_current_admin)):
    await _validate_promotion(body)
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.promotions.insert_one(doc)
    return strip_id(doc)


@api.put("/promotions/{pid}")
async def update_promotion(pid: str, body: PromotionIn, _=Depends(get_current_admin)):
    await _validate_promotion(body)
    doc = body.model_dump()
    result = await db.promotions.update_one({"id": pid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(404, "Promoção não encontrada")
    updated = await db.promotions.find_one({"id": pid})
    return strip_id(updated)


@api.delete("/promotions/{pid}")
async def delete_promotion(pid: str, _=Depends(get_current_admin)):
    result = await db.promotions.delete_one({"id": pid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Promoção não encontrada")
    return {"ok": True}


# =========================
# CONFIG
# =========================
DEFAULT_CONFIG = {
    "whatsapp": "5566992575143",
    "instagram": "@barao_distribuidoraspc",
    "address": "Configure seu endereço no painel administrativo",
    "hours": "Segunda a Domingo — 10h às 00h",
    "map_embed": "",
}


@api.get("/config")
async def get_config():
    cfg = await db.config.find_one({"id": "main"})
    if not cfg:
        doc = {"id": "main", **DEFAULT_CONFIG}
        await db.config.insert_one(doc)
        return {k: v for k, v in doc.items() if k != "_id"}
    return strip_id(cfg)


@api.put("/config")
async def update_config(body: ConfigIn, _=Depends(get_current_admin)):
    doc = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.config.update_one({"id": "main"}, {"$set": doc}, upsert=True)
    cfg = await db.config.find_one({"id": "main"})
    return strip_id(cfg)


# =========================
# ORDERS
# =========================
@api.post("/orders")
async def create_order(body: OrderIn):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    if body.coupon_code:
        code = body.coupon_code.strip().upper()
        doc["coupon_code"] = code
        await db.coupons.update_one({"code": code}, {"$inc": {"uses": 1}})
    await db.orders.insert_one(doc)
    return strip_id(doc)


@api.get("/orders")
async def list_orders(scope: str = "all", _=Depends(get_current_admin)):
    q = {}
    if scope == "today":
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        q["created_at"] = {"$gte": today_start}
    items = await db.orders.find(q).sort([("created_at", -1)]).to_list(500)
    return [strip_id(i) for i in items]


@api.delete("/orders/{oid}")
async def delete_order(oid: str, _=Depends(get_current_admin)):
    result = await db.orders.delete_one({"id": oid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Pedido não encontrado")
    return {"ok": True}


@api.get("/orders/stats")
async def orders_stats(_=Depends(get_current_admin)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    all_orders = await db.orders.find({}).to_list(2000)
    today = [o for o in all_orders if o.get("created_at", "") >= today_start]
    counter = {}
    for o in all_orders:
        for it in o.get("items", []):
            key = it.get("product_id") or it.get("name")
            if not key:
                continue
            entry = counter.setdefault(key, {"name": it.get("name", ""), "qty": 0, "revenue": 0.0})
            entry["qty"] += int(it.get("qty", 0))
            entry["revenue"] += float(it.get("qty", 0)) * float(it.get("unit_price", 0))
    top = sorted(counter.values(), key=lambda x: x["qty"], reverse=True)[:5]
    recent = sorted(all_orders, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
    for r in recent:
        r.pop("_id", None)
    return {
        "orders_today": len(today),
        "revenue_today": sum(float(o.get("total", 0)) for o in today),
        "orders_total": len(all_orders),
        "revenue_total": sum(float(o.get("total", 0)) for o in all_orders),
        "top_products": top,
        "recent_orders": recent,
    }


# =========================
# COUPONS
# =========================
@api.get("/coupons")
async def list_coupons(_=Depends(get_current_admin)):
    items = await db.coupons.find({}).sort([("created_at", -1)]).to_list(500)
    return [strip_id(i) for i in items]


@api.post("/coupons")
async def create_coupon(body: CouponIn, _=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["code"] = doc["code"].strip().upper()
    if not doc["code"]:
        raise HTTPException(400, "Código é obrigatório")
    if doc["percent_off"] <= 0 or doc["percent_off"] > 100:
        raise HTTPException(400, "Desconto deve ser entre 1 e 100%")
    if await db.coupons.find_one({"code": doc["code"]}):
        raise HTTPException(400, "Já existe um cupom com esse código")
    doc["id"] = str(uuid.uuid4())
    doc["uses"] = 0
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.coupons.insert_one(doc)
    return strip_id(doc)


@api.put("/coupons/{cid}")
async def update_coupon(cid: str, body: CouponIn, _=Depends(get_current_admin)):
    doc = body.model_dump()
    doc["code"] = doc["code"].strip().upper()
    if doc["percent_off"] <= 0 or doc["percent_off"] > 100:
        raise HTTPException(400, "Desconto deve ser entre 1 e 100%")
    dup = await db.coupons.find_one({"code": doc["code"], "id": {"$ne": cid}})
    if dup:
        raise HTTPException(400, "Já existe outro cupom com esse código")
    result = await db.coupons.update_one({"id": cid}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(404, "Cupom não encontrado")
    updated = await db.coupons.find_one({"id": cid})
    return strip_id(updated)


@api.delete("/coupons/{cid}")
async def delete_coupon(cid: str, _=Depends(get_current_admin)):
    result = await db.coupons.delete_one({"id": cid})
    if result.deleted_count == 0:
        raise HTTPException(404, "Cupom não encontrado")
    return {"ok": True}


@api.post("/coupons/validate")
async def validate_coupon(body: CouponValidateIn):
    code = (body.code or "").strip().upper()
    if not code:
        raise HTTPException(400, "Informe o código do cupom")
    c = await db.coupons.find_one({"code": code, "active": True})
    if not c:
        raise HTTPException(404, "Cupom inválido")
    now_iso = datetime.now(timezone.utc).isoformat()
    if c.get("expires_at") and c["expires_at"] < now_iso:
        raise HTTPException(400, "Cupom expirado")
    if c.get("max_uses") and c.get("uses", 0) >= c["max_uses"]:
        raise HTTPException(400, "Cupom esgotado")
    return {"code": c["code"], "percent_off": c["percent_off"]}


# =========================
# UPLOAD
# =========================
MIME = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}


@api.post("/upload")
async def upload(file: UploadFile = File(...), current=Depends(get_current_admin)):
    ext = (file.filename or "img").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "png"
    if ext not in MIME:
        raise HTTPException(400, "Formato não suportado. Use JPG, PNG, WEBP ou GIF.")
    path = f"{APP_NAME}/products/{uuid.uuid4()}.{ext}"
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(400, "Arquivo muito grande (máx 8MB).")
    result = put_object(path, data, MIME[ext])
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "content_type": MIME[ext],
        "size": result.get("size", len(data)),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": f"/api/files/{result['path']}", "path": result["path"]}


@api.get("/files/{path:path}")
async def download(path: str):
    try:
        data, ctype = get_object(path)
    except requests.HTTPError as e:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FastAPIResponse(content=data, media_type=ctype)


# =========================
# STARTUP
# =========================
@app.on_event("startup")
async def on_startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("id", unique=True)
    await db.categories.create_index("id", unique=True)
    await db.promotions.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("created_at")
    await db.coupons.create_index("code", unique=True)

    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL.lower(),
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Proprietário Barão",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL.lower()},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )
        logger.info("Admin password refreshed from env")

    # Seed default categories if empty
    if await db.categories.count_documents({}) == 0:
        defaults = [
            {"name": "Bebidas", "slug": "bebidas", "order": 1},
            {"name": "Tabacaria", "slug": "tabacaria", "order": 2},
            {"name": "Combos", "slug": "combos", "order": 3},
            {"name": "Gelo, Carvão e Acessórios", "slug": "gelo-carvao", "order": 4},
        ]
        for d in defaults:
            await db.categories.insert_one({
                "id": str(uuid.uuid4()),
                "active": True,
                "image_url": None,
                "created_at": datetime.now(timezone.utc).isoformat(),
                **d,
            })

    # Seed default config
    if not await db.config.find_one({"id": "main"}):
        await db.config.insert_one({"id": "main", **DEFAULT_CONFIG})

    # Init storage
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (uploads will retry lazily): {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
