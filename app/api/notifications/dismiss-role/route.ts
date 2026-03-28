import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  await prisma.user.update({
    where: { id: req.user!.sub },
    data: { roleAssignedAt: null },
  })
  return NextResponse.json({ ok: true })
})
