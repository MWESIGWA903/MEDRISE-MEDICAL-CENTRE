import { Router } from "express";
import { z } from "zod";
import { db, admissionsTable, patientsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { getSessionFromRequest } from "../lib/session";
import { logAudit } from "../lib/audit";

const router = Router();

const AdmissionInputSchema = z.object({
  patientId: z.number().int().positive(),
  queueEntryId: z.number().int().positive().optional(),
  ward: z.string().min(1).default("General Ward"),
  bedNumber: z.string().optional(),
  admissionType: z.enum(["elective", "emergency"]).default("elective"),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

const AdmissionUpdateSchema = z.object({
  ward: z.string().optional(),
  bedNumber: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "discharged", "transferred", "deceased"]).optional(),
  dischargeSummary: z.string().optional(),
});

router.get("/admissions/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [total, active, dischargedToday] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(admissionsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(admissionsTable).where(eq(admissionsTable.status, "active")),
      db.select({ count: sql<number>`count(*)::int` }).from(admissionsTable).where(
        and(
          eq(admissionsTable.status, "discharged"),
          sql`DATE(${admissionsTable.dischargedAt}) = ${today}`
        )
      ),
    ]);

    const wardRows = await db
      .select({ ward: admissionsTable.ward, count: sql<number>`count(*)::int` })
      .from(admissionsTable)
      .where(eq(admissionsTable.status, "active"))
      .groupBy(admissionsTable.ward);

    res.json({
      total: total[0]?.count ?? 0,
      active: active[0]?.count ?? 0,
      dischargedToday: dischargedToday[0]?.count ?? 0,
      byWard: wardRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admission stats" });
  }
});

router.get("/admissions", async (req, res) => {
  try {
    const { status, ward, patientId } = req.query as Record<string, string | undefined>;

    const conditions = [];
    if (status) conditions.push(eq(admissionsTable.status, status));
    if (ward) conditions.push(eq(admissionsTable.ward, ward));
    if (patientId) conditions.push(eq(admissionsTable.patientId, Number(patientId)));

    const rows = await db
      .select({
        admission: admissionsTable,
        patient: {
          fullName: patientsTable.fullName,
          phone: patientsTable.phone,
          dateOfBirth: patientsTable.dateOfBirth,
          gender: patientsTable.gender,
          bloodType: patientsTable.bloodType,
          allergies: patientsTable.allergies,
        },
      })
      .from(admissionsTable)
      .leftJoin(patientsTable, eq(admissionsTable.patientId, patientsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(admissionsTable.createdAt));

    const result = rows.map(r => ({
      ...r.admission,
      patientName: r.patient?.fullName ?? "Unknown",
      patientPhone: r.patient?.phone ?? null,
      patientGender: r.patient?.gender ?? null,
      patientBloodType: r.patient?.bloodType ?? null,
      patientAllergies: r.patient?.allergies ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch admissions" });
  }
});

router.post("/admissions", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = AdmissionInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const [admission] = await db
      .insert(admissionsTable)
      .values({
        ...parsed.data,
        admittedBy: session.id,
        admittedByName: session.name,
      })
      .returning();

    await logAudit(req, "admit_patient", {
      entityType: "admission",
      entityId: admission.id,
      details: `Patient ID ${parsed.data.patientId} admitted to ${parsed.data.ward}`,
    });

    res.status(201).json(admission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to admit patient" });
  }
});

router.patch("/admissions/:id", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = AdmissionUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }

  try {
    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };

    if (parsed.data.status === "discharged" && !updates.dischargedAt) {
      updates.dischargedAt = new Date();
      updates.dischargedByName = session.name;
    }

    const [updated] = await db
      .update(admissionsTable)
      .set(updates)
      .where(eq(admissionsTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Admission not found" }); return; }

    const action = parsed.data.status === "discharged" ? "discharge_patient" : "update_admission";
    await logAudit(req, action, {
      entityType: "admission",
      entityId: id,
      details: parsed.data.status === "discharged"
        ? `Patient discharged from ${updated.ward}`
        : `Admission #${id} updated`,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update admission" });
  }
});

router.delete("/admissions/:id", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }

  try {
    const [deleted] = await db
      .delete(admissionsTable)
      .where(eq(admissionsTable.id, id))
      .returning();

    if (!deleted) { res.status(404).json({ error: "Admission not found" }); return; }

    await logAudit(req, "delete_admission", { entityType: "admission", entityId: id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete admission" });
  }
});

export default router;
