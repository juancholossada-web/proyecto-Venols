import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId = searchParams.get('vesselId')
  const logs = await prisma.fuelLog.findMany({
    where: vesselId ? { vesselId } : {},
    include: { vessel: { select: { id: true, name: true } }, voyage: { select: { id: true, voyageNumber: true } } },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(logs)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const log = await prisma.fuelLog.create({
    data: {
      vesselId: body.vesselId, voyageId: body.voyageId || null, date: new Date(body.date),
      fuelType: body.fuelType || 'MGO', operationAt: body.operationAt,
      bunkerReceived: body.bunkerReceived ? parseFloat(body.bunkerReceived) : null,
      consumed: body.consumed ? parseFloat(body.consumed) : null,
      rob: parseFloat(body.rob), price: body.price ? parseFloat(body.price) : null,
      supplier: body.supplier || null, bdn: body.bdn || null, reportedBy: body.reportedBy || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(log, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
