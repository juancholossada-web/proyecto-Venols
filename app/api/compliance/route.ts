import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId = searchParams.get('vesselId')
  const docs = await prisma.complianceDocument.findMany({
    where: vesselId ? { vesselId } : {},
    include: { vessel: { select: { id: true, name: true } } },
    orderBy: { expiresAt: 'asc' },
  })
  return NextResponse.json(docs)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const doc = await prisma.complianceDocument.create({
    data: {
      vesselId: body.vesselId || null, employeeId: body.employeeId || null,
      type: body.type, name: body.name, documentNumber: body.documentNumber || null,
      issuedBy: body.issuedBy, issuedAt: new Date(body.issuedAt), expiresAt: new Date(body.expiresAt),
      fileUrl: body.fileUrl || null, notes: body.notes || null,
    },
  })
  return NextResponse.json(doc, { status: 201 })
}, ['ADMIN', 'OPERATOR'])
