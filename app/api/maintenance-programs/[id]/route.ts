import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const program = await prisma.maintenanceProgram.update({
    where: { id: params.id },
    data: {
      vesselId: body.vesselId ?? undefined, name: body.name ?? undefined,
      description: body.description ?? undefined, system: body.system ?? undefined,
      frequency: body.frequency ?? undefined,
      frequencyHours: body.frequencyHours != null ? parseInt(body.frequencyHours) : undefined,
      lastExecuted: body.lastExecuted ? new Date(body.lastExecuted) : undefined,
      nextDue: body.nextDue ? new Date(body.nextDue) : undefined,
      tasks: body.tasks ?? undefined, materials: body.materials ?? undefined,
      status: body.status ?? undefined, notes: body.notes ?? undefined,
    },
  })
  return NextResponse.json(program)
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.maintenanceProgram.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
