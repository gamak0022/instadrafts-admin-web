#!/usr/bin/env bash
set -euo pipefail

REPO="$HOME/Instadrafts-final"
API_DIR="$REPO/apps/api"

if [[ ! -d "$REPO" ]]; then
  echo "ERROR: Repo not found at $REPO"
  echo "Run: ls -la ~ && find ~ -maxdepth 2 -type d -name 'Instadrafts-final'"
  exit 1
fi

cd "$REPO"

echo "== git pull --rebase (autostash) =="
/usr/bin/git pull --rebase --autostash || /usr/bin/git pull --rebase || true

ROUTER="$(find "$API_DIR" -maxdepth 4 -type f -name 'router.ts' | head -n 1 || true)"
SCHEMA="$(find "$API_DIR" -maxdepth 5 -type f -name 'schema.prisma' | head -n 1 || true)"

if [[ -z "${ROUTER:-}" || ! -f "$ROUTER" ]]; then
  echo "ERROR: router.ts not found under $API_DIR"
  find "$API_DIR" -maxdepth 6 -type f -name '*.ts' | head -n 50
  exit 1
fi
if [[ -z "${SCHEMA:-}" || ! -f "$SCHEMA" ]]; then
  echo "ERROR: schema.prisma not found under $API_DIR"
  find "$API_DIR" -maxdepth 6 -type f -name '*.prisma' | head -n 50
  exit 1
fi

echo "== Found =="
echo "ROUTER=$ROUTER"
echo "SCHEMA=$SCHEMA"

echo
echo "== Show Attachment model (for verification) =="
python - <<PY
import re, pathlib, sys
p=pathlib.Path("$SCHEMA")
s=p.read_text(encoding="utf-8", errors="replace")
m=re.search(r"model Attachment\\b[\\s\\S]*?\\n}\\s*", s)
if not m:
  print("ERROR: model Attachment not found in schema.prisma")
  sys.exit(1)
print(m.group(0))
PY

echo
echo "== Guard: if endpoints already exist, do nothing =="
if rg -n "cases/:caseId/attachments" "$ROUTER" >/dev/null 2>&1; then
  echo "ℹ️ Attachment routes already present in router.ts. Skipping router patch."
  exit 0
fi

echo
echo "== Apply router patch (attachments upload/list/download + OCR stub) =="

python - <<'PY'
import pathlib, re, sys, textwrap

router_path = pathlib.Path(sys.argv[1])

src = router_path.read_text(encoding="utf-8", errors="replace")

# Heuristic insertion point: before last "export default router" OR end of file.
insert_at = None
m = re.search(r"\nexport\\s+default\\s+router\\s*;\\s*$", src, re.M)
if m:
  insert_at = m.start()
else:
  insert_at = len(src)

# Basic checks for prisma usage
if "prisma" not in src:
  print("ERROR: router.ts does not reference prisma; patch expects prisma client in scope.")
  sys.exit(1)

