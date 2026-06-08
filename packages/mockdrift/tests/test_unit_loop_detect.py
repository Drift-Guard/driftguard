from __future__ import annotations

from mockdrift.loop_detect import LoopDetector, tool_args_hash


def test_tool_args_hash_is_deterministic():
    h1 = tool_args_hash("tool", {"a": 1, "b": 2})
    h2 = tool_args_hash("tool", {"b": 2, "a": 1})
    assert h1 == h2


def test_spiral_detected_after_identical_hash_threshold():
    detector = LoopDetector(max_identical_tool_hashes=2, window_steps=10)
    h = "abc123"
    for _ in range(4):
        detector.record(step=1, tool="t", args_hash=h, error_class="422")
    assert detector.identical_hash_count(h) == 4
    assert detector.spiral_detected(h, "422") is True


def test_same_error_streak_triggers_spiral():
    detector = LoopDetector(same_error_streak=3, max_identical_tool_hashes=99)
    for i in range(3):
        detector.record(step=i, tool="t", args_hash=f"h{i}", error_class="422")
    assert detector.same_error_streak_count("422") == 3
    assert detector.spiral_detected("new", "422") is True
