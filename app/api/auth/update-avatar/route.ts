import { NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  const { avatar } = await req.json()
  if (!avatar) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatar },
  })

  return NextResponse.json({ ok: true })
})
