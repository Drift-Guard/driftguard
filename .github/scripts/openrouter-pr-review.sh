#!/usr/bin/env bash
# Post an AI code review on a pull request using the OpenRouter API.
set -euo pipefail

if [[ -z "${OPENROUTER_API_KEY:-}" ]]; then
  echo "OPENROUTER_API_KEY not configured; skipping OpenRouter review."
  exit 0
fi

if [[ -z "${PR_NUMBER:-}" ]]; then
  echo "PR_NUMBER is required."
  exit 1
fi

MODEL="${OPENROUTER_MODEL:-openrouter/free}"
REPO="${GITHUB_REPOSITORY}"
MAX_DIFF_CHARS="${OPENROUTER_MAX_DIFF_CHARS:-60000}"
EXCLUDE_DIFF_PATHS="${OPENROUTER_EXCLUDE_DIFF_PATHS:-package-lock.json yarn.lock}"

pr_json="$(gh pr view "$PR_NUMBER" --repo "$REPO" --json title,body,author,baseRefName,headRefName,files)"
title="$(jq -r '.title' <<<"$pr_json")"
body="$(jq -r '.body // ""' <<<"$pr_json")"
author="$(jq -r '.author.login' <<<"$pr_json")"
base="$(jq -r '.baseRefName' <<<"$pr_json")"
head="$(jq -r '.headRefName' <<<"$pr_json")"
files="$(jq -r '[.files[].path] | join(", ")' <<<"$pr_json")"

raw_diff="$(gh pr diff "$PR_NUMBER" --repo "$REPO" || true)"
if [[ -z "$raw_diff" ]]; then
  echo "No diff found for PR #$PR_NUMBER."
  exit 0
fi

# Drop lockfile hunks — they dominate token usage without review value.
diff="$(
  awk -v excludes="$EXCLUDE_DIFF_PATHS" '
    function is_excluded(path,    i, n, pat) {
      n = split(excludes, parts, " ")
      for (i = 1; i <= n; i++) {
        pat = parts[i]
        if (pat != "" && path ~ ("(^|/)" pat "$")) return 1
      }
      return 0
    }
    /^diff --git / {
      skip = 0
      if (match($0, / b\/([^ ]+)/, m) && is_excluded(m[1])) skip = 1
    }
    !skip { print }
  ' <<<"$raw_diff"
)"
if [[ -z "$diff" ]]; then
  diff="(No reviewable diff after excluding lockfiles: ${EXCLUDE_DIFF_PATHS})"
fi

if (( ${#diff} > MAX_DIFF_CHARS )); then
  diff="${diff:0:MAX_DIFF_CHARS}

... [diff truncated at ${MAX_DIFF_CHARS} characters]"
fi

read -r -d '' system_prompt <<'EOF' || true
You are a senior TypeScript reviewer for DriftGuard (open-source MCP client + local JSON schema diff).

Review the pull request diff. Focus on:
- **Security:** injection, secret leakage, unsafe deserialization, dependency risk, auth bypass
- Open core boundary: do not add hosted monitoring server code to the public repo
- MCP tool descriptions: when to use, when not to, sibling tools; funnel to hosted Pro/Team
- Offline-first tools (compare_json, parse_mcp_config, hosted_info) vs hosted proxies
- TypeScript strict mode, ESM imports, no secrets in tool responses
- Tests for diff engine and MCP helpers; update SYSTEM_PROMPT.md if tools change
- MCP stdio: logs to stderr only

Output markdown only:
1. "## Review summary" — 2-3 sentences
2. "## Findings" — bullet list; prefix each with severity [critical|high|medium|low|info]
3. "## Suggested follow-ups" — optional checklist

Skip nitpicks on markdown-only or version-bump-only changes unless inconsistent.
Do not approve or request changes; provide review feedback only.
EOF

user_prompt="Repository: ${REPO}
PR #${PR_NUMBER}: ${title}
Author: ${author}
Base: ${base} <- Head: ${head}
Changed files: ${files}

PR description:
${body}

Additional reviewer notes:
${ADDITIONAL_CONTEXT:-none}

Diff:
${diff}"

request_json="$(jq -n \
  --arg model "$MODEL" \
  --arg system "$system_prompt" \
  --arg user "$user_prompt" \
  '{
    model: $model,
    temperature: 0.2,
    max_tokens: 4096,
    messages: [
      {role: "system", content: $system},
      {role: "user", content: $user}
    ]
  }')"

request_file="$(mktemp)"
response_file="$(mktemp)"
trap 'rm -f "$request_file" "$response_file"' EXIT
printf '%s' "$request_json" >"$request_file"

http_code="$(curl -sS -o "$response_file" -w '%{http_code}' \
  https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://github.com/${REPO}" \
  -H "X-Title: driftguard PR Review" \
  -d @"$request_file")"

if [[ "$http_code" != "200" ]]; then
  echo "OpenRouter API failed with HTTP ${http_code}:"
  cat "$response_file"
  if [[ "$http_code" == "402" || "$http_code" == "413" || "$http_code" == "429" ]]; then
    skip_reason="the prompt exceeded OpenRouter limits (HTTP ${http_code})"
    if [[ "$http_code" == "429" ]]; then
      skip_reason="OpenRouter free-tier rate limits were hit (HTTP 429) — retry later or set \`OPENROUTER_MODEL\` to a paid model"
    fi
    gh pr comment "$PR_NUMBER" --repo "$REPO" --body "$(cat <<EOF
## OpenRouter PR review skipped

Automated review was skipped because ${skip_reason}.

Lockfile-only churn is excluded from review diffs; re-run after shortening the PR or upgrading OpenRouter credits. Comment \`/review\` to retry.
EOF
)"
    exit 0
  fi
  exit 1
fi

review_body="$(jq -r '.choices[0].message.content // empty' "$response_file")"
if [[ -z "$review_body" ]]; then
  echo "OpenRouter returned an empty review:"
  cat "$response_file"
  exit 1
fi

comment_body="$(cat <<EOF
## OpenRouter PR review

Model: \`${MODEL}\`

${review_body}

---
*Automated review via [OpenRouter](https://openrouter.ai). Comment \`/review\` on this PR to re-run.*
EOF
)"

gh pr comment "$PR_NUMBER" --repo "$REPO" --body "$comment_body"
