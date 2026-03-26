import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest, canAccessVessel, WRITE_ROLES } from '@/lib/auth-middleware'
import { listMovements, createMovement, getItemWithVessel } from '@/lib/services/inventory.service'
import { emitEvent } from '@/lib/events'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const movements = await listMovements(params.id)
  return NextResponse.json(movements)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()

  const item = await getItemWithVessel(params.id)
  if (!item) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })

  if (!(await canAccessVessel(item.vesselId, req.user!.role))) {
    return NextResponse.json({ error: 'No tienes acceso a esta embarcación' }, { status: 403 })
  }

  try {
    const result = await createMovement(params.id, body)
    if (!result) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })

    emitEvent({
      type:       'inventory_movement',
      fleetType:  result.item.vessel.fleetType as 'PESADA' | 'LIVIANA',
      vesselId:   result.item.vesselId,
      vesselName: result.item.vessel.name,
      userId:     req.user!.id,
      userEmail:  req.user!.email,
      payload: {
        item:         result.item.name,
        movementType: body.type,
        quantity:     parseInt(String(body.quantity)),
        newStock:     result.newQuantity,
      },
    })

    return NextResponse.json(result.movement, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: 'Cantidad insuficiente en inventario' }, { status: 400 })
    }
    throw err
  }
}, WRITE_ROLES)
