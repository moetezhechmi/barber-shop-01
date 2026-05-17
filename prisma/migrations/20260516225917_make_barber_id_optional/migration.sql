-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkingHours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barberId" TEXT,
    "shopId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "WorkingHours_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkingHours_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkingHours" ("barberId", "dayOfWeek", "endTime", "id", "isAvailable", "shopId", "startTime") SELECT "barberId", "dayOfWeek", "endTime", "id", "isAvailable", "shopId", "startTime" FROM "WorkingHours";
DROP TABLE "WorkingHours";
ALTER TABLE "new_WorkingHours" RENAME TO "WorkingHours";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
