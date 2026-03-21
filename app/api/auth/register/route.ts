import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/lib/bcrypt'
import { signToken, hashToken } from '@/lib/jwt'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Contraseña muy corta'),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'OPERATOR', 'TECHNICIAN']).optional().default('OPERATOR'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = RegisterSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName, phone, role } = validation.data

    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'Contraseña débil', details: passwordCheck.errors },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'No se pudo crear la cuenta' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    const { user, accessToken } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, password: hashedPassword, firstName, lastName, phone, role },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
      })

      const sessionId = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
      const token = signToken({ sub: newUser.id, email: newUser.email, role: newUser.role, sessionId })

      await tx.session.create({
        data: {
          id: sessionId,
          userId: newUser.id,
          tokenHash: hashToken(token),
          ipAddress: req.headers.get('x-forwarded-for') || '',
          userAgent: req.headers.get('user-agent') || '',
          expiresAt,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_REGISTERED',
          entity: 'User',
          entityId: newUser.id,
          ipAddress: req.headers.get('x-forwarded-for') || '',
        },
      })

      return { user: newUser, accessToken: token }
    })

    return NextResponse.json(
      { message: 'Usuario registrado exitosamente', user, accessToken },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
