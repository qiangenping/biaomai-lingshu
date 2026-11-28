#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== OpenGrowth Bootstrap ==="
for cmd in node pnpm bun git; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ Missing required tool: $cmd"
    exit 1
  fi
done

echo "✅ Node: $(node --version) | pnpm: $(pnpm --version) | bun: $(bun --version)"

echo "Installing workspace & desktop runtime dependencies..."
pnpm run setup

echo "Running governance, i18n, and unit test checks..."
pnpm verify:all

echo "✅ Bootstrap complete! Run 'pnpm dev:aionui' (or 'pnpm start') to launch OpenGrowth."
