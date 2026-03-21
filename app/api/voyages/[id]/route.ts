import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const voyage = await prisma.voyage.findUnique({
    where: { id: params.id },
    include: { vessel: true, client: true, fuelLogs: { orderBy: { date: 'desc' } }, cargoOps: true },
  })
  if (!voyage) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
  return NextResponse.json(voyage)
})

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const voyage = await prisma.voyage.update({
    where: { id: params.id },
    data: {
      origin: body.origin, destination: body.destination, status: body.status,
      departureAt: body.departureAt ? new Date(body.departureAt) : undefined,
      arrivalAt: body.arrivalAt ? new Date(body.arrivalAt) : undefined,
      cargoType: body.cargoType, cargoTons: body.cargoTons ? parseFloat(body.cargoTons) : null,
      clientId: body.clientId, notes: body.notes,
    },
  })
  return NextResponse.json(voyage)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.voyage.update({ where: { id: params.id }, data: { status: 'CANCELADO' } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
