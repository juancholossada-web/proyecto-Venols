import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId = searchParams.get('vesselId')
  const items = await prisma.inventoryItem.findMany({
    where: vesselId ? { vesselId } : {},
    include: { vessel: { select: { id: true, name: true } } },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(items)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const item = await prisma.inventoryItem.create({
    data: {
      vesselId: body.vesselId, name: body.name, category: body.category,
      quantity: parseInt(body.quantity) || 0, unit: body.unit || 'unidad',
      minStock: parseInt(body.minStock) || 0, location: body.location || null,
      supplier: body.supplier || null, notes: body.notes || null,
    },
  })
  return NextResponse.json(item, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
