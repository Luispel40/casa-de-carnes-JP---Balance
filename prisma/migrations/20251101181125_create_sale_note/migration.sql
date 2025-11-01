/*
  Warnings:

  - You are about to drop the column `items` on the `SaleNote` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SaleNoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNoteId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "sellPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "profit" REAL NOT NULL,
    CONSTRAINT "SaleNoteItem_saleNoteId_fkey" FOREIGN KEY ("saleNoteId") REFERENCES "SaleNote" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SaleNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SaleNote" ("createdAt", "id", "totalAmount", "userId") SELECT "createdAt", "id", "totalAmount", "userId" FROM "SaleNote";
DROP TABLE "SaleNote";
ALTER TABLE "new_SaleNote" RENAME TO "SaleNote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
