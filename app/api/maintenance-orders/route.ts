import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest, getFleetFilter, canAccessVessel, WRITE_ROLES } from '@/lib/auth-middleware'
import { emitEvent } from '@/lib/events'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId    = searchParams.get('vesselId')
  const status      = searchParams.get('status')
  const type        = searchParams.get('type')
  const fleetFilter = getFleetFilter(req.user!.role)

  const orders = await prisma.maintenanceOrder.findMany({
    where: {
      ...(vesselId ? { vesselId } : {}),
      ...(status   ? { status }   : {}),
      ...(type     ? { type }     : {}),
      ...(fleetFilter ? { vessel: { fleetType: fleetFilter } } : {}),
    },
    include: { vessel: { select: { id: true, name: true, fleetType: true } } },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })
  return NextResponse.json(orders)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()

  if (!(await canAccessVessel(body.vesselId, req.user!.role))) {
    return NextResponse.json({ error: 'No tienes acceso a esta embarcación' }, { status: 403 })
  }

  const order = await prisma.maintenanceOrder.create({
    data: {
      vesselId:          body.vesselId,
      type:              body.type,
      description:       body.description,
      priority:          body.priority          || 'MEDIA',
      system:            body.system,
      dueDate:           new Date(body.dueDate),
      technician:        body.technician        || null,
      spareParts:        body.spareParts        || null,
      cost:              body.cost              ? parseFloat(body.cost)         : null,
      status:            body.status            || 'PENDIENTE',
      notes:             body.notes             || null,
      cause:             body.cause             || null,
      rootCause:         body.rootCause         || null,
      failureMode:       body.failureMode       || null,
      actionTaken:       body.actionTaken       || null,
      downtimeHours:     body.downtimeHours     ? parseFloat(body.downtimeHours) : null,
      equipmentAffected: body.equipmentAffected || null,
    },
    include: { vessel: { select: { name: true, fleetType: true } } },
  })

  emitEvent({
    type:       'maintenance_created',
    fleetType:  order.vessel.fleetType as 'PESADA' | 'LIVIANA',
    vesselId:   order.vesselId,
    vesselName: order.vessel.name,
    userId:     req.user!.id,
    userEmail:  req.user!.email,
    payload: {
      orderId:     order.id,
      description: order.description,
      priority:    order.priority,
      status:      order.status,
    },
  })

  return NextResponse.json(order, { status: 201 })
}, WRITE_ROLES)
