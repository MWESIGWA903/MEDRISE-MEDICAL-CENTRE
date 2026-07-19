import { Router, type IRouter } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, documentVersionsTable } from '@workspace/db';
import { z } from 'zod';
import { getSessionFromRequest } from '../lib/session';
import { logAudit } from '../lib/audit';

const router: IRouter = Router();

/* ───────────────────────── SCHEMA ───────────────────────── */

const DocumentVersionInputSchema = z.object({
  documentType: z.string().min(1),
  documentId: z.number().int().positive(),
  patientId: z.number().int().positive(),
  content: z.any(), // JSON content
  changeReason: z.string().optional(),
});

/* ───────────────────────── GET VERSION HISTORY ───────────────────────── */

router.get('/document-versions', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const documentId = req.query.documentId ? parseInt(req.query.documentId as string) : null;
  const documentType = req.query.documentType as string | undefined;
  const patientId = req.query.patientId ? parseInt(req.query.patientId as string) : null;

  if (!documentId && !patientId) {
    res.status(400).json({ error: 'Either documentId or patientId is required' });
    return;
  }

  try {
    let query = db.select().from(documentVersionsTable).orderBy(desc(documentVersionsTable.createdAt));

    if (documentId) {
      query = query.where(eq(documentVersionsTable.documentId, documentId));
    }

    if (documentType) {
      query = query.where(eq(documentVersionsTable.documentType, documentType));
    }

    if (patientId) {
      query = query.where(eq(documentVersionsTable.patientId, patientId));
    }

    const rows = await query;

    res.json(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error('GET /document-versions error:', err);
    res.status(500).json({
      error: 'Failed to fetch document versions',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── POST NEW VERSION ───────────────────────── */

router.post('/document-versions', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = DocumentVersionInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    // Get the latest version number for this document
    const existingVersions = await db
      .select()
      .from(documentVersionsTable)
      .where(eq(documentVersionsTable.documentId, parsed.data.documentId))
      .orderBy(desc(documentVersionsTable.version))
      .limit(1);

    const nextVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

    const [record] = await db
      .insert(documentVersionsTable)
      .values({
        documentType: parsed.data.documentType,
        documentId: parsed.data.documentId,
        patientId: parsed.data.patientId,
        version: nextVersion,
        content: parsed.data.content,
        changeReason: parsed.data.changeReason,
        createdById: session.id,
        createdByName: session.name,
      })
      .returning();

    await logAudit(req, 'create_document_version', {
      entityType: 'document_version',
      entityId: record.id,
      details: `Version ${nextVersion} created for ${parsed.data.documentType} ${parsed.data.documentId}`,
    });

    res.status(201).json({
      ...record,
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('POST /document-versions error:', err);
    res.status(500).json({
      error: 'Failed to create document version',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/* ───────────────────────── GET SPECIFIC VERSION ───────────────────────── */

router.get('/document-versions/:id', async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid version ID' });
    return;
  }

  try {
    const [record] = await db
      .select()
      .from(documentVersionsTable)
      .where(eq(documentVersionsTable.id, id));

    if (!record) {
      res.status(404).json({ error: 'Document version not found' });
      return;
    }

    res.json({
      ...record,
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('GET /document-versions/:id error:', err);
    res.status(500).json({
      error: 'Failed to fetch document version',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
