import { prisma } from '@/lib/prisma'
import { FleetType } from '@prisma/client'

export interface ListOrdersFilters {
  vesselId?: string | null
  status?: string | null
  type?: string | null
  fleetFilter?: FleetType | null
}

export interface CreateOrderInput {
  vesselId: string
  type: string
  description: string
  priority?: string
  system: string
  dueDate: string
  technician?: string | null
  spareParts?: string | null
  cost?: string | number | null
  status?: string
  notes?: string | null
  cause?: string | null
  rootCause?: string | null
  failureMode?: string | null
  actionTaken?: string | null
  downtimeHours?: string | number | null
  equipmentAffected?: string | null
}

export interface UpdateOrderInput {
  type?: string
  description?: string
  priority?: string
  system?: string
  dueDate?: string
  completedAt?: string
  technician?: string
  spareParts?: string
  cost?: string | number | null
  status?: string
  notes?: string
  cause?: string
  rootCause?: string
  failureMode?: string
  actionTaken?: string
  downtimeHours?: string | number | null
  equipmentAffected?: string
}

export async function listOrders({ vesselId, status, type, fleetFilter }: ListOrdersFilters) {
  return prisma.maintenanceOrder.findMany({
    where: {
      ...(vesselId    ? { vesselId }    : {}),
      ...(status      ? { status }      : {}),
      ...(type        ? { type }        : {}),
      ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
    },
    include: { vessel: { select: { id: true, name: true, fleetType: true } } },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })
}

export async function createOrder(input: CreateOrderInput) {
  return prisma.maintenanceOrder.create({
    data: {
      vesselId:          input.vesselId,
      type:              input.type,
      description:       input.description,
      priority:          input.priority          || 'MEDIA',
      system:            input.system,
      dueDate:           new Date(input.dueDate),
      technician:        input.technician        ?? null,
      spareParts:        input.spareParts        ?? null,
      cost:              input.cost              ? parseFloat(String(input.cost)) : null,
      status:            input.status            || 'PENDIENTE',
      notes:             input.notes             ?? null,
      cause:             input.cause             ?? null,
      rootCause:         input.rootCause         ?? null,
      failureMode:       input.failureMode       ?? null,
      actionTaken:       input.actionTaken       ?? null,
      downtimeHours:     input.downtimeHours     ? parseFloat(String(input.downtimeHours)) : null,
      equipmentAffected: input.equipmentAffected ?? null,
    },
    include: { vessel: { select: { name: true, fleetType: true } } },
  })
}

export async function updateOrder(id: string, input: UpdateOrderInput) {
  return prisma.maintenanceOrder.update({
    where: { id },
    data: {
      type:              input.type,
      description:       input.description,
      priority:          input.priority,
      system:            input.system,
      dueDate:           input.dueDate       ? new Date(input.dueDate)       : undefined,
      completedAt:       input.completedAt   ? new Date(input.completedAt)   : undefined,
      technician:        input.technician,
      spareParts:        input.spareParts,
      cost:              input.cost          ? parseFloat(String(input.cost)) : null,
      status:            input.status,
      notes:             input.notes,
      cause:             input.cause         ?? undefined,
      rootCause:         input.rootCause     ?? undefined,
      failureMode:       input.failureMode   ?? undefined,
      actionTaken:       input.actionTaken   ?? undefined,
      downtimeHours:     input.downtimeHours != null ? parseFloat(String(input.downtimeHours)) : undefined,
      equipmentAffected: input.equipmentAffected ?? undefined,
    },
  })
}

export async function deleteOrder(id: string) {
  return prisma.maintenanceOrder.delete({ where: { id } })
}
