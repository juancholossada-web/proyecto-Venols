import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const report = await prisma.dailyReport.update({
    where: { id: params.id },
    data: {
      vesselId: body.vesselId ?? undefined, date: body.date ? new Date(body.date) : undefined,
      client: body.client ?? undefined, activity: body.activity ?? undefined,
      location: body.location ?? undefined, captain: body.captain ?? undefined,
      marineOnDuty: body.marineOnDuty ?? undefined, personnel: body.personnel ?? undefined,
      fuelLevelLiters: body.fuelLevelLiters != null ? parseFloat(body.fuelLevelLiters) : undefined,
      fuelPercentage: body.fuelPercentage != null ? parseFloat(body.fuelPercentage) : undefined,
      vesselStatus: body.vesselStatus ?? undefined, notes: body.notes ?? undefined,
      createdBy: body.createdBy ?? undefined,
    },
  })
  return NextResponse.json(report)
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.dailyReport.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
