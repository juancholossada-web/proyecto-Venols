import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const logs = await prisma.equipmentHourLog.findMany({
    where: { equipmentId: params.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(logs)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const log = await prisma.equipmentHourLog.create({
    data: {
      equipmentId: params.id,
      date: new Date(body.date),
      hoursReading: parseFloat(body.hoursReading),
      hoursRun: body.hoursRun ? parseFloat(body.hoursRun) : null,
      reportedBy: body.reportedBy || null,
      notes: body.notes || null,
    },
  })
  await prisma.equipment.update({
    where: { id: params.id },
    data: { currentHours: parseFloat(body.hoursReading) },
  })
  return NextResponse.json(log, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
