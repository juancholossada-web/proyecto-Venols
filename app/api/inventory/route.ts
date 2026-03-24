import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest, getFleetFilter, canAccessVessel, WRITE_ROLES } from '@/lib/auth-middleware'
import { emitEvent } from '@/lib/events'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId   = searchParams.get('vesselId')
  const fleetFilter = getFleetFilter(req.user!.role)

  const items = await prisma.inventoryItem.findMany({
    where: {
      ...(vesselId ? { vesselId } : {}),
      // Si el rol tiene restricción de flota, filtrar por embarcaciones de esa flota
      ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
    },
    include: { vessel: { select: { id: true, name: true, fleetType: true } } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(items)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()

  // Verificar acceso a la embarcación
  if (!(await canAccessVessel(body.vesselId, req.user!.role))) {
    return NextResponse.json({ error: 'No tienes acceso a esta embarcación' }, { status: 403 })
  }

  const existing = await prisma.inventoryItem.findUnique({
    where: { vesselId_name: { vesselId: body.vesselId, name: body.name } },
  })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un producto con ese nombre en esta embarcación' }, { status: 409 })
  }

  const item = await prisma.inventoryItem.create({
    data: {
      vesselId: body.vesselId, name: body.name, category: body.category,
      quantity: parseInt(body.quantity) || 0, unit: body.unit || 'unidad',
      minStock: parseInt(body.minStock) || 0, location: body.location || null,
      supplier: body.supplier || null, notes: body.notes || null,
    },
    include: { vessel: { select: { name: true, fleetType: true } } },
  })

  emitEvent({
    type: 'inventory_updated',
    fleetType: item.vessel.fleetType as 'PESADA' | 'LIVIANA',
    vesselId:   item.vesselId,
    vesselName: item.vessel.name,
    userId:     req.user!.id,
    userEmail:  req.user!.email,
    payload:    { action: 'created', item: item.name, quantity: item.quantity },
  })

  return NextResponse.json(item, { status: 201 })
}, WRITE_ROLES)
