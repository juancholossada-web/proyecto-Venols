import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { voyages: { include: { vessel: { select: { name: true } } }, orderBy: { createdAt: 'desc' } } },
  })
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  return NextResponse.json(client)
})

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const client = await prisma.client.update({ where: { id: params.id }, data: body })
  return NextResponse.json(client)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.client.update({ where: { id: params.id }, data: { status: 'INACTIVO' } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
