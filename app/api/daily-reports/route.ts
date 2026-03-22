import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId = searchParams.get('vesselId')
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const where: any = {}
  if (vesselId) where.vesselId = vesselId
  if (date) {
    const d = new Date(date)
    where.date = { gte: d, lt: new Date(d.getTime() + 86400000) }
  } else if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }
  const reports = await prisma.dailyReport.findMany({
    where,
    include: { vessel: { select: { id: true, name: true, fleetType: true, tankCapacityLiters: true } } },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(reports)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const report = await prisma.dailyReport.create({
    data: {
      vesselId: body.vesselId, date: new Date(body.date),
      client: body.client || null, activity: body.activity || null,
      location: body.location || null, captain: body.captain || null,
      marineOnDuty: body.marineOnDuty || null, personnel: body.personnel || null,
      fuelLevelLiters: body.fuelLevelLiters ? parseFloat(body.fuelLevelLiters) : null,
      fuelPercentage: body.fuelPercentage ? parseFloat(body.fuelPercentage) : null,
      vesselStatus: body.vesselStatus || null, notes: body.notes || null,
      createdBy: body.createdBy || null,
    },
  })
  return NextResponse.json(report, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
