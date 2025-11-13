-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "profit" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("createdAt", "id", "partId", "profit", "quantity", "totalPrice") SELECT "createdAt", "id", "partId", "profit", "quantity", "totalPrice" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE TABLE "new_SaleNoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNoteId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "sellPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SaleNoteItem_saleNoteId_fkey" FOREIGN KEY ("saleNoteId") REFERENCES "SaleNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SaleNoteItem" ("id", "name", "partId", "profit", "quantity", "saleNoteId", "sellPrice", "totalPrice") SELECT "id", "name", "partId", "profit", "quantity", "saleNoteId", "sellPrice", "totalPrice" FROM "SaleNoteItem";
DROP TABLE "SaleNoteItem";
ALTER TABLE "new_SaleNoteItem" RENAME TO "SaleNoteItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
