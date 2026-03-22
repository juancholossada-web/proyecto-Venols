-- AlterTable
ALTER TABLE "maintenance_orders" ADD COLUMN     "actionTaken" TEXT,
ADD COLUMN     "cause" TEXT,
ADD COLUMN     "downtimeHours" DOUBLE PRECISION,
ADD COLUMN     "equipmentAffected" TEXT,
ADD COLUMN     "failureMode" TEXT,
ADD COLUMN     "rootCause" TEXT;

-- AlterTable
ALTER TABLE "vessels" ADD COLUMN     "tankCapacityLiters" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "currentHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastServiceAt" DOUBLE PRECISION,
    "serviceInterval" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'OPERATIVO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_hour_logs" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hoursReading" DOUBLE PRECISION NOT NULL,
    "hoursRun" DOUBLE PRECISION,
    "reportedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_hour_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_programs" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "frequencyHours" DOUBLE PRECISION,
    "lastExecuted" TIMESTAMP(3),
    "nextDue" TIMESTAMP(3),
    "tasks" TEXT NOT NULL,
    "materials" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "executedBy" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "client" TEXT,
    "activity" TEXT NOT NULL,
    "location" TEXT,
    "captain" TEXT NOT NULL,
    "marineOnDuty" TEXT NOT NULL,
    "personnel" TEXT,
    "fuelLevelLiters" DOUBLE PRECISION,
    "fuelPercentage" DOUBLE PRECISION,
    "vesselStatus" "VesselStatus" NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "equipment_vesselId_idx" ON "equipment"("vesselId");

-- CreateIndex
CREATE INDEX "equipment_type_idx" ON "equipment"("type");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_vesselId_name_key" ON "equipment"("vesselId", "name");

-- CreateIndex
CREATE INDEX "equipment_hour_logs_equipmentId_idx" ON "equipment_hour_logs"("equipmentId");

-- CreateIndex
CREATE INDEX "equipment_hour_logs_date_idx" ON "equipment_hour_logs"("date");

-- CreateIndex
CREATE INDEX "maintenance_programs_vesselId_idx" ON "maintenance_programs"("vesselId");

-- CreateIndex
CREATE INDEX "maintenance_programs_nextDue_idx" ON "maintenance_programs"("nextDue");

-- CreateIndex
CREATE INDEX "maintenance_programs_status_idx" ON "maintenance_programs"("status");

-- CreateIndex
CREATE INDEX "inventory_movements_inventoryItemId_idx" ON "inventory_movements"("inventoryItemId");

-- CreateIndex
CREATE INDEX "inventory_movements_date_idx" ON "inventory_movements"("date");

-- CreateIndex
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements"("type");

-- CreateIndex
CREATE INDEX "daily_reports_vesselId_idx" ON "daily_reports"("vesselId");

-- CreateIndex
CREATE INDEX "daily_reports_date_idx" ON "daily_reports"("date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_vesselId_name_key" ON "inventory_items"("vesselId", "name");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_hour_logs" ADD CONSTRAINT "equipment_hour_logs_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_programs" ADD CONSTRAINT "maintenance_programs_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

