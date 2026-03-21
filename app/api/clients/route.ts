import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async () => {
  const clients = await prisma.client.findMany({
    include: { _count: { select: { voyages: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(clients)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const client = await prisma.client.create({
    data: {
      name: body.name, taxId: body.taxId, type: body.type || 'EMPRESA',
      country: body.country || 'Venezuela', address: body.address || null,
      phone: body.phone || null, email: body.email || null,
      contact: body.contact || null, notes: body.notes || null,
    },
  })
  return NextResponse.json(client, { status: 201 })
}, ['ADMIN', 'OPERATOR'])
