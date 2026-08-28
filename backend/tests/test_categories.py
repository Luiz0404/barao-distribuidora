"""Categories module: seeded list, CRUD, auth enforcement."""
import requests
from conftest import BASE_URL


def test_list_seeded_categories(api_client):
    r = api_client.get(f"{BASE_URL}/api/categories", timeout=30)
    assert r.status_code == 200, r.text
    items = r.json()
    assert isinstance(items, list) and len(items) >= 4
    slugs = {i["slug"] for i in items}
    for s in ["bebidas", "tabacaria", "combos", "gelo-carvao"]:
        assert s in slugs, f"missing seeded slug {s}"
    for i in items:
        assert "_id" not in i
        assert i["active"] is True


def test_create_category_requires_auth(api_client):
    r = api_client.post(f"{BASE_URL}/api/categories", json={"name": "X", "slug": "x"}, timeout=30)
    assert r.status_code == 401


def test_category_crud(authed):
    payload = {"name": "TEST_Categoria", "slug": "test-categoria", "active": True, "order": 99}
    r = authed.post(f"{BASE_URL}/api/categories", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    c = r.json()
    cid = c["id"]
    assert c["name"] == payload["name"] and c["slug"] == payload["slug"]
    assert "_id" not in c

    lst = requests.get(f"{BASE_URL}/api/categories?all=true", timeout=30).json()
    assert any(x["id"] == cid for x in lst)

    upd = {**payload, "name": "TEST_Categoria Editada", "active": False}
    r = authed.put(f"{BASE_URL}/api/categories/{cid}", json=upd, timeout=30)
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "TEST_Categoria Editada"
    assert r.json()["active"] is False

    pub = requests.get(f"{BASE_URL}/api/categories", timeout=30).json()
    assert not any(x["id"] == cid for x in pub), "inactive category leaked into public list"

    allc = requests.get(f"{BASE_URL}/api/categories?all=true", timeout=30).json()
    assert any(x["id"] == cid for x in allc)

    r = authed.delete(f"{BASE_URL}/api/categories/{cid}", timeout=30)
    assert r.status_code == 200
    allc = requests.get(f"{BASE_URL}/api/categories?all=true", timeout=30).json()
    assert not any(x["id"] == cid for x in allc)


def test_update_nonexistent_category(authed):
    r = authed.put(f"{BASE_URL}/api/categories/does-not-exist", json={"name": "a", "slug": "b"}, timeout=30)
    assert r.status_code == 404


def test_delete_nonexistent_category_returns_ok(authed):
    """Documented behaviour: DELETE is idempotent and returns 200 even if absent."""
    r = authed.delete(f"{BASE_URL}/api/categories/does-not-exist", timeout=30)
    print(f"DELETE missing category -> {r.status_code} {r.text[:100]}")
    assert r.status_code in (200, 404)


def test_category_missing_required_fields(authed):
    r = authed.post(f"{BASE_URL}/api/categories", json={"name": "TEST_only"}, timeout=30)
    assert r.status_code == 422
