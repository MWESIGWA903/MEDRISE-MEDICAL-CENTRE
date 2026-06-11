#!/usr/bin/env bash
set -euo pipefail
echo "=== MedRise Pre-Install ==="
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version 2>/dev/null || echo 'not found')"
echo "Working dir: $(pwd)"
echo "==========================="
