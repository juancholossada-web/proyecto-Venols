import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const order = await prisma.maintenanceOrder.update({
    where: { id: params.id },
    data: {
      type: body.type, description: body.description, priority: body.priority,
      system: body.system, dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
      technician: body.technician, spareParts: body.spareParts,
      cost: body.cost ? parseFloat(body.cost) : null, status: body.status, notes: body.notes,
      cause: body.cause ?? undefined, rootCause: body.rootCause ?? undefined,
      failureMode: body.failureMode ?? undefined, actionTaken: body.actionTaken ?? undefined,
      downtimeHours: body.downtimeHours != null ? parseFloat(body.downtimeHours) : undefined,
      equipmentAffected: body.equipmentAffected ?? undefined,
    },
  })
  return NextResponse.json(order)
}, ['ADMIN', 'OPERATOR', 'TECHNICIAN'])

export const DELETE = withAuth(async (_req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.maintenanceOrder.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}, ['ADMIN'])
