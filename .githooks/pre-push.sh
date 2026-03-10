#!/bin/sh
fail() {
    echo "✗ $1 failed. Push aborted." >&2
    exit 1
}

echo "→ Checking formatting..."
npx prettier --check . || fail "Formatting"

echo "→ Type checking..."
npx tsc --noEmit || fail "Type check"

echo "→ Linting..."
ng lint || fail "Linting"

echo "→ Running tests..."
ng test -- --watch=false || fail "Tests"

echo "✓ Pre-push checks passed."