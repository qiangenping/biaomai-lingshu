#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== BiaoMai Lingshu Bootstrap ==="
for cmd in node pnpm git; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ Missing required tool: $cmd"
    exit 1
  fi
done

echo "✅ Node: $(node --version) | pnpm: $(pnpm --version)"

for optional in docker opencode codex; do
  if command -v "$optional" >/dev/null 2>&1; then
    echo "✅ Optional engine detected: $optional"
  else
    echo "ℹ️  Optional engine not found: $optional (can be installed anytime)"
  fi
done

echo "Installing root workspace packages..."
pnpm install

echo "Running governance, i18n, and unit test checks..."
pnpm verify:all

echo "✅ Bootstrap complete! Run 'pnpm docker:up' to start self-hosted AiToEarn backend."
