import sys, types
from fastapi.testclient import TestClient
import pytest

# Stub firebase_admin.auth to avoid requiring the SDK in tests
if 'firebase_admin' not in sys.modules:
    fa = types.ModuleType('firebase_admin')
    auth = types.ModuleType('firebase_admin.auth')
    def verify_id_token(token):
        return {"uid": "stub"}
    auth.verify_id_token = verify_id_token
    sys.modules['firebase_admin'] = fa
    sys.modules['firebase_admin.auth'] = auth
    fa.auth = auth

from src.api.main import app  # after stubs

client = TestClient(app)


def test_prompt_library_chat_missing_token_returns_401():
    res = client.post("/api/ai/prompt-library-chat", json={"message": "hi"})
    assert res.status_code == 401
    data = res.json()
    assert data.get("error", {}).get("code") == "AUTHENTICATION_ERROR"
    assert "authorization" in data.get("error", {}).get("message", "").lower()


def test_prompt_library_chat_invalid_token_returns_401(monkeypatch):
    # Force the token verification path to fail
    import src.api.main as main_mod
    async def raise_auth_error(token: str):
        raise Exception("Invalid or expired token")
    monkeypatch.setattr(main_mod, "verify_token_async", raise_auth_error, raising=True)

    res = client.post(
        "/api/ai/prompt-library-chat",
        json={"message": "hi"},
        headers={"Authorization": "Bearer invalid"}
    )
    assert res.status_code == 401
    data = res.json()
    assert data.get("error", {}).get("code") == "AUTHENTICATION_ERROR"
