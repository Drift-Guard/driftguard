"""Phase 1C — cloud replay, telemetry, cache."""

from __future__ import annotations

import json
import os
from pathlib import Path
from unittest import mock

import pytest

from mockdrift.cloud_client import CloudClientError, MissingApiKeyError, fetch_fixture_from_watch
from mockdrift.cache import write_cached_fixture
from mockdrift.telemetry import emit_cloud_ci_run


CLOUD_FIXTURE_RESPONSE = {
    "watchId": "watch_test123",
    "fixtureId": "fixture-watch_te",
    "status": "simulated",
    "eventId": "550e8400-e29b-41d4-a716-446655440001",
    "fixture": {
        "driftTarget": "stripe_create_refund",
        "match": "first_call",
        "failureProfile": "bubble_to_orchestrator",
        "beforeSchema": {"tools": {"stripe_create_refund": {"required": ["amount"]}}},
        "afterSchema": {"tools": {"stripe_create_refund": {"required": ["amount", "country"]}}},
        "sampleError": {"status": "422"},
        "mockResponses": {"stripe_create_refund": {"id": "{{mockdrift.uuid}}"}},
        "metadata": {"structuralOnly": True},
        "expect": {"schema_valid": {"enabled": True}},
    },
}


def test_md_c_001_missing_api_key():
    """MD-C-001: no API key exits with trial message."""
    with mock.patch.dict(os.environ, {}, clear=True):
        os.environ.pop("DRIFTGUARD_API_KEY", None)
        with pytest.raises(MissingApiKeyError, match="trial"):
            fetch_fixture_from_watch("watch_x")


def test_md_c_002_product_required():
    """MD-C-002: 403 PRODUCT_REQUIRED from cloud."""
    import io
    import urllib.error

    def _raise_http(*_args, **_kwargs):
        body = io.BytesIO(json.dumps({"error": "PRODUCT_REQUIRED: mockdrift_cloud"}).encode())
        raise urllib.error.HTTPError("url", 403, "Forbidden", {}, body)

    with mock.patch.dict(os.environ, {"DRIFTGUARD_API_KEY": "dg_live_test"}):
        with mock.patch("urllib.request.urlopen", side_effect=_raise_http):
            with pytest.raises(CloudClientError, match="PRODUCT_REQUIRED"):
                fetch_fixture_from_watch("watch_x")


def test_md_c_003_fixture_materialized(tmp_path: Path):
    """MD-C-003: cloud payload writes cache fixture files."""
    with mock.patch.dict(os.environ, {"DRIFTGUARD_API_KEY": "dg_live_test"}):
        with mock.patch("urllib.request.urlopen") as urlopen:
            resp = mock.Mock()
            resp.__enter__ = mock.Mock(return_value=resp)
            resp.__exit__ = mock.Mock(return_value=False)
            resp.read.return_value = json.dumps(CLOUD_FIXTURE_RESPONSE).encode()
            urlopen.return_value = resp
            body = fetch_fixture_from_watch("watch_test123")

    cache_dir = write_cached_fixture("watch_test123", body, root=tmp_path)
    assert (cache_dir / "before.schema.json").is_file()
    assert (cache_dir / "after.schema.json").is_file()
    assert (cache_dir / "mock-responses" / "stripe_create_refund.json").is_file()


def test_md_c_005_telemetry_opt_out():
    """MD-C-005: MOCKDRIFT_TELEMETRY=0 sends no POST."""
    with mock.patch.dict(os.environ, {"MOCKDRIFT_TELEMETRY": "0", "DRIFTGUARD_API_KEY": "dg_live_test"}):
        with mock.patch("urllib.request.urlopen") as urlopen:
            emit_cloud_ci_run()
            urlopen.assert_not_called()


def test_md_c_005_telemetry_emits_when_enabled():
    with mock.patch.dict(os.environ, {"MOCKDRIFT_TELEMETRY": "1", "DRIFTGUARD_API_KEY": "dg_live_test"}):
        with mock.patch("urllib.request.urlopen") as urlopen:
            resp = mock.Mock()
            resp.__enter__ = mock.Mock(return_value=resp)
            resp.__exit__ = mock.Mock(return_value=False)
            urlopen.return_value = resp
            emit_cloud_ci_run()
            urlopen.assert_called_once()
