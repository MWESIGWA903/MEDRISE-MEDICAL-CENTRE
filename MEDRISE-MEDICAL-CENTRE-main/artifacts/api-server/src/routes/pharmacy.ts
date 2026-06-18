import { Router, type IRouter } from "express";
import { eq, ilike, desc } from "drizzle-orm";
import { db, pharmacyStockTable, pharmacyDispensingsTable, pharmacyOrdersTable, patientsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";
import { createAndBroadcast } from "../lib/notificationHelper";

const router: IRouter = Router();

const StockInputSchema = z.object({
  drugName: z.string().min(1),
  genericName: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().int().min(0),
  unit: z.string().min(1),
  reorderLevel: z.number().int().min(0).optional(),
  expiryDate: z.string().optional(),
  buyingPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const DispenseInputSchema = z.object({
  stockId: z.number().int(),
  quantity: z.number().int().min(1),
  patientId: z.number().int().optional(),
  consultationId: z.number().int().optional(),
  notes: z.string().optional(),
});

function mapStock(s: typeof pharmacyStockTable.$inferSelect) {
  return {
    ...s,
    buyingPrice: s.buyingPrice ? String(s.buyingPrice) : null,
    sellingPrice: s.sellingPrice ? String(s.sellingPrice) : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/pharmacy/stock", async (req, res): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const lowStock = req.query.lowStock === "true";
    let rows = search
      ? await db.select().from(pharmacyStockTable).where(ilike(pharmacyStockTable.drugName, `%${search}%`)).orderBy(pharmacyStockTable.drugName)
      : await db.select().from(pharmacyStockTable).orderBy(pharmacyStockTable.drugName);
    if (lowStock) rows = rows.filter(r => r.quantity <= r.reorderLevel);
    res.json(rows.map(mapStock));
  } catch (err) {
    console.error("GET /pharmacy/stock error:", err);
    res.status(500).json({ error: "Failed to fetch pharmacy stock" });
  }
});

router.post("/pharmacy/stock", async (req, res): Promise<void> => {
  try {
    const parsed = StockInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.insert(pharmacyStockTable).values({
      drugName: parsed.data.drugName,
      genericName: parsed.data.genericName ?? null,
      category: parsed.data.category ?? null,
      quantity: parsed.data.quantity,
      unit: parsed.data.unit,
      reorderLevel: parsed.data.reorderLevel ?? 10,
      expiryDate: parsed.data.expiryDate ?? null,
      buyingPrice: parsed.data.buyingPrice !== undefined ? String(parsed.data.buyingPrice) : null,
      sellingPrice: parsed.data.sellingPrice !== undefined ? String(parsed.data.sellingPrice) : null,
      notes: parsed.data.notes ?? null,
    }).returning();
    logAudit(req, "add_drug_stock", { entityType: "pharmacy_stock", entityId: row.id, details: `${row.drugName} — qty ${row.quantity} ${row.unit}` }).catch(() => {});
    res.status(201).json(mapStock(row));
  } catch (err) {
    console.error("POST /pharmacy/stock error:", err);
    res.status(500).json({ error: "Failed to add drug to stock" });
  }
});

router.patch("/pharmacy/stock/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const parsed = StockInputSchema.partial().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.drugName !== undefined) updateData.drugName = parsed.data.drugName;
    if (parsed.data.genericName !== undefined) updateData.genericName = parsed.data.genericName;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.quantity !== undefined) updateData.quantity = parsed.data.quantity;
    if (parsed.data.unit !== undefined) updateData.unit = parsed.data.unit;
    if (parsed.data.reorderLevel !== undefined) updateData.reorderLevel = parsed.data.reorderLevel;
    if (parsed.data.expiryDate !== undefined) updateData.expiryDate = parsed.data.expiryDate;
    if (parsed.data.buyingPrice !== undefined) updateData.buyingPrice = String(parsed.data.buyingPrice);
    if (parsed.data.sellingPrice !== undefined) updateData.sellingPrice = String(parsed.data.sellingPrice);
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    const [before] = await db.select().from(pharmacyStockTable).where(eq(pharmacyStockTable.id, id));
    const [row] = await db.update(pharmacyStockTable).set(updateData).where(eq(pharmacyStockTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    logAudit(req, "update_drug_stock", { entityType: "pharmacy_stock", entityId: row.id, details: row.drugName }).catch(() => {});
    const wasOk = before ? before.quantity > before.reorderLevel : true;
    const isLow = row.quantity <= row.reorderLevel;
    if (wasOk && isLow) {
      const isOut = row.quantity === 0;
      void createAndBroadcast({ type: "pharmacy_stock", title: isOut ? `Out of Stock: ${row.drugName}` : `Low Stock: ${row.drugName}`, body: isOut ? `${row.drugName} is now out of stock.` : `${row.drugName} has ${row.quantity} ${row.unit} remaining.`, severity: isOut ? "urgent" : "warning", relatedId: row.id });
    }
    res.json(mapStock(row));
  } catch (err) {
    console.error("PATCH /pharmacy/stock/:id error:", err);
    res.status(500).json({ error: "Failed to update drug stock" });
  }
});

router.delete("/pharmacy/stock/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const [row] = await db.delete(pharmacyStockTable).where(eq(pharmacyStockTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    logAudit(req, "delete_drug_stock", { entityType: "pharmacy_stock", entityId: row.id, details: row.drugName }).catch(() => {});
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /pharmacy/stock/:id error:", err);
    res.status(500).json({ error: "Failed to delete drug stock" });
  }
});

