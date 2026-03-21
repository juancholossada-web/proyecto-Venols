import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string; assignId: string } }) => {
  const body = await req.json()
  const assignment = await prisma.assignment.update({
    where: { id: params.assignId },
    data: {
      vesselId: body.vesselId,
      role: body.role,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : null,
      status: body.status,
      notes: body.notes,
    },
  })
  return NextResponse.json(assignment)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string; assignId: string } }) => {
  await prisma.assignment.update({ where: { id: params.assignId }, data: { status: 'CANCELADO' } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
