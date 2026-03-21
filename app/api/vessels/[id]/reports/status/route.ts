import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const reports = await prisma.statusReport.findMany({
    where: { vesselId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(reports)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const report = await prisma.statusReport.create({
    data: {
      vesselId: params.id,
      date: new Date(body.date),
      location: body.location,
      activity: body.activity,
      fuelLevel: body.fuelLevel ? parseFloat(body.fuelLevel) : null,
      client: body.client || null,
      captain: body.captain,
      marineOnDuty: body.marineOnDuty,
      vesselStatus: body.vesselStatus,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(report, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
