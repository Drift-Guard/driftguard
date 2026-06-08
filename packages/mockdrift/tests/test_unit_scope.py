from __future__ import annotations

import re

import pytest

from mockdrift.scope import ScopeLedger


def test_uuid_substitution_is_stable_within_scope():
    scope = ScopeLedger()
    out1 = scope.substitute("{{mockdrift.uuid}}")
    out2 = scope.substitute("{{mockdrift.uuid}}")
    assert out1 == out2
    assert re.match(r"[0-9a-f-]{36}", out1)


def test_ref_substitution_uses_remembered_field():
    scope = ScopeLedger()
    scope.remember("id", "ref_abc")
    assert scope.substitute("{{mockdrift.ref:id}}") == "ref_abc"


def test_ref_missing_raises_key_error():
    scope = ScopeLedger()
    with pytest.raises(KeyError):
        scope.substitute("{{mockdrift.ref:missing}}")


def test_substitute_walks_nested_dicts():
    scope = ScopeLedger()
    scope.remember("id", "x")
    result = scope.substitute({"nested": {"v": "{{mockdrift.ref:id}}"}})
    assert result["nested"]["v"] == "x"
