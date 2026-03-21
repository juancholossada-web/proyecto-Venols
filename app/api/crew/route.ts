import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const position = searchParams.get('position')

  const employees = await prisma.employee.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(position ? { position: { contains: position, mode: 'insensitive' as const } } : {}),
    },
    include: {
      certifications: { orderBy: { expiresAt: 'asc' } },
      assignments: {
        where: { status: 'ACTIVO' },
        include: { vessel: { select: { id: true, name: true, fleetType: true } } },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })
  return NextResponse.json(employees)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const employee = await prisma.employee.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      nationalId: body.nationalId,
      nationality: body.nationality || 'Venezolana',
      position: body.position,
      seafarerBook: body.seafarerBook || null,
      passportNumber: body.passportNumber || null,
      passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(employee, { status: 201 })
}, ['ADMIN', 'OPERATOR'])
