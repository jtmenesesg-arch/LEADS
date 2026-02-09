-- CreateTable
CREATE TABLE "LeadChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valorAntes" TEXT,
    "valorDespues" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeadChange_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LeadChange_leadId_idx" ON "LeadChange"("leadId");

-- CreateIndex
CREATE INDEX "LeadChange_creadoEn_idx" ON "LeadChange"("creadoEn");
