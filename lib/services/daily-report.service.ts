import { prisma } from '@/lib/prisma'
import { FleetType } from '@prisma/client'

export interface ListReportsFilters {
  vesselId?: string | null
  date?: string | null
  from?: string | null
  to?: string | null
  fleetFilter?: FleetType | null
}

export interface CreateReportInput {
  vesselId: string
  date: string
  client?: string | null
  activity?: string | null
  location?: string | null
  captain?: string | null
  marineOnDuty?: string | null
  personnel?: string | null
  fuelLevelLiters?: string | number | null
  fuelPercentage?: string | number | null
  waterOnBoardLiters?: string | number | null
  waterOnBoardPercent?: string | number | null
  vesselStatus?: string | null
  notes?: string | null
  createdBy?: string | null
}

export async function listReports({ vesselId, date, from, to, fleetFilter }: ListReportsFilters) {
  const dateFilter = buildDateFilter(date, from, to)

  return prisma.dailyReport.findMany({
    where: {
      ...(vesselId    ? { vesselId }        : {}),
      ...(dateFilter  ? { date: dateFilter } : {}),
      ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
    },
    include: {
      vessel: { select: { id: true, name: true, fleetType: true, vesselType: true, tankCapacityLiters: true, waterTankCapacityLiters: true } },
    },
    orderBy: { date: 'desc' },
  })
}

export async function createReport(input: CreateReportInput) {
  return prisma.dailyReport.create({
    data: {
      vesselId:        input.vesselId,
      date:            new Date(input.date),
      client:          input.client          ?? null,
      activity:        input.activity        ?? null,
      location:        input.location        ?? null,
      captain:         input.captain         ?? null,
      marineOnDuty:    input.marineOnDuty    ?? null,
      personnel:       input.personnel       ?? null,
      fuelLevelLiters:     input.fuelLevelLiters     ? parseFloat(String(input.fuelLevelLiters))     : null,
      fuelPercentage:      input.fuelPercentage      ? parseFloat(String(input.fuelPercentage))      : null,
      waterOnBoardLiters:  input.waterOnBoardLiters  ? parseFloat(String(input.waterOnBoardLiters))  : null,
      waterOnBoardPercent: input.waterOnBoardPercent ? parseFloat(String(input.waterOnBoardPercent)) : null,
      vesselStatus:        input.vesselStatus         ?? null,
      notes:           input.notes           ?? null,
      createdBy:       input.createdBy       ?? null,
    },
  })
}

function buildDateFilter(date?: string | null, from?: string | null, to?: string | null) {
  if (date) {
    const d = new Date(date)
    return { gte: d, lt: new Date(d.getTime() + 86_400_000) }
  }
  if (from || to) {
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    }
  }
  return null
}
