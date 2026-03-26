import { prisma } from '@/lib/prisma'
import { FleetType } from '@prisma/client'

export async function listVessels(fleetFilter: FleetType | null) {
  return prisma.vessel.findMany({
    where: fleetFilter ? { fleetType: fleetFilter } : {},
    orderBy: [{ fleetType: 'asc' }, { name: 'asc' }],
  })
}

export async function getVessel(id: string) {
  return prisma.vessel.findUnique({ where: { id } })
}

export async function updateVessel(id: string, data: Record<string, unknown>) {
  return prisma.vessel.update({ where: { id }, data })
}
