"""Auth module: login, /auth/me, unauthorized access, bcrypt hash format."""
import asyncio
import os

import requests
from dotenv import dotenv_values
from conftest import BASE_URL


def test_login_success(test_credentials):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=test_credentials, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert isinstance(d.get("token"), str) and len(d["token"]) > 20
    assert d["user"]["email"] == test_credentials["email"].lower()
    assert d["user"]["role"] == "admin"
    assert "password_hash" not in d["user"]
    assert "_id" not in d["user"]


def test_login_wrong_password(test_credentials):
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": test_credentials["email"], "password": "wrong-pass-123"},
        timeout=30,
    )
    assert r.status_code == 401, r.text
    assert "detail" in r.json()


def test_login_unknown_email():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "nobody_test@example.com", "password": "x"},
        timeout=30,
    )
    assert r.status_code == 401


def test_login_invalid_email_format():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "notanemail", "password": "x"}, timeout=30)
    assert r.status_code == 422


def test_login_email_case_insensitive(test_credentials):
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": test_credentials["email"].upper(), "password": test_credentials["password"]},
        timeout=30,
    )
    assert r.status_code == 200, r.text


def test_me_with_token(authed, test_credentials):
    r = authed.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["email"] == test_credentials["email"].lower()
    assert d["role"] == "admin"
    assert "password_hash" not in d and "_id" not in d


def test_me_without_token():
    r = requests.get(f"{BASE_URL}/api/auth/me", timeout=30)
    assert r.status_code == 401


def test_me_with_garbage_token():
    r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer abc.def.ghi"}, timeout=30)
    assert r.status_code == 401


def test_bcrypt_hash_format():
    """Playbook check: stored admin hash must be bcrypt $2b$."""
    from motor.motor_asyncio import AsyncIOMotorClient

    env = dotenv_values("/app/backend/.env")
    mongo = os.environ.get("MONGO_URL") or env.get("MONGO_URL")
    dbname = os.environ.get("DB_NAME") or env.get("DB_NAME")

    async def _check():
        c = AsyncIOMotorClient(mongo)
        u = await c[dbname].users.find_one({"role": "admin"})
        c.close()
        return u

    user = asyncio.run(_check())
    assert user is not None, "No admin user seeded"
    assert user["password_hash"].startswith("$2b$"), user["password_hash"][:10]


def test_brute_force_lockout_probe(test_credentials):
    """Informational: 6 bad attempts; app has no lockout -> documented in report."""
    codes = []
    for _ in range(6):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": test_credentials["email"], "password": "bad-pass"},
            timeout=30,
        )
        codes.append(r.status_code)
    assert all(c in (401, 429) for c in codes), codes
    # good creds must still work after failures (no accidental permanent lockout)
    ok = requests.post(f"{BASE_URL}/api/auth/login", json=test_credentials, timeout=30)
    assert ok.status_code in (200, 429), ok.text
    print(f"lockout probe codes={codes}, post-fail login={ok.status_code}")
