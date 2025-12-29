"""
Simple smoke tests for staging deployment.
Set STAGING_URL environment variable to the deployed preview URL, e.g.:
  export STAGING_URL=https://<site-id>--staging.web.app
Then run:
  pytest -q functions/tests/smoke_tests.py
"""
from __future__ import annotations

import os
import json
from typing import Any, Dict

import pytest
import requests

STAGING_URL = os.environ.get("STAGING_URL")

pytestmark = pytest.mark.skipif(
    not STAGING_URL, reason="STAGING_URL not set; skipping smoke tests"
)


def _get(url: str) -> requests.Response:
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    return resp


def test_hosting_homepage_loads():
    resp = _get(STAGING_URL)
    assert "RAG Prompt Library" in resp.text


def test_api_health_endpoint():
    # API is served under /api/** rewrite to httpApi cloud function
    url = STAGING_URL.rstrip("/") + "/api/health"
    resp = _get(url)
    data: Dict[str, Any] = resp.json()
    assert data.get("status") == "healthy"

