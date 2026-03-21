import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, hashToken } from '@/lib/jwt'

async function handler(req: AuthenticatedRequest) {
  const token = getTokenFromHeader(req.headers.get('authorization'))!

  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token) },
    data: { revokedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: req.user!.id,
    },
  })

  return NextResponse.json({ message: 'Sesión cerrada exitosamente' })
}

export const POST = withAuth(handler)
