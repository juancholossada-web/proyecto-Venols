import { prisma } from '@/lib/prisma'
import { FleetType } from '@prisma/client'

export interface ListLogsFilters {
  vesselId?: string | null
  fleetFilter?: FleetType | null
}

export interface CreateLogInput {
  vesselId: string
  voyageId?: string | null
  date: string
  fuelType?: string
  operationAt: string
  bunkerReceived?: string | number | null
  consumed?: string | number | null
  rob: string | number
  price?: string | number | null
  supplier?: string | null
  bdn?: string | null
  reportedBy?: string | null
  notes?: string | null
}

export async function listLogs({ vesselId, fleetFilter }: ListLogsFilters) {
  return prisma.fuelLog.findMany({
    where: {
      ...(vesselId    ? { vesselId }                                   : {}),
      ...(fleetFilter ? { vessel: { fleetType: fleetFilter } }        : {}),
    },
    include: {
      vessel: { select: { id: true, name: true } },
      voyage: { select: { id: true, voyageNumber: true } },
    },
    orderBy: { date: 'desc' },
  })
}

export async function createLog(input: CreateLogInput) {
  return prisma.fuelLog.create({
    data: {
      vesselId:       input.vesselId,
      voyageId:       input.voyageId       ?? null,
      date:           new Date(input.date),
      fuelType:       input.fuelType       || 'MGO',
      operationAt:    input.operationAt,
      bunkerReceived: input.bunkerReceived ? parseFloat(String(input.bunkerReceived)) : null,
      consumed:       input.consumed       ? parseFloat(String(input.consumed))       : null,
      rob:            parseFloat(String(input.rob)),
      price:          input.price          ? parseFloat(String(input.price))          : null,
      supplier:       input.supplier       ?? null,
      bdn:            input.bdn            ?? null,
      reportedBy:     input.reportedBy     ?? null,
      notes:          input.notes          ?? null,
    },
  })
}
