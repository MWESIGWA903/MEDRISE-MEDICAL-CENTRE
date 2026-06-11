import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, patientsTable, consultationsTable, appointmentsTable, invoicesTable, labOrdersTable, pharmacyStockTable, attendanceTable, hmisTargetsTable } from "@workspace/db";
import { getSessionFromRequest } from "../lib/session";

const router: IRouter = Router();

const TARGET_ADMIN_ROLES = ["medical_director", "owner", "admin"];
const VALID_PERIOD_TYPES = ["daily", "weekly", "monthly", "yearly"];
const VALID_METRIC_KEYS = ["new_patients", "outpatient_visits", "revenue", "lab_tests", "appointments_completed", "pharmacy_dispensing"];

router.get("/reports/summary", async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01`;
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const monthEnd = nextMonth.toISOString().slice(0, 10);

  const [
    allPatients,
    consultations,
    appointments,
    invoices,
    labOrders,
    stockItems,
    attendanceRecords,
  ] = await Promise.all([
    db.select().from(patientsTable),
    db.select().from(consultationsTable),
    db.select().from(appointmentsTable),
    db.select().from(invoicesTable),
    db.select().from(labOrdersTable),
    db.select().from(pharmacyStockTable),
    db.select().from(attendanceTable),
  ]);

  const newPatients = allPatients.filter(p => p.createdAt.toISOString().slice(0, 10) >= monthStart && p.createdAt.toISOString().slice(0, 10) < monthEnd).length;
  const monthConsultations = consultations.filter(c => c.visitDate >= monthStart && c.visitDate < monthEnd).length;
  const monthAppointments = appointments.filter(a => a.preferredDate >= monthStart && a.preferredDate < monthEnd);
  const completedAppts = monthAppointments.filter(a => a.status === "completed").length;
  const monthInvoices = invoices.filter(i => i.createdAt.toISOString().slice(0, 10) >= monthStart && i.createdAt.toISOString().slice(0, 10) < monthEnd);
  const totalRevenue = monthInvoices.reduce((s, i) => s + parseFloat(String(i.paidAmount)), 0);
  const monthLabOrders = labOrders.filter(l => l.orderedAt.toISOString().slice(0, 10) >= monthStart && l.orderedAt.toISOString().slice(0, 10) < monthEnd);
  const completedLab = monthLabOrders.filter(l => l.status === "completed").length;
  const lowStock = stockItems.filter(s => s.quantity <= s.reorderLevel).length;
  const monthAttendance = attendanceRecords.filter(a => {
    const d = typeof a.date === "string" ? a.date : a.date;
    return String(d) >= monthStart && String(d) < monthEnd;
  });
  const staffPresent = monthAttendance.filter(a => a.status === "present" || a.status === "late").length;
  const staffAbsent = monthAttendance.filter(a => a.status === "absent").length;

  res.json({
    month,
    totalPatients: allPatients.length,
    newPatients,
    totalConsultations: monthConsultations,
    totalAppointments: monthAppointments.length,
    completedAppointments: completedAppts,
    totalRevenue: totalRevenue.toFixed(2),
    totalLabOrders: monthLabOrders.length,
    completedLabOrders: completedLab,
    lowStockDrugs: lowStock,
    staffPresent,
    staffAbsent,
  });
});

router.get("/reports/targets", async (req, res): Promise<void> => {
  const periodType = typeof req.query.periodType === "string" ? req.query.periodType : undefined;
  let targets;
  if (periodType) {
    targets = await db.select().from(hmisTargetsTable).where(eq(hmisTargetsTable.periodType, periodType));
  } else {
    targets = await db.select().from(hmisTargetsTable);
  }
  res.json(targets);
});

router.put("/reports/targets", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!session.role || !TARGET_ADMIN_ROLES.includes(session.role)) {
    res.status(403).json({ error: "Forbidden: only admin, owner, or medical_director can update targets" });
    return;
  }

  const { targets } = req.body as {
    targets: Array<{ metricKey: string; periodType: string; targetValue: number }>;
  };

  if (!Array.isArray(targets) || targets.length === 0) {
    res.status(400).json({ error: "targets array is required" });
    return;
  }

  for (const t of targets) {
    if (!VALID_PERIOD_TYPES.includes(t.periodType)) {
      res.status(400).json({ error: `Invalid periodType "${t.periodType}". Must be one of: ${VALID_PERIOD_TYPES.join(", ")}` });
      return;
    }
    if (!VALID_METRIC_KEYS.includes(t.metricKey)) {
      res.status(400).json({ error: `Invalid metricKey "${t.metricKey}". Must be one of: ${VALID_METRIC_KEYS.join(", ")}` });
      return;
    }
    if (typeof t.targetValue !== "number" || t.targetValue < 0 || !Number.isInteger(t.targetValue)) {
      res.status(400).json({ error: `targetValue must be a non-negative integer` });
      return;
    }
  }

  const results = await db
    .insert(hmisTargetsTable)
    .values(targets.map(t => ({
      metricKey: t.metricKey,
      periodType: t.periodType,
      targetValue: t.targetValue,
      updatedBy: session.id,
    })))
    .onConflictDoUpdate({
      target: [hmisTargetsTable.metricKey, hmisTargetsTable.periodType],
      set: {
        targetValue: sql`excluded.target_value`,
        updatedBy: sql`excluded.updated_by`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  res.json(results);
});

export default router;
