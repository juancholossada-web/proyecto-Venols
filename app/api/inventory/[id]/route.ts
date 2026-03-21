import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: {
      name: body.name, category: body.category,
      quantity: body.quantity != null ? parseInt(body.quantity) : undefined,
      unit: body.unit, minStock: body.minStock != null ? parseInt(body.minStock) : undefined,
      location: body.location, supplier: body.supplier, notes: body.notes,
    },
  })
  return NextResponse.json(item)
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.inventoryItem.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
