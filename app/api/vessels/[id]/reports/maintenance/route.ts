import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const reports = await prisma.maintenanceReport.findMany({
    where: { vesselId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(reports)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const report = await prisma.maintenanceReport.create({
    data: {
      vesselId: params.id,
      date: new Date(body.date),
      type: body.type,
      description: body.description,
      technician: body.technician || null,
      partsReplaced: body.partsReplaced || null,
      cost: body.cost ? parseFloat(body.cost) : null,
      status: body.status || 'PENDIENTE',
      nextScheduled: body.nextScheduled ? new Date(body.nextScheduled) : null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(report, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
