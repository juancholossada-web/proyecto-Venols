import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const equipment = await prisma.equipment.update({
    where: { id: params.id },
    data: {
      vesselId: body.vesselId ?? undefined, name: body.name ?? undefined,
      type: body.type ?? undefined, brand: body.brand ?? undefined,
      model: body.model ?? undefined, serialNumber: body.serialNumber ?? undefined,
      currentHours: body.currentHours != null ? parseFloat(body.currentHours) : undefined,
      lastServiceAt: body.lastServiceAt != null ? parseFloat(body.lastServiceAt) : undefined,
      serviceInterval: body.serviceInterval != null ? parseFloat(body.serviceInterval) : undefined,
      status: body.status ?? undefined, notes: body.notes ?? undefined,
    },
  })
  return NextResponse.json(equipment)
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.equipment.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
