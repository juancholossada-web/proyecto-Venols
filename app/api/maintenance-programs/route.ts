import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const { searchParams } = new URL(req.url)
  const vesselId = searchParams.get('vesselId')
  const status = searchParams.get('status')
  const programs = await prisma.maintenanceProgram.findMany({
    where: { ...(vesselId ? { vesselId } : {}), ...(status ? { status } : {}) },
    include: { vessel: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(programs)
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const program = await prisma.maintenanceProgram.create({
    data: {
      vesselId: body.vesselId, name: body.name, description: body.description || null,
      system: body.system || null, frequency: body.frequency || null,
      frequencyHours: body.frequencyHours ? parseInt(body.frequencyHours) : null,
      lastExecuted: body.lastExecuted ? new Date(body.lastExecuted) : null,
      nextDue: body.nextDue ? new Date(body.nextDue) : null,
      tasks: body.tasks || null, materials: body.materials || null,
      status: body.status || 'ACTIVO', notes: body.notes || null,
    },
  })
  return NextResponse.json(program, { status: 201 })
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])
