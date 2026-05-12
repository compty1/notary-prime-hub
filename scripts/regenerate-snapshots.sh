#!/usr/bin/env bash
# Regenerate Playwright visual regression baselines locally and commit them.
#
# Mirrors what the "Visual Regression" GitHub Actions workflow does when run
# manually with `update_snapshots=true`. Run this BEFORE pushing UI changes
# so CI compares against fresh baselines.
#
# Usage:
#   bun run snapshots:regenerate
#   # or, without committing:
#   bun run snapshots:regenerate -- --no-commit
set -euo pipefail

COMMIT=true
for arg in "$@"; do
  case "$arg" in
    --no-commit) COMMIT=false ;;
  esac
done

if ! command -v bunx >/dev/null 2>&1; then
  echo "✗ bun/bunx not found. Install bun: https://bun.sh" >&2
  exit 1
fi

echo "→ Installing Playwright + Chromium (with system deps)…"
bunx playwright install --with-deps chromium

echo "→ Regenerating baselines (same flags as CI workflow_dispatch)…"
bunx playwright test --update-snapshots --reporter=list

SNAPSHOT_DIRS=(
  "tests/visual/landing-snapshots.spec.ts-snapshots"
  "tests/visual/booking-funnel.spec.ts-snapshots"
)

if [ "$COMMIT" = true ]; then
  echo "→ Staging snapshot changes…"
  git add "${SNAPSHOT_DIRS[@]}"
  if git diff --cached --quiet; then
    echo "✓ No baseline changes to commit."
  else
    git commit -m "chore(visual): regenerate snapshots [skip ci]"
    echo "✓ Committed. Push with: git push"
  fi
else
  echo "✓ Snapshots regenerated (skipped commit per --no-commit)."
fi
