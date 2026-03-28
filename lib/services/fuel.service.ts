import { prisma } from '@/lib/prisma'
import { FleetType } from '@prisma/client'

export interface ListLogsFilters {
  vesselId?: string | null
  fleetFilter?: FleetType | null
}

export interface CreateLogInput {
  vesselId:       string
  type:           'CONSUMO' | 'SURTIDO' | 'AJUSTE'
  liters:         number
  date:           string
  source?:        string | null
  dailyReportId?: string | null
  fuelType?:      string
  operationAt?:   string
  price?:         number | null
  supplier?:      string | null
  bdn?:           string | null
  reportedBy?:    string | null
  notes?:         string | null
}

export async function listLogs({ vesselId, fleetFilter }: ListLogsFilters) {
  return prisma.fuelLog.findMany({
    where: {
      ...(vesselId    ? { vesselId }                            : {}),
      ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
    },
    include: {
      vessel: { select: { id: true, name: true, fuelStockLiters: true } },
      voyage: { select: { id: true, voyageNumber: true } },
    },
    orderBy: { date: 'desc' },
  })
}

export async function createLog(input: CreateLogInput) {
  const liters = Math.abs(Number(input.liters))
  if (liters <= 0) throw 'LITERS_REQUIRED'

  return prisma.$transaction(async (tx) => {
    // Obtener stock actual del buque con lock
    const vessel = await tx.vessel.findUnique({
      where: { id: input.vesselId },
      select: { id: true, fuelStockLiters: true },
    })
    if (!vessel) throw 'VESSEL_NOT_FOUND'

    const current = vessel.fuelStockLiters ?? 0
    let balanceAfter: number

    if (input.type === 'SURTIDO') {
      balanceAfter = current + liters
    } else if (input.type === 'CONSUMO') {
      balanceAfter = Math.max(0, current - liters)
    } else {
      // AJUSTE: el input.liters puede llevar el nuevo valor directamente
      balanceAfter = liters
    }

    // Actualizar stock del buque
    await tx.vessel.update({
      where: { id: input.vesselId },
      data: { fuelStockLiters: balanceAfter },
    })

    // Crear el registro en el libro mayor
    return tx.fuelLog.create({
      data: {
        vesselId:     input.vesselId,
        type:         input.type,
        liters,
        balanceAfter,
        date:         new Date(input.date),
        source:       input.source       ?? 'MANUAL',
        dailyReportId: input.dailyReportId ?? null,
        fuelType:     input.fuelType     || 'MGO',
        operationAt:  input.operationAt  || '',
        price:        input.price        ?? null,
        supplier:     input.supplier     ?? null,
        bdn:          input.bdn          ?? null,
        reportedBy:   input.reportedBy   ?? null,
        notes:        input.notes        ?? null,
      },
      include: {
        vessel: { select: { id: true, name: true, fuelStockLiters: true } },
      },
    })
  })
}

export async function deleteLog(id: string) {
  // Al eliminar un registro, revertir el efecto en el stock del buque
  const log = await prisma.fuelLog.findUnique({
    where: { id },
    select: { vesselId: true, type: true, liters: true },
  })
  if (!log) throw 'NOT_FOUND'

  return prisma.$transaction(async (tx) => {
    const vessel = await tx.vessel.findUnique({
      where: { id: log.vesselId },
      select: { fuelStockLiters: true },
    })
    const current = vessel?.fuelStockLiters ?? 0
    let revertedStock: number

    if (log.type === 'SURTIDO') {
      revertedStock = Math.max(0, current - log.liters)
    } else if (log.type === 'CONSUMO') {
      revertedStock = current + log.liters
    } else {
      revertedStock = current // AJUSTE: no se puede revertir automáticamente
    }

    await tx.vessel.update({
      where: { id: log.vesselId },
      data: { fuelStockLiters: revertedStock },
    })

    await tx.fuelLog.delete({ where: { id } })
  })
}
