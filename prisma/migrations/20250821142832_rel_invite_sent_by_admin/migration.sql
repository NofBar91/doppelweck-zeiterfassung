-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InviteToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedById" TEXT,
    CONSTRAINT "InviteToken_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InviteToken" ("createdAt", "email", "expiresAt", "id", "role", "token", "usedAt") SELECT "createdAt", "email", "expiresAt", "id", "role", "token", "usedAt" FROM "InviteToken";
DROP TABLE "InviteToken";
ALTER TABLE "new_InviteToken" RENAME TO "InviteToken";
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