block = r'''
// ================================
// Attachments (Client upload + OCR stub + role-gated listing)
// ================================

import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';

const upload = multer({ dest: path.join(os.tmpdir(), 'instadrafts_uploads') });

// Minimal role gates (align with your existing x-user-role/x-user-id pattern)
function requireRole(req: any, role: string) {
  const r = String(req.header('x-user-role') || '').toUpperCase();
  if (r !== role) {
    const err: any = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }
}
function userId(req: any) {
  return String(req.header('x-user-id') || '');
}

// NOTE: This helper should be replaced with GCS signed URLs later.
// For now we store the file on disk (apps/api/.local/attachments) and expose download via API.
const ATTACH_DIR = path.join(process.cwd(), '.local', 'attachments');
if (!fs.existsSync(ATTACH_DIR)) fs.mkdirSync(ATTACH_DIR, { recursive: true });

// Very small OCR/extraction stub: we just set extractedText placeholder.
// Later: plug in real OCR (Vision/Tesseract) and PDF text extraction.
async function extractTextStub(opts: { originalName: string; mimeType: string; filePath: string; }): Promise<string> {
  const name = (opts.originalName || '').toLowerCase();
  const mt = (opts.mimeType || '').toLowerCase();
  if (mt.includes('pdf') || name.endsWith('.pdf')) return '[EXTRACTED_TEXT_STUB] PDF uploaded. OCR/text extraction pending.';
  if (mt.includes('image') || name.match(/\.(png|jpg|jpeg|webp)$/)) return '[EXTRACTED_TEXT_STUB] Image uploaded. OCR pending.';
  return '[EXTRACTED_TEXT_STUB] Attachment uploaded.';
}

// Access check: allow if
// - Admin (x-admin-key via /v1/admin/* routes only) is NOT used here.
// - Client who owns case
// - Assigned Lawyer
// - Assigned Agent
async function canAccessCaseByRole(caseId: string, req: any): Promise<boolean> {
  const r = String(req.header('x-user-role') || '').toUpperCase();
  const uid = userId(req);

  const c: any = await prisma.case.findUnique({ where: { id: caseId } });
  if (!c) return false;

  if (r === 'CLIENT') {
    // If your schema uses clientId, keep it; otherwise adjust.
    return !!uid && (c.clientId ? c.clientId === uid : true);
  }
  if (r === 'LAWYER') {
    return !!uid && (c.lawyerId ? c.lawyerId === uid : true);
  }
  if (r === 'AGENT') {
    return !!uid && (c.agentId ? c.agentId === uid : true);
  }
  return false;
}

// Client: upload attachment to case
router.post(
  '/v1/client/cases/:caseId/attachments',
  upload.single('file'),
  async (req: any, res: any) => {
    try {
      requireRole(req, 'CLIENT');
      const caseId = String(req.params.caseId || '').trim();
      if (!caseId) return res.status(400).json({ error: { message: 'CASE_ID_REQUIRED' } });

      const ok = await canAccessCaseByRole(caseId, req);
      if (!ok) return res.status(403).json({ error: { message: 'FORBIDDEN' } });

      const f = req.file;
      if (!f) return res.status(400).json({ error: { message: 'FILE_REQUIRED' } });

      // Persist file to disk with attachment id-based naming later; for now use temp name -> move after create.
      const originalName = String(f.originalname || 'upload');
      const mimeType = String(f.mimetype || 'application/octet-stream');

      const extractedText = await extractTextStub({ originalName, mimeType, filePath: f.path });

      // Create DB row
      const created: any = await prisma.attachment.create({
        data: {
          caseId,
          fileName: originalName,
          mimeType,
          sizeBytes: f.size ?? null,
          // url is served by our download endpoint:
          url: 'PENDING',
          metaJson: JSON.stringify({ extractedText }),
          createdByRole: 'CLIENT',
          createdById: userId(req) || null,
        },
      });

      const ext = path.extname(originalName) || '';
      const diskName = `${created.id}${ext}`;
      const target = path.join(ATTACH_DIR, diskName);
      fs.renameSync(f.path, target);

      const url = `/v1/attachments/${created.id}/download`;
      const updated: any = await prisma.attachment.update({
        where: { id: created.id },
        data: { url },
      });

      return res.json({ ok: true, attachment: updated });
    } catch (e: any) {
      const status = e?.status || 500;
      return res.status(status).json({ error: { message: e?.message || 'UPLOAD_FAILED' } });
    }
  }
);

// Client/Lawyer/Agent: list attachments for a case
router.get('/v1/client/cases/:caseId/attachments', async (req: any, res: any) => {
  try {
    requireRole(req, 'CLIENT');
    const caseId = String(req.params.caseId || '').trim();
    const ok = await canAccessCaseByRole(caseId, req);
    if (!ok) return res.status(403).json({ error: { message: 'FORBIDDEN' } });

    const rows = await prisma.attachment.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });
    res.json({ ok: true, attachments: rows });
  } catch (e: any) {
    res.status(e?.status || 500).json({ error: { message: e?.message || 'FAILED' } });
  }
});

router.get('/v1/lawyer/cases/:caseId/attachments', async (req: any, res: any) => {
  try {
    requireRole(req, 'LAWYER');
    const caseId = String(req.params.caseId || '').trim();
    const ok = await canAccessCaseByRole(caseId, req);
    if (!ok) return res.status(403).json({ error: { message: 'FORBIDDEN' } });

    const rows = await prisma.attachment.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });
    res.json({ ok: true, attachments: rows });
  } catch (e: any) {
    res.status(e?.status || 500).json({ error: { message: e?.message || 'FAILED' } });
  }
});

router.get('/v1/agent/cases/:caseId/attachments', async (req: any, res: any) => {
  try {
    requireRole(req, 'AGENT');
    const caseId = String(req.params.caseId || '').trim();
    const ok = await canAccessCaseByRole(caseId, req);
    if (!ok) return res.status(403).json({ error: { message: 'FORBIDDEN' } });

    const rows = await prisma.attachment.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });
    res.json({ ok: true, attachments: rows });
  } catch (e: any) {
    res.status(e?.status || 500).json({ error: { message: e?.message || 'FAILED' } });
  }
});

// Download (role-gated)
router.get('/v1/attachments/:id/download', async (req: any, res: any) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).send('ID_REQUIRED');

    const a: any = await prisma.attachment.findUnique({ where: { id } });
    if (!a) return res.status(404).send('NOT_FOUND');

    const ok = await canAccessCaseByRole(a.caseId, req);
    if (!ok) return res.status(403).send('FORBIDDEN');

    const ext = path.extname(a.fileName || '') || '';
    const diskName = `${a.id}${ext}`;
    const filePath = path.join(ATTACH_DIR, diskName);
    if (!fs.existsSync(filePath)) return res.status(404).send('FILE_MISSING');

    res.setHeader('Content-Type', a.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${(a.fileName || 'attachment').replace(/"/g, '')}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (e: any) {
    res.status(e?.status || 500).send(e?.message || 'FAILED');
  }
});
'''

# Insert block just before export default router;
out = src[:insert_at] + "\n" + block + "\n" + src[insert_at:]
router_path.write_text(out, encoding="utf-8")
print(f"Patched: {router_path}")
PY "$ROUTER"

echo
echo "== Ensure multer dependency exists in apps/api package.json =="
PKG="$(find "$API_DIR" -maxdepth 2 -type f -name package.json | head -n 1)"
if [[ -z "${PKG:-}" ]]; then
  echo "ERROR: apps/api package.json not found"
  exit 1
fi

node - <<'NODE' "$PKG"
const fs = require('fs');
const p = process.argv[1];
const j = JSON.parse(fs.readFileSync(p,'utf8'));
j.dependencies ||= {};
if (!j.dependencies.multer && !(j.devDependencies && j.devDependencies.multer)) {
  j.dependencies.multer = "^1.4.5-lts.1";
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log("Added multer to dependencies:", p);
} else {
  console.log("multer already present:", p);
}
NODE

echo
echo "== TypeScript build quick check (api) =="
cd "$API_DIR"
npm i
npm run -s build || true

echo
echo "DONE patch_701. Next: deploy API, update traffic, then run curl tests for attachments."
