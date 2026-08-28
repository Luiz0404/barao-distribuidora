"""Products & Promotions modules: CRUD, filters, cascade delete, auth."""
import pytest
import requests
from conftest import BASE_URL


@pytest.fixture(scope="module")
def product(authed):
    payload = {
        "name": "TEST_Whisky Barao",
        "description": "TEST product",
        "category_slug": "bebidas",
        "price": 129.9,
        "promo_price": 99.9,
        "image_url": None,
        "active": True,
    }
    r = authed.post(f"{BASE_URL}/api/products", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    p = r.json()
    yield p
    authed.delete(f"{BASE_URL}/api/products/{p['id']}", timeout=30)


def test_products_requires_auth_for_write(api_client):
    r = api_client.post(f"{BASE_URL}/api/products", json={"name": "x", "category_slug": "bebidas", "price": 1}, timeout=30)
    assert r.status_code == 401
    r = api_client.put(f"{BASE_URL}/api/products/abc", json={"name": "x", "category_slug": "bebidas", "price": 1}, timeout=30)
    assert r.status_code == 401
    r = api_client.delete(f"{BASE_URL}/api/products/abc", timeout=30)
    assert r.status_code == 401


def test_create_product_and_persistence(product):
    assert isinstance(product["id"], str)
    assert product["price"] == 129.9
    assert product["promo_price"] == 99.9
    assert "_id" not in product

    r = requests.get(f"{BASE_URL}/api/products/{product['id']}", timeout=30)
    assert r.status_code == 200, r.text
    got = r.json()
    assert got["name"] == "TEST_Whisky Barao"
    assert got["category_slug"] == "bebidas"
    assert got["active"] is True
    assert "_id" not in got


def test_get_nonexistent_product():
    r = requests.get(f"{BASE_URL}/api/products/nope-123", timeout=30)
    assert r.status_code == 404


def test_list_products_default_active_only(authed, product):
    inactive = authed.post(
        f"{BASE_URL}/api/products",
        json={"name": "TEST_Inativo", "category_slug": "bebidas", "price": 10, "active": False},
        timeout=30,
    ).json()
    try:
        pub = requests.get(f"{BASE_URL}/api/products", timeout=30).json()
        ids = {p["id"] for p in pub}
        assert product["id"] in ids
        assert inactive["id"] not in ids, "inactive product leaked into public list"

        allp = requests.get(f"{BASE_URL}/api/products?all=true", timeout=30).json()
        allids = {p["id"] for p in allp}
        assert inactive["id"] in allids and product["id"] in allids
    finally:
        authed.delete(f"{BASE_URL}/api/products/{inactive['id']}", timeout=30)


def test_list_products_category_filter(product):
    r = requests.get(f"{BASE_URL}/api/products?category=bebidas", timeout=30)
    assert r.status_code == 200
    items = r.json()
    assert all(p["category_slug"] == "bebidas" for p in items)
    assert product["id"] in {p["id"] for p in items}

    r2 = requests.get(f"{BASE_URL}/api/products?category=tabacaria", timeout=30)
    assert product["id"] not in {p["id"] for p in r2.json()}


def test_update_product_persists(authed, product):
    upd = {
        "name": "TEST_Whisky Editado",
        "description": "editado",
        "category_slug": "combos",
        "price": 150.0,
        "promo_price": None,
        "image_url": None,
        "active": True,
    }
    r = authed.put(f"{BASE_URL}/api/products/{product['id']}", json=upd, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "TEST_Whisky Editado"

    got = requests.get(f"{BASE_URL}/api/products/{product['id']}", timeout=30).json()
    assert got["name"] == "TEST_Whisky Editado"
    assert got["category_slug"] == "combos"
    assert got["price"] == 150.0
    assert got["promo_price"] is None

    # restore for later tests
    authed.put(
        f"{BASE_URL}/api/products/{product['id']}",
        json={
            "name": "TEST_Whisky Barao",
            "description": "TEST product",
            "category_slug": "bebidas",
            "price": 129.9,
            "promo_price": 99.9,
            "active": True,
        },
        timeout=30,
    )


def test_update_nonexistent_product(authed):
    r = authed.put(
        f"{BASE_URL}/api/products/nope-123",
        json={"name": "a", "category_slug": "bebidas", "price": 1},
        timeout=30,
    )
    assert r.status_code == 404


def test_product_validation(authed):
    r = authed.post(f"{BASE_URL}/api/products", json={"name": "TEST_x"}, timeout=30)
    assert r.status_code == 422
    r = authed.post(
        f"{BASE_URL}/api/products",
        json={"name": "TEST_x", "category_slug": "bebidas", "price": "abc"},
        timeout=30,
    )
    assert r.status_code == 422


# ---------------- Promotions ----------------

def test_promotions_require_auth(api_client):
    r = api_client.post(f"{BASE_URL}/api/promotions", json={"product_id": "x", "promo_price": 1}, timeout=30)
    assert r.status_code == 401
    assert api_client.put(f"{BASE_URL}/api/promotions/x", json={"product_id": "x", "promo_price": 1}, timeout=30).status_code == 401
    assert api_client.delete(f"{BASE_URL}/api/promotions/x", timeout=30).status_code == 401


def test_promotion_crud_and_embedded_product(authed, product):
    r = authed.post(
        f"{BASE_URL}/api/promotions",
        json={"product_id": product["id"], "promo_price": 89.9, "active": True},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    promo = r.json()
    pid = promo["id"]
    assert promo["promo_price"] == 89.9
    assert "_id" not in promo

    lst = requests.get(f"{BASE_URL}/api/promotions", timeout=30).json()
    mine = [p for p in lst if p["id"] == pid]
    assert mine, "created promotion not returned by GET /api/promotions"
    assert mine[0]["product"]["id"] == product["id"]
    assert "_id" not in mine[0]["product"]

    r = authed.put(
        f"{BASE_URL}/api/promotions/{pid}",
        json={"product_id": product["id"], "promo_price": 79.9, "active": True},
        timeout=30,
    )
    assert r.status_code == 200
    assert r.json()["promo_price"] == 79.9

    lst = requests.get(f"{BASE_URL}/api/promotions", timeout=30).json()
    assert [p for p in lst if p["id"] == pid][0]["promo_price"] == 79.9

    r = authed.delete(f"{BASE_URL}/api/promotions/{pid}", timeout=30)
    assert r.status_code == 200
    lst = requests.get(f"{BASE_URL}/api/promotions?all=true", timeout=30).json()
    assert not any(p["id"] == pid for p in lst)


def test_promotion_date_window_filter(authed, product):
    future = "2099-01-01T00:00:00+00:00"
    past_start = "2000-01-01T00:00:00+00:00"
    past_end = "2001-01-01T00:00:00+00:00"

    not_started = authed.post(
        f"{BASE_URL}/api/promotions",
        json={"product_id": product["id"], "promo_price": 10, "starts_at": future, "active": True},
        timeout=30,
    ).json()
    expired = authed.post(
        f"{BASE_URL}/api/promotions",
        json={"product_id": product["id"], "promo_price": 11, "starts_at": past_start, "ends_at": past_end, "active": True},
        timeout=30,
    ).json()
    inactive = authed.post(
        f"{BASE_URL}/api/promotions",
        json={"product_id": product["id"], "promo_price": 12, "active": False},
        timeout=30,
    ).json()
    try:
        pub_ids = {p["id"] for p in requests.get(f"{BASE_URL}/api/promotions", timeout=30).json()}
        assert not_started["id"] not in pub_ids, "future promo shown publicly"
        assert expired["id"] not in pub_ids, "expired promo shown publicly"
        assert inactive["id"] not in pub_ids, "inactive promo shown publicly"

        all_ids = {p["id"] for p in requests.get(f"{BASE_URL}/api/promotions?all=true", timeout=30).json()}
        assert {not_started["id"], expired["id"], inactive["id"]} <= all_ids
    finally:
        for x in (not_started, expired, inactive):
            authed.delete(f"{BASE_URL}/api/promotions/{x['id']}", timeout=30)


def test_delete_product_cascades_promotions(authed):
    p = authed.post(
        f"{BASE_URL}/api/products",
        json={"name": "TEST_Cascade", "category_slug": "bebidas", "price": 20, "active": True},
        timeout=30,
    ).json()
    promo = authed.post(
        f"{BASE_URL}/api/promotions",
        json={"product_id": p["id"], "promo_price": 15, "active": True},
        timeout=30,
    ).json()

    assert authed.delete(f"{BASE_URL}/api/products/{p['id']}", timeout=30).status_code == 200
    assert requests.get(f"{BASE_URL}/api/products/{p['id']}", timeout=30).status_code == 404
    all_promos = requests.get(f"{BASE_URL}/api/promotions?all=true", timeout=30).json()
    assert not any(x["id"] == promo["id"] for x in all_promos), "promotion not cascade-deleted"
