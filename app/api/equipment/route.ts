import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId = searchParams.get('vesselId')
  const equipment = await prisma.equipment.findMany({
    where: vesselId ? { vesselId } : {},
    include: { vessel: { select: { id: true, name: true } } },
    orderBy: [{ vessel: { name: 'asc' } }, { name: 'asc' }],
  })
  return NextResponse.json(equipment)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const equipment = await prisma.equipment.create({
    data: {
      vesselId: body.vesselId, name: body.name, type: body.type,
      brand: body.brand || null, model: body.model || null,
      serialNumber: body.serialNumber || null,
      currentHours: body.currentHours ? parseFloat(body.currentHours) : 0,
      lastServiceAt: body.lastServiceAt ? parseFloat(body.lastServiceAt) : null,
      serviceInterval: body.serviceInterval ? parseFloat(body.serviceInterval) : null,
      status: body.status || 'OPERATIVO', notes: body.notes || null,
    },
  })
  return NextResponse.json(equipment, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
