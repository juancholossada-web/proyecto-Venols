import { prisma } from '@/lib/prisma'
import { FleetType } from '@prisma/client'

export interface CreateItemInput {
  vesselId: string
  name: string
  category: string
  quantity: string | number
  unit?: string
  minStock?: string | number
  location?: string | null
  supplier?: string | null
  notes?: string | null
}

export interface UpdateItemInput {
  name?: string
  category?: string
  quantity?: string | number | null
  unit?: string
  minStock?: string | number | null
  location?: string
  supplier?: string
  notes?: string
}

export interface CreateMovementInput {
  type: 'ENTRADA' | 'SALIDA'
  quantity: string | number
  reason?: string | null
  reference?: string | null
  executedBy?: string | null
  date?: string | null
  notes?: string | null
}

export async function listItems(vesselId: string | null, fleetFilter: FleetType | null) {
  return prisma.inventoryItem.findMany({
    where: {
      ...(vesselId ? { vesselId } : {}),
      ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
    },
    include: { vessel: { select: { id: true, name: true, fleetType: true } } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
}

export async function findItemByName(vesselId: string, name: string) {
  return prisma.inventoryItem.findUnique({
    where: { vesselId_name: { vesselId, name } },
  })
}

export async function createItem(input: CreateItemInput) {
  return prisma.inventoryItem.create({
    data: {
      vesselId:  input.vesselId,
      name:      input.name,
      category:  input.category,
      quantity:  parseInt(String(input.quantity)) || 0,
      unit:      input.unit || 'unidad',
      minStock:  parseInt(String(input.minStock ?? 0)) || 0,
      location:  input.location ?? null,
      supplier:  input.supplier ?? null,
      notes:     input.notes ?? null,
    },
    include: { vessel: { select: { name: true, fleetType: true } } },
  })
}

export async function updateItem(id: string, input: UpdateItemInput) {
  return prisma.inventoryItem.update({
    where: { id },
    data: {
      name:      input.name,
      category:  input.category,
      quantity:  input.quantity != null ? parseInt(String(input.quantity)) : undefined,
      unit:      input.unit,
      minStock:  input.minStock != null ? parseInt(String(input.minStock)) : undefined,
      location:  input.location,
      supplier:  input.supplier,
      notes:     input.notes,
    },
  })
}

export async function deleteItem(id: string) {
  return prisma.inventoryItem.delete({ where: { id } })
}

export async function listMovements(inventoryItemId: string) {
  return prisma.inventoryMovement.findMany({
    where: { inventoryItemId },
    orderBy: { date: 'desc' },
  })
}

export async function getItemWithVessel(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: { vessel: { select: { name: true, fleetType: true } } },
  })
}

export async function createMovement(itemId: string, input: CreateMovementInput) {
  const item = await getItemWithVessel(itemId)
  if (!item) return null

  const quantity = parseInt(String(input.quantity))

  if (input.type === 'SALIDA' && item.quantity < quantity) {
    throw new Error('INSUFFICIENT_STOCK')
  }

  const newQuantity = input.type === 'ENTRADA'
    ? item.quantity + quantity
    : item.quantity - quantity

  const movement = await prisma.inventoryMovement.create({
    data: {
      inventoryItemId: itemId,
      type:       input.type,
      quantity,
      reason:     input.reason ?? null,
      reference:  input.reference ?? null,
      executedBy: input.executedBy ?? null,
      date:       input.date ? new Date(input.date) : new Date(),
      notes:      input.notes ?? null,
    },
  })
  await prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQuantity } })

  return { movement, item, newQuantity }
}
