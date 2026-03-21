import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const doc = await prisma.complianceDocument.update({
    where: { id: params.id },
    data: {
      type: body.type, name: body.name, documentNumber: body.documentNumber,
      issuedBy: body.issuedBy, issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      fileUrl: body.fileUrl, status: body.status, notes: body.notes,
    },
  })
  return NextResponse.json(doc)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.complianceDocument.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
