from __future__ import annotations

import argparse
from pathlib import Path

from mockdrift.init_templates import (
    RUNNER_FILES,
    _agents_yaml,
    _gates_yaml,
    _harness_lock,
    _mockdrift_toml,
    _test_harness,
    _workflow,
)
from mockdrift.marketplace import marketplace_fixture_config
from mockdrift.session import MisconfigurationError


def run_init(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="mockdrift init")
    parser.add_argument(
        "--runner",
        choices=["langgraph", "crewai", "custom"],
        default="langgraph",
    )
    parser.add_argument(
        "--fixture",
        default="stripe/required-field",
        help="Marketplace id (vendor/scenario) or mockdrift.toml key",
    )
    parser.add_argument(
        "--failure-profile",
        dest="failure_profile",
        default="bubble_to_orchestrator",
        choices=["halt_clean", "bubble_to_orchestrator", "fallback_state"],
    )
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args(argv)

    root = Path.cwd()
    package_root = Path(__file__).resolve().parent.parent

    try:
        entry = marketplace_fixture_config(args.fixture, package_root)
    except MisconfigurationError as exc:
        print(str(exc), flush=True)
        return 2
    if entry is None:
        print(f"Unknown marketplace fixture '{args.fixture}' — see fixtures/index.yaml", flush=True)
        return 2

    mockdrift_key = entry.mockdrift_key or entry.id.replace("/", "-")
    fixture_rel = f"fixtures/{entry.path.name}" if entry.path else ""
    if not fixture_rel:
        print(f"Fixture '{args.fixture}' has no local path", flush=True)
        return 2

    effective_runner = "custom" if args.runner == "crewai" else args.runner

    runner_files = RUNNER_FILES["crewai" if args.runner == "crewai" else args.runner]
    entry_line = str(runner_files["entry"])

    agent_id = mockdrift_key.replace("-", "_")
    files: dict[Path, str] = {
        root / ".driftguard" / "gates.yaml": _gates_yaml(),
        root / ".driftguard" / "harness.lock": _harness_lock(
            entry.id,
            f"packages/mockdrift/{fixture_rel}",
            mockdrift_key,
        ),
        root / ".driftguard" / "agents.yaml": _agents_yaml(agent_id),
        root / ".mockdrift.toml": _mockdrift_toml(
            mockdrift_key, fixture_rel, args.failure_profile, effective_runner
        ),
        root / "tests" / "harness" / "test_drift.py": _test_harness(
            mockdrift_key,
            args.runner,
            entry_line,
            args.failure_profile,
        ),
        root / ".github" / "workflows" / "drift-harness.yml": _workflow(),
    }

    for rel_path, content_fn in runner_files.items():
        if rel_path == "entry":
            continue
        if callable(content_fn):
            files[root / rel_path] = content_fn()

    written = 0
    for path, content in files.items():
        if path.exists() and not args.force:
            print(f"skip {path} (exists)", flush=True)
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"wrote {path}", flush=True)
        written += 1

    if written == 0:
        print("No files written — use --force to overwrite", flush=True)
        return 2

    print(
        f"\nNext: pip install -e packages/mockdrift && "
        f"mockdrift demo {entry.id}",
        flush=True,
    )
    return 0
