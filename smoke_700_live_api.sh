#!/usr/bin/env bash
set -euo pipefail

API="https://instadrafts-api-xkrdwictda-el.a.run.app"
ADMIN_API_KEY="New@0109"

echo "== Health =="
curl -i "$API/health" | head -n 30 || true

echo
echo "== Admin tasks =="
curl -i -H "x-admin-key: $ADMIN_API_KEY" "$API/v1/admin/tasks" | head -n 80 || true

echo
echo "== Admin train-ai templates =="
curl -i -H "x-admin-key: $ADMIN_API_KEY" "$API/v1/admin/train-ai/templates" | head -n 80 || true

echo
echo "== Admin whatsapp templates =="
curl -i -H "x-admin-key: $ADMIN_API_KEY" "$API/v1/admin/whatsapp/templates" | head -n 80 || true

echo
echo "== Admin search (caseId query) =="
curl -i -H "x-admin-key: $ADMIN_API_KEY" \
  "$API/v1/admin/search?q=case_2db9e00e&type=case" | head -n 120 || true

echo
echo "NOTE: Next, we will test lawyer/agent/client endpoints AFTER patch_701 adds/validates them."
