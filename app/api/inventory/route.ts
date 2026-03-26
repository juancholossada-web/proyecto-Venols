import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, getFleetFilter, canAccessVessel, WRITE_ROLES } from '@/lib/auth-middleware'
import { listItems, findItemByName, createItem } from '@/lib/services/inventory.service'
import { emitEvent } from '@/lib/events'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const items = await listItems(
    searchParams.get('vesselId'),
    getFleetFilter(req.user!.role),
  )
  return NextResponse.json(items)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()

  if (!(await canAccessVessel(body.vesselId, req.user!.role))) {
    return NextResponse.json({ error: 'No tienes acceso a esta embarcación' }, { status: 403 })
  }

  const existing = await findItemByName(body.vesselId, body.name)
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un producto con ese nombre en esta embarcación' }, { status: 409 })
  }

  const item = await createItem(body)

  emitEvent({
    type:       'inventory_updated',
    fleetType:  item.vessel.fleetType as 'PESADA' | 'LIVIANA',
    vesselId:   item.vesselId,
    vesselName: item.vessel.name,
    userId:     req.user!.id,
    userEmail:  req.user!.email,
    payload:    { action: 'created', item: item.name, quantity: item.quantity },
  })

  return NextResponse.json(item, { status: 201 })
}, WRITE_ROLES)
