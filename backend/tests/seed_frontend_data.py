"""Seed demo products/promotion for frontend testing."""
import os
import requests
from dotenv import dotenv_values

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or dotenv_values("/app/frontend/.env")["REACT_APP_BACKEND_URL"]).rstrip("/")
tok = requests.post(f"{BASE}/api/auth/login", json={"email": "luizcarlos221fg@gmail.com", "password": "barao123"}, timeout=30).json()["token"]
H = {"Authorization": f"Bearer {tok}"}

items = [
    {"name": "TEST_Cerveja Heineken 600ml", "description": "Long neck gelada", "category_slug": "bebidas", "price": 12.5, "promo_price": 9.9, "active": True},
    {"name": "TEST_Whisky Red Label 1L", "description": "Blended scotch", "category_slug": "bebidas", "price": 99.0, "active": True},
    {"name": "TEST_Essencia Zomo 50g", "description": "Sabor melancia", "category_slug": "tabacaria", "price": 18.0, "active": True},
]
created = []
for it in items:
    r = requests.post(f"{BASE}/api/products", json=it, headers=H, timeout=30)
    print(it["name"], r.status_code)
    created.append(r.json())

r = requests.post(f"{BASE}/api/promotions", json={"product_id": created[1]["id"], "promo_price": 79.9, "active": True}, headers=H, timeout=30)
print("promo", r.status_code, r.json().get("id"))
for c in created:
    print(c["id"], c["name"])
