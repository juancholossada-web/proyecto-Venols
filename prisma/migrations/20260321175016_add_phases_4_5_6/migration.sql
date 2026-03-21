-- CreateEnum
CREATE TYPE "VoyageStatus" AS ENUM ('PLANIFICADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "voyages" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "voyageNumber" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3),
    "arrivalAt" TIMESTAMP(3),
    "status" "VoyageStatus" NOT NULL DEFAULT 'PLANIFICADO',
    "cargoType" TEXT,
    "cargoTons" DOUBLE PRECISION,
    "charterParty" TEXT,
    "clientId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voyages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "voyageId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "fuelType" TEXT NOT NULL DEFAULT 'MGO',
    "operationAt" TEXT NOT NULL,
    "bunkerReceived" DOUBLE PRECISION,
    "consumed" DOUBLE PRECISION,
    "rob" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION,
    "supplier" TEXT,
    "bdn" TEXT,
    "reportedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unidad',
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "supplier" TEXT,
    "lastRestocked" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_operations" (
    "id" TEXT NOT NULL,
    "voyageId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "quantityBL" DOUBLE PRECISION NOT NULL,
    "quantityVEF" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "apiGravity" DOUBLE PRECISION,
    "waterContent" DOUBLE PRECISION,
    "terminal" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "blNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EN_PROCESO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EMPRESA',
    "country" TEXT NOT NULL DEFAULT 'Venezuela',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contact" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_orders" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "system" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "technician" TEXT,
    "spareParts" TEXT,
    "cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_documents" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT,
    "employeeId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issuedBy" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voyages_voyageNumber_key" ON "voyages"("voyageNumber");

-- CreateIndex
CREATE INDEX "voyages_vesselId_idx" ON "voyages"("vesselId");

-- CreateIndex
CREATE INDEX "voyages_status_idx" ON "voyages"("status");

-- CreateIndex
CREATE INDEX "voyages_clientId_idx" ON "voyages"("clientId");

-- CreateIndex
CREATE INDEX "fuel_logs_vesselId_idx" ON "fuel_logs"("vesselId");

-- CreateIndex
CREATE INDEX "fuel_logs_voyageId_idx" ON "fuel_logs"("voyageId");

-- CreateIndex
CREATE INDEX "fuel_logs_date_idx" ON "fuel_logs"("date");

-- CreateIndex
CREATE INDEX "inventory_items_vesselId_idx" ON "inventory_items"("vesselId");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "cargo_operations_voyageId_idx" ON "cargo_operations"("voyageId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_taxId_key" ON "clients"("taxId");

-- CreateIndex
CREATE INDEX "clients_type_idx" ON "clients"("type");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "maintenance_orders_vesselId_idx" ON "maintenance_orders"("vesselId");

-- CreateIndex
CREATE INDEX "maintenance_orders_status_idx" ON "maintenance_orders"("status");

-- CreateIndex
CREATE INDEX "maintenance_orders_priority_idx" ON "maintenance_orders"("priority");

-- CreateIndex
CREATE INDEX "maintenance_orders_dueDate_idx" ON "maintenance_orders"("dueDate");

-- CreateIndex
CREATE INDEX "compliance_documents_vesselId_idx" ON "compliance_documents"("vesselId");

-- CreateIndex
CREATE INDEX "compliance_documents_employeeId_idx" ON "compliance_documents"("employeeId");

-- CreateIndex
CREATE INDEX "compliance_documents_expiresAt_idx" ON "compliance_documents"("expiresAt");

-- CreateIndex
CREATE INDEX "compliance_documents_type_idx" ON "compliance_documents"("type");

-- AddForeignKey
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voyages" ADD CONSTRAINT "voyages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "voyages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_operations" ADD CONSTRAINT "cargo_operations_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "voyages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
