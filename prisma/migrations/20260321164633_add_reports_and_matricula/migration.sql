-- AlterTable
ALTER TABLE "vessels" ADD COLUMN     "marineOnDuty" TEXT,
ADD COLUMN     "matricula" TEXT;

-- CreateTable
CREATE TABLE "fuel_reports" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fuelLevel" DOUBLE PRECISION NOT NULL,
    "fuelUnit" TEXT NOT NULL DEFAULT 'litros',
    "consumption" DOUBLE PRECISION,
    "location" TEXT,
    "operator" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_reports" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technician" TEXT,
    "partsReplaced" TEXT,
    "cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "nextScheduled" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_reports" (
    "id" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "fuelLevel" DOUBLE PRECISION,
    "client" TEXT,
    "captain" TEXT NOT NULL,
    "marineOnDuty" TEXT NOT NULL,
    "vesselStatus" "VesselStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_reports_vesselId_idx" ON "fuel_reports"("vesselId");

-- CreateIndex
CREATE INDEX "fuel_reports_date_idx" ON "fuel_reports"("date");

-- CreateIndex
CREATE INDEX "maintenance_reports_vesselId_idx" ON "maintenance_reports"("vesselId");

-- CreateIndex
CREATE INDEX "maintenance_reports_date_idx" ON "maintenance_reports"("date");

-- CreateIndex
CREATE INDEX "status_reports_vesselId_idx" ON "status_reports"("vesselId");

-- CreateIndex
CREATE INDEX "status_reports_date_idx" ON "status_reports"("date");

-- AddForeignKey
ALTER TABLE "fuel_reports" ADD CONSTRAINT "fuel_reports_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reports" ADD CONSTRAINT "maintenance_reports_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_reports" ADD CONSTRAINT "status_reports_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
