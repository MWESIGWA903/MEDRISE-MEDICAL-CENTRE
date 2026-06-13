import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { adminsTable } from "../lib/db/src/schema/admins.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const SEED_ADMIN = {
  username: "Hannington",
  password: "admin123",
  name: "Dr. Hannington",
  role: "medical_director",
  title: "Medical Director",
  mustChangePassword: false,
  isActive: true,
};

async function seed() {
  console.log("Seeding database...");

  const existing = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, SEED_ADMIN.username));

  if (existing.length > 0) {
    console.log(`Admin '${SEED_ADMIN.username}' already exists — updating password hash.`);
    const hashed = await bcrypt.hash(SEED_ADMIN.password, 12);
    await db
      .update(adminsTable)
      .set({
        password: hashed,
        role: SEED_ADMIN.role,
        mustChangePassword: SEED_ADMIN.mustChangePassword,
        isActive: SEED_ADMIN.isActive,
      })
      .where(eq(adminsTable.username, SEED_ADMIN.username));
    console.log("Admin updated.");
  } else {
    const hashed = await bcrypt.hash(SEED_ADMIN.password, 12);
    await db.insert(adminsTable).values({
      ...SEED_ADMIN,
      password: hashed,
    });
    console.log(`Admin '${SEED_ADMIN.username}' created successfully.`);
  }

  await pool.end();
  console.log("Seeding complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
