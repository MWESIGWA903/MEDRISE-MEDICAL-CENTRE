import { Router, type IRouter } from "express";
import { eq, or, like, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, adminsTable } from "@workspace/db";
import { PROFESSIONAL_ROLES } from "@workspace/db";
import {
  ListStaffResponse,
  CreateStaffBody,
  UpdateStaffParams,
  UpdateStaffBody,
  DeleteStaffParams,
} from "@workspace/api-zod";
import { getSessionFromRequestAsync } from "../lib/session";

const router: IRouter = Router();

const WRITE_ROLES = ["owner", "admin", "medical_director"];

function mapStaff(a: typeof adminsTable.$inferSelect) {
  return {
    id: a.id,
    username: a.username,
    name: a.name,
    role: a.role,
    title: a.title ?? null,
    phone: a.phone ?? null,
    email: a.email ?? null,
    department: a.department ?? null,
    isActive: a.isActive,
  };
}

router.get("/staff", async (req, res): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const department = typeof req.query.department === "string" ? req.query.department : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;

    let conditions = [eq(adminsTable.isActive, true)];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(adminsTable.name, searchPattern),
          like(adminsTable.username, searchPattern),
          like(adminsTable.title || "", searchPattern)
        )!
      );
    }

    const rows = await db.select().from(adminsTable).where(and(...conditions)).orderBy(adminsTable.name);
    
    let filtered = rows;
    if (department) {
      filtered = filtered.filter(s => s.department === department);
    }
    if (role) {
      filtered = filtered.filter(s => s.role === role);
    }

    res.json(ListStaffResponse.parse(filtered.map(mapStaff)));
  } catch (err) {
    console.error("GET /staff error:", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

router.get("/staff/public", async (req, res): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const department = typeof req.query.department === "string" ? req.query.department : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;

    let conditions = [eq(adminsTable.isActive, true)];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(adminsTable.name, searchPattern),
          like(adminsTable.title || "", searchPattern)
        )!
      );
    }

    const rows = await db.select().from(adminsTable).where(and(...conditions)).orderBy(adminsTable.name);
    
    let filtered = rows;
    if (department) {
      filtered = filtered.filter(s => s.department === department);
    }
    if (role) {
      filtered = filtered.filter(s => s.role === role);
    }

    res.json(filtered.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      title: a.title ?? null,
      department: a.department ?? null,
    })));
  } catch (err) {
    console.error("GET /staff/public error:", err);
    res.status(500).json({ error: "Failed to fetch staff directory" });
  }
});

router.post("/staff", async (req, res): Promise<void> => {
  try {
    const session = await getSessionFromRequestAsync(req);
    if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }
    if (!WRITE_ROLES.includes(session.role ?? "")) {
      res.status(403).json({ error: "Forbidden: only admin, owner, or medical_director can create staff accounts" });
      return;
    }

    const parsed = CreateStaffBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

    if (parsed.data.role && !PROFESSIONAL_ROLES.includes(parsed.data.role as any)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${PROFESSIONAL_ROLES.join(", ")}` });
      return;
    }

    const existing = await db.select().from(adminsTable).where(eq(adminsTable.username, parsed.data.username));
    if (existing.length > 0) { res.status(409).json({ error: "Username already exists" }); return; }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const [staff] = await db.insert(adminsTable).values({
      username: parsed.data.username,
      password: hashedPassword,
      name: parsed.data.name,
      role: parsed.data.role,
      title: parsed.data.title ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      department: (parsed.data as any).department ?? null,
    }).returning();

    res.status(201).json(mapStaff(staff));
  } catch (err) {
    console.error("POST /staff error:", err);
    res.status(500).json({ error: "Failed to create staff account" });
  }
});

router.patch("/staff/:id", async (req, res): Promise<void> => {
  try {
    const session = await getSessionFromRequestAsync(req);
    if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }
    if (!WRITE_ROLES.includes(session.role ?? "")) {
      res.status(403).json({ error: "Forbidden: only admin, owner, or medical_director can edit staff accounts" });
      return;
    }

    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = UpdateStaffParams.safeParse({ id: parseInt(raw, 10) });
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const body = UpdateStaffBody.safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

    if (body.data.role && !PROFESSIONAL_ROLES.includes(body.data.role as any)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${PROFESSIONAL_ROLES.join(", ")}` });
      return;
    }

    const updateData: Partial<typeof adminsTable.$inferInsert> = {};
    if (body.data.name !== undefined) updateData.name = body.data.name;
    if (body.data.password !== undefined) updateData.password = await bcrypt.hash(body.data.password, 12);
    if (body.data.role !== undefined) updateData.role = body.data.role;
    if (body.data.title !== undefined) updateData.title = body.data.title;
    if (body.data.phone !== undefined) updateData.phone = body.data.phone;
    if (body.data.email !== undefined) updateData.email = body.data.email;
    if (body.data.department !== undefined) updateData.department = body.data.department;
    if (body.data.isActive !== undefined) updateData.isActive = body.data.isActive;

    const [staff] = await db.update(adminsTable).set(updateData).where(eq(adminsTable.id, params.data.id)).returning();
    if (!staff) { res.status(404).json({ error: "Staff not found" }); return; }

    res.json(mapStaff(staff));
  } catch (err) {
    console.error("PATCH /staff/:id error:", err);
    res.status(500).json({ error: "Failed to update staff account" });
  }
});

router.delete("/staff/:id", async (req, res): Promise<void> => {
  try {
    const session = await getSessionFromRequestAsync(req);
    if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }
    if (!WRITE_ROLES.includes(session.role ?? "")) {
      res.status(403).json({ error: "Forbidden: only admin, owner, or medical_director can delete staff accounts" });
      return;
    }

    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = DeleteStaffParams.safeParse({ id: parseInt(raw, 10) });
    if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

    const [deleted] = await db.delete(adminsTable).where(eq(adminsTable.id, params.data.id)).returning();
    if (!deleted) { res.status(404).json({ error: "Staff not found" }); return; }

    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /staff/:id error:", err);
    res.status(500).json({ error: "Failed to delete staff account" });
  }
});

export default router;
