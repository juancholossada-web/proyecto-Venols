import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/bcrypt'
import { signToken, hashToken } from '@/lib/jwt'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = LoginSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 400 })
    }

    const { email, password } = validation.data
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Cuenta bloqueada. Intenta en ${minutesLeft} minutos` },
        { status: 423 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      const attempts = user.loginAttempts + 1
      const updateData: Record<string, unknown> = { loginAttempts: attempts }

      if (attempts >= MAX_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000)
        updateData.loginAttempts = 0
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData })
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          metadata: { attempts },
          ipAddress: req.headers.get('x-forwarded-for') || '',
        },
      })

      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Cuenta inactiva o suspendida' }, { status: 403 })
    }

    const { accessToken } = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      })

      const sessionId = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
      const token = signToken({ sub: user.id, email: user.email, role: user.role, sessionId })

      await tx.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          tokenHash: hashToken(token),
          ipAddress: req.headers.get('x-forwarded-for') || '',
          userAgent: req.headers.get('user-agent') || '',
          expiresAt,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          entity: 'User',
          entityId: user.id,
          ipAddress: req.headers.get('x-forwarded-for') || '',
        },
      })

      return { accessToken: token }
    })

    return NextResponse.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
    })
  } catch (error) {
    console.error('[LOGIN ERROR]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
