import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const vessel = await prisma.vessel.findUnique({ where: { id: params.id } })
  if (!vessel) return NextResponse.json({ error: 'Embarcación no encontrada' }, { status: 404 })
  return NextResponse.json(vessel)
})

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const vessel = await prisma.vessel.update({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json(vessel)
}, ['ADMIN', 'OPERATOR'])
