/*
  Warnings:

  - You are about to drop the column `estado` on the `Lead` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "rubro" TEXT,
    "ciudad" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "web" TEXT,
    "stageId" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "fuente" TEXT,
    "nota" TEXT,
    "ultimoContacto" DATETIME,
    "proximoSeguimiento" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Lead_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("actualizadoEn", "ciudad", "creadoEn", "empresa", "fuente", "id", "instagram", "nombre", "nota", "prioridad", "proximoSeguimiento", "rubro", "telefono", "ultimoContacto", "web", "whatsapp") SELECT "actualizadoEn", "ciudad", "creadoEn", "empresa", "fuente", "id", "instagram", "nombre", "nota", "prioridad", "proximoSeguimiento", "rubro", "telefono", "ultimoContacto", "web", "whatsapp" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_stageId_idx" ON "Lead"("stageId");
CREATE INDEX "Lead_prioridad_idx" ON "Lead"("prioridad");
CREATE INDEX "Lead_rubro_idx" ON "Lead"("rubro");
CREATE INDEX "Lead_ciudad_idx" ON "Lead"("ciudad");
CREATE INDEX "Lead_fuente_idx" ON "Lead"("fuente");
CREATE INDEX "Lead_proximoSeguimiento_idx" ON "Lead"("proximoSeguimiento");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_key_key" ON "PipelineStage"("key");

-- CreateIndex
CREATE INDEX "PipelineStage_orden_idx" ON "PipelineStage"("orden");