router.post("/pharmacy/dispense", async (req, res): Promise<void> => {
  try {
    const parsed = DispenseInputSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [stock] = await db.select().from(pharmacyStockTable).where(eq(pharmacyStockTable.id, parsed.data.stockId));
    if (!stock) { res.status(404).json({ error: "Stock item not found" }); return; }
    if (stock.quantity < parsed.data.quantity) { res.status(400).json({ error: "Insufficient stock" }); return; }
    const [updated] = await db.update(pharmacyStockTable).set({ quantity: stock.quantity - parsed.data.quantity, updatedAt: new Date() }).where(eq(pharmacyStockTable.id, parsed.data.stockId)).returning();
    await db.insert(pharmacyDispensingsTable).values({ stockId: parsed.data.stockId, patientId: parsed.data.patientId ?? null, consultationId: parsed.data.consultationId ?? null, quantity: parsed.data.quantity, notes: parsed.data.notes ?? null });
    logAudit(req, "dispense_drug", { entityType: "pharmacy_stock", entityId: stock.id, details: `${stock.drugName} — qty ${parsed.data.quantity} ${stock.unit}` }).catch(() => {});
    if (updated.quantity <= updated.reorderLevel) {
      const isOut = updated.quantity === 0;
      void createAndBroadcast({ type: "pharmacy_stock", title: isOut ? `Out of Stock: ${updated.drugName}` : `Low Stock: ${updated.drugName}`, body: isOut ? `${updated.drugName} is now out of stock.` : `${updated.drugName} has ${updated.quantity} ${updated.unit} remaining.`, severity: isOut ? "urgent" : "warning", relatedId: updated.id });
    }
    res.json(mapStock(updated));
  } catch (err) {
    console.error("POST /pharmacy/dispense error:", err);
    res.status(500).json({ error: "Failed to dispense drug" });
  }
});

router.get("/pharmacy/stats", async (_req, res): Promise<void> => {
  try {
    const rows = await db.select().from(pharmacyStockTable);
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    res.json({
      totalItems: rows.length,
      lowStockItems: rows.filter(r => r.quantity > 0 && r.quantity <= r.reorderLevel).length,
      outOfStockItems: rows.filter(r => r.quantity === 0).length,
      expiringItems: rows.filter(r => r.expiryDate && r.expiryDate <= thirtyDays).length,
    });
  } catch (err) {
    console.error("GET /pharmacy/stats error:", err);
    res.status(500).json({ error: "Failed to fetch pharmacy stats" });
  }
});

router.get("/pharmacy/orders", async (req, res): Promise<void> => {
  try {
    const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    let rows = await db.select().from(pharmacyOrdersTable).orderBy(desc(pharmacyOrdersTable.createdAt));
    if (patientId) rows = rows.filter(r => r.patientId === patientId);
    if (status) rows = rows.filter(r => r.status === status);
    const enriched = await Promise.all(rows.map(async r => {
      const patient = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, r.patientId)).then(x => x[0]);
      return { ...r, patientName: patient?.fullName ?? null, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
    }));
    res.json(enriched);
  } catch (err) {
    console.error("GET /pharmacy/orders error:", err);
    res.status(500).json({ error: "Failed to fetch pharmacy orders" });
  }
});

router.patch("/pharmacy/orders/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const schema = z.object({ status: z.string().optional(), notes: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
    const [row] = await db.update(pharmacyOrdersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(pharmacyOrdersTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
  } catch (err) {
    console.error("PATCH /pharmacy/orders/:id error:", err);
    res.status(500).json({ error: "Failed to update pharmacy order" });
  }
});

export default router;
