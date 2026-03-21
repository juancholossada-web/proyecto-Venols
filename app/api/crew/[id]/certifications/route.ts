import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const certs = await prisma.certification.findMany({
    where: { employeeId: params.id },
    orderBy: { expiresAt: 'asc' },
  })
  return NextResponse.json(certs)
})

export const POST = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const cert = await prisma.certification.create({
    data: {
      employeeId: params.id,
      type: body.type,
      name: body.name,
      number: body.number || null,
      issuedBy: body.issuedBy,
      issuedAt: new Date(body.issuedAt),
      expiresAt: new Date(body.expiresAt),
      fileUrl: body.fileUrl || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(cert, { status: 201 })
}, ['ADMIN', 'OPERATOR'])
