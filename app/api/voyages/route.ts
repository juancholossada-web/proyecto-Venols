import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const voyages = await prisma.voyage.findMany({
    where: status ? { status: status as any } : {},
    include: { vessel: { select: { id: true, name: true, fleetType: true } }, client: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(voyages)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const voyage = await prisma.voyage.create({
    data: {
      vesselId: body.vesselId, voyageNumber: body.voyageNumber, origin: body.origin,
      destination: body.destination, status: body.status || 'PLANIFICADO',
      departureAt: body.departureAt ? new Date(body.departureAt) : null,
      arrivalAt: body.arrivalAt ? new Date(body.arrivalAt) : null,
      cargoType: body.cargoType || null, cargoTons: body.cargoTons ? parseFloat(body.cargoTons) : null,
      charterParty: body.charterParty || null, clientId: body.clientId || null, notes: body.notes || null,
    },
  })
  return NextResponse.json(voyage, { status: 201 })
}, ['ADMIN', 'OPERATOR'])
