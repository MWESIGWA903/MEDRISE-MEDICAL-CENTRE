import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { adminsTable } from "../lib/db/src/schema/admins.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function clearDemoStaff() {
  console.log("Listing all staff/admin accounts before clearing...");
  const all = await db.select().from(adminsTable);
  console.log(`Found ${all.length} account(s):`);
  for (const a of all) {
    console.log(`  - [${a.id}] ${a.username} (${a.role}) — ${a.name}`);
  }

  const KEEP_USERNAMES = ["Hannington", "mwesigwahannington85@gmail.com"];

  const toDelete = all.filter(a => !KEEP_USERNAMES.includes(a.username));
  if (toDelete.length === 0) {
    console.log("No demo accounts to remove.");
    await pool.end();
    return;
  }

  console.log(`\nRemoving ${toDelete.length} demo account(s):`);
  for (const a of toDelete) {
    const { eq } = await import("drizzle-orm");
    await db.delete(adminsTable).where(eq(adminsTable.id, a.id));
    console.log(`  ✓ Removed: ${a.username} (${a.role})`);
  }

  console.log("\nDone. Add your real staff via the Staff Management tab in the admin portal.");
  await pool.end();
}

clearDemoStaff().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
