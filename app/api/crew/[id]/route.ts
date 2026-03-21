import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      certifications: { orderBy: { expiresAt: 'asc' } },
      assignments: {
        include: { vessel: { select: { id: true, name: true, fleetType: true, vesselType: true } } },
        orderBy: { startDate: 'desc' },
      },
    },
  })
  if (!employee) return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
  return NextResponse.json(employee)
})

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const employee = await prisma.employee.update({
    where: { id: params.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      nationalId: body.nationalId,
      nationality: body.nationality,
      position: body.position,
      seafarerBook: body.seafarerBook,
      passportNumber: body.passportNumber,
      passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
      phone: body.phone,
      email: body.email,
      address: body.address,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      status: body.status,
      notes: body.notes,
    },
  })
  return NextResponse.json(employee)
}, ['ADMIN', 'OPERATOR'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.employee.update({ where: { id: params.id }, data: { status: 'RETIRADO' } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
