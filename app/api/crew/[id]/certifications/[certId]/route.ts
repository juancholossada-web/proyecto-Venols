import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string; certId: string } }) => {
  const body = await req.json()
  const cert = await prisma.certification.update({
    where: { id: params.certId },
    data: {
      type: body.type,
      name: body.name,
      number: body.number,
      issuedBy: body.issuedBy,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      fileUrl: body.fileUrl,
      notes: body.notes,
    },
  })
  return NextResponse.json(cert)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string; certId: string } }) => {
  await prisma.certification.delete({ where: { id: params.certId } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
