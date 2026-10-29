/**
 * Migration script: fix dayOfWeek convention for shop working hours.
 *
 * Old convention (bugged): dayOfWeek = (i+1) % 7
 *   Lundi=1, Mardi=2, Mercredi=3, Jeudi=4, Vendredi=5, Samedi=6, Dimanche=0
 *
 * New convention (correct): dayOfWeek = i
 *   Lundi=0, Mardi=1, Mercredi=2, Jeudi=3, Vendredi=4, Samedi=5, Dimanche=6
 *
 * Migration formula: newDayOfWeek = (oldDayOfWeek + 6) % 7
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const shopHours = await prisma.workingHours.findMany({
    where: { barberId: null },
  });

  console.log(`Found ${shopHours.length} shop-level working hour records.`);

  for (const record of shopHours) {
    const newDayOfWeek = (record.dayOfWeek + 6) % 7;
    await prisma.workingHours.update({
      where: { id: record.id },
      data: { dayOfWeek: newDayOfWeek },
    });
    console.log(
      `  Updated record ${record.id}: dayOfWeek ${record.dayOfWeek} → ${newDayOfWeek}`
    );
  }

  console.log("Migration complete.");
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
