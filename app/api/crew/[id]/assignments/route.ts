import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const assignments = await prisma.assignment.findMany({
    where: { employeeId: params.id },
    include: { vessel: { select: { id: true, name: true, fleetType: true, vesselType: true } } },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json(assignments)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const assignment = await prisma.assignment.create({
    data: {
      employeeId: params.id,
      vesselId: body.vesselId,
      role: body.role,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      status: body.status || 'ACTIVO',
      notes: body.notes || null,
    },
  })
  return NextResponse.json(assignment, { status: 201 })
}, ['ADMIN', 'OPERATOR'])
