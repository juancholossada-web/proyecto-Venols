import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const reports = await prisma.fuelReport.findMany({
    where: { vesselId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(reports)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const report = await prisma.fuelReport.create({
    data: {
      vesselId: params.id,
      date: new Date(body.date),
      fuelLevel: parseFloat(body.fuelLevel),
      fuelUnit: body.fuelUnit || 'litros',
      consumption: body.consumption ? parseFloat(body.consumption) : null,
      location: body.location || null,
      operator: body.operator || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(report, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
