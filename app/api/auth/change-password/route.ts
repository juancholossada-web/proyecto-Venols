import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/bcrypt'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'
import { z } from 'zod'

const Schema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 })

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'La nueva contraseña debe ser diferente a la actual' }, { status: 400 })
  }

  const newHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

  return NextResponse.json({ ok: true })
})
