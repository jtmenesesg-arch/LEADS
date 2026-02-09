-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "rubro" TEXT,
    "ciudad" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "web" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "fuente" TEXT,
    "nota" TEXT,
    "ultimoContacto" DATETIME,
    "proximoSeguimiento" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Interaccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenido" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Interaccion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Lead_estado_idx" ON "Lead"("estado");

-- CreateIndex
CREATE INDEX "Lead_prioridad_idx" ON "Lead"("prioridad");

-- CreateIndex
CREATE INDEX "Lead_rubro_idx" ON "Lead"("rubro");

-- CreateIndex
CREATE INDEX "Lead_ciudad_idx" ON "Lead"("ciudad");

-- CreateIndex
CREATE INDEX "Lead_fuente_idx" ON "Lead"("fuente");

-- CreateIndex
CREATE INDEX "Lead_proximoSeguimiento_idx" ON "Lead"("proximoSeguimiento");

-- CreateIndex
CREATE INDEX "Interaccion_leadId_idx" ON "Interaccion"("leadId");

-- CreateIndex
CREATE INDEX "Interaccion_fecha_idx" ON "Interaccion"("fecha");
