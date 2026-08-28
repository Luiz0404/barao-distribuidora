"""Config & Upload/Files modules."""
import io
import struct
import zlib

import requests
from conftest import BASE_URL


def _png_bytes(w=4, h=4):
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + b"\xff\x00\x00" * w for _ in range(h))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def test_get_config_public():
    r = requests.get(f"{BASE_URL}/api/config", timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["whatsapp", "instagram", "address", "hours"]:
        assert k in d, f"config missing {k}"
    assert "_id" not in d
    assert d["whatsapp"]


def test_update_config_requires_auth(api_client):
    r = api_client.put(f"{BASE_URL}/api/config", json={"whatsapp": "1"}, timeout=30)
    assert r.status_code == 401


def test_update_config_persists(authed):
    original = requests.get(f"{BASE_URL}/api/config", timeout=30).json()
    try:
        upd = {
            "whatsapp": "5566992575143",
            "instagram": "@test_barao",
            "address": "TEST_Rua 1, Centro",
            "hours": "TEST_10h-23h",
        }
        r = authed.put(f"{BASE_URL}/api/config", json=upd, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["instagram"] == "@test_barao"
        assert "_id" not in d

        got = requests.get(f"{BASE_URL}/api/config", timeout=30).json()
        assert got["address"] == "TEST_Rua 1, Centro"
        assert got["hours"] == "TEST_10h-23h"

        # partial update should not wipe other fields
        r = authed.put(f"{BASE_URL}/api/config", json={"hours": "TEST_partial"}, timeout=30)
        assert r.status_code == 200
        got = requests.get(f"{BASE_URL}/api/config", timeout=30).json()
        assert got["hours"] == "TEST_partial"
        assert got["address"] == "TEST_Rua 1, Centro", "partial update wiped address"
    finally:
        restore = {k: original.get(k) for k in ["whatsapp", "instagram", "address", "hours", "map_embed"]}
        authed.put(f"{BASE_URL}/api/config", json=restore, timeout=30)


def test_upload_requires_auth():
    files = {"file": ("t.png", io.BytesIO(_png_bytes()), "image/png")}
    r = requests.post(f"{BASE_URL}/api/upload", files=files, timeout=60)
    assert r.status_code == 401


def test_upload_and_fetch_image(auth_token):
    data = _png_bytes()
    files = {"file": ("TEST_img.png", io.BytesIO(data), "image/png")}
    r = requests.post(
        f"{BASE_URL}/api/upload",
        files=files,
        headers={"Authorization": f"Bearer {auth_token}"},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    assert "url" in d and "path" in d
    assert d["url"] == f"/api/files/{d['path']}"

    fetch = requests.get(f"{BASE_URL}{d['url']}", timeout=60)
    assert fetch.status_code == 200, fetch.text[:300]
    assert fetch.headers.get("Content-Type", "").startswith("image/png"), fetch.headers.get("Content-Type")
    assert fetch.content[:8] == b"\x89PNG\r\n\x1a\n"
    assert len(fetch.content) == len(data)


def test_upload_rejects_bad_extension(auth_token):
    files = {"file": ("TEST_bad.txt", io.BytesIO(b"hello"), "text/plain")}
    r = requests.post(
        f"{BASE_URL}/api/upload",
        files=files,
        headers={"Authorization": f"Bearer {auth_token}"},
        timeout=60,
    )
    assert r.status_code == 400, r.text


def test_files_missing_path_returns_404():
    r = requests.get(f"{BASE_URL}/api/files/barao-distribuidora/products/nope-does-not-exist.png", timeout=60)
    assert r.status_code == 404, f"{r.status_code} {r.text[:200]}"
