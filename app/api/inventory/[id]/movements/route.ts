import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const movements = await prisma.inventoryMovement.findMany({
    where: { inventoryItemId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(movements)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const quantity = parseInt(body.quantity)
  const item = await prisma.inventoryItem.findUnique({ where: { id: params.id } })
  if (!item) {
    return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
  }
  if (body.type === 'SALIDA' && item.quantity < quantity) {
    return NextResponse.json({ error: 'Cantidad insuficiente en inventario' }, { status: 400 })
  }
  const newQuantity = body.type === 'ENTRADA' ? item.quantity + quantity : item.quantity - quantity
  const movement = await prisma.inventoryMovement.create({
    data: {
      inventoryItemId: params.id,
      type: body.type,
      quantity,
      reason: body.reason || null,
      reference: body.reference || null,
      executedBy: body.executedBy || null,
      date: body.date ? new Date(body.date) : new Date(),
      notes: body.notes || null,
    },
  })
  await prisma.inventoryItem.update({
    where: { id: params.id },
    data: { quantity: newQuantity },
  })
  return NextResponse.json(movement, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
