#!/bin/bash
# scripts/setup-parallel-runner.sh
# Standardized setup for isolated PR runners.

set -e

RUNNER_ID=$1
PR_NUMBER=$2

if [ -z "$RUNNER_ID" ] || [ -z "$PR_NUMBER" ]; then
  echo "Usage: ./scripts/setup-parallel-runner.sh <runner_id> <pr_number>"
  exit 1
fi

BASE_DIR=$(pwd)
RUNNER_DIR="${BASE_DIR}/../driftguard-runner-${RUNNER_ID}"

echo "🚀 Setting up Isolated Runner ${RUNNER_ID} for PR #${PR_NUMBER}..."

if [ ! -d "$RUNNER_DIR" ]; then
  git clone "$BASE_DIR" "$RUNNER_DIR"
fi

cd "$RUNNER_DIR"
git fetch origin
BRANCH=$(gh pr view "$PR_NUMBER" --json headRefName --template '{{.headRefName}}')
git checkout "$BRANCH" || git checkout -b "$BRANCH" "origin/${BRANCH}"
git merge origin/main --no-edit
npm ci
npm run build

echo "✅ Runner ${RUNNER_ID} ready at ${RUNNER_DIR}"
