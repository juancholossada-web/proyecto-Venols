import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

const VALID_ROLES = ['STANDARD', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT', 'ADMIN']

export const PATCH = withAuth(async (req: AuthenticatedRequest, context: any) => {
  if (req.user!.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores pueden asignar roles' }, { status: 403 })
  }

  const { id } = await context.params
  const { role } = await req.json()

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role, pendingRoleApproval: false, roleAssignedAt: new Date() },
    select: { id: true, firstName: true, lastName: true, role: true },
  })

  return NextResponse.json({ ok: true, user })
})
