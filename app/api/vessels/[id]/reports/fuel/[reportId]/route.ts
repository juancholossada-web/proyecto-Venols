import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string; reportId: string } }) => {
  const report = await prisma.fuelReport.findFirst({ where: { id: params.reportId, vesselId: params.id } })
  if (!report) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
  return NextResponse.json(report)
})

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string; reportId: string } }) => {
  const body = await req.json()
  const report = await prisma.fuelReport.update({
    where: { id: params.reportId },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      fuelLevel: body.fuelLevel ? parseFloat(body.fuelLevel) : undefined,
      fuelUnit: body.fuelUnit,
      consumption: body.consumption ? parseFloat(body.consumption) : null,
      location: body.location,
      operator: body.operator,
      notes: body.notes,
    },
  })
  return NextResponse.json(report)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string; reportId: string } }) => {
  await prisma.fuelReport.delete({ where: { id: params.reportId } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
