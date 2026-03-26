import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, getFleetFilter, canAccessVessel, WRITE_ROLES } from '@/lib/auth-middleware'
import { listOrders, createOrder } from '@/lib/services/maintenance.service'
import { emitEvent } from '@/lib/events'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const orders = await listOrders({
    vesselId:    searchParams.get('vesselId'),
    status:      searchParams.get('status'),
    type:        searchParams.get('type'),
    fleetFilter: getFleetFilter(req.user!.role),
  })
  return NextResponse.json(orders)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()

  if (!(await canAccessVessel(body.vesselId, req.user!.role))) {
    return NextResponse.json({ error: 'No tienes acceso a esta embarcación' }, { status: 403 })
  }

  const order = await createOrder(body)

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
