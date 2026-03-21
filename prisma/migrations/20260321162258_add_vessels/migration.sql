-- CreateEnum
CREATE TYPE "FleetType" AS ENUM ('PESADA', 'LIVIANA');

-- CreateEnum
CREATE TYPE "VesselStatus" AS ENUM ('OPERATIVO', 'EN_TRANSITO', 'ATRACADO', 'MANTENIMIENTO', 'INACTIVO');

-- CreateTable
CREATE TABLE "vessels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fleetType" "FleetType" NOT NULL,
    "vesselType" TEXT NOT NULL,
    "status" "VesselStatus" NOT NULL DEFAULT 'OPERATIVO',
    "flag" TEXT DEFAULT 'Venezuela',
    "yearBuilt" INTEGER,
    "grossTon" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "capacity" DOUBLE PRECISION,
    "capacityUnit" TEXT,
    "captain" TEXT,
    "homePort" TEXT,
    "imoNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vessels_imoNumber_key" ON "vessels"("imoNumber");

-- CreateIndex
CREATE INDEX "vessels_fleetType_idx" ON "vessels"("fleetType");

-- CreateIndex
CREATE INDEX "vessels_status_idx" ON "vessels"("status");
