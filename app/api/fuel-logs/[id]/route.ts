import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const log = await prisma.fuelLog.update({ where: { id: params.id }, data: body })
  return NextResponse.json(log)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.fuelLog.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
