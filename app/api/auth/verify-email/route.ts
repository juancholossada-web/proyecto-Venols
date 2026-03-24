import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOTP } from '@/lib/otp'
import { signToken, hashToken } from '@/lib/jwt'
import { z } from 'zod'

const MAX_OTP_ATTEMPTS = 5

const VerifySchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  code: z.string().length(6, 'El código debe tener 6 dígitos').regex(/^\d{6}$/, 'Solo dígitos'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = VerifySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { email, code } = validation.data

    // 1. Buscar el registro pendiente
    const pending = await prisma.pendingRegistration.findUnique({ where: { email } })

    if (!pending) {
      return NextResponse.json(
        { error: 'No hay un registro pendiente para este correo. Solicita un nuevo código.' },
        { status: 404 }
      )
    }

    // 2. Verificar expiración
    if (pending.expiresAt < new Date()) {
      await prisma.pendingRegistration.delete({ where: { email } })
      return NextResponse.json(
        { error: 'El código expiró. Inicia el registro nuevamente.' },
        { status: 410 }
      )
    }

    // 3. Verificar intentos máximos
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.pendingRegistration.delete({ where: { email } })
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Solicita un nuevo código.' },
        { status: 429 }
      )
    }

    // 4. Verificar el OTP
    const isValid = verifyOTP(code, pending.otpHash)

    if (!isValid) {
      // Incrementar contador de intentos fallidos
      await prisma.pendingRegistration.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      })

      const remaining = MAX_OTP_ATTEMPTS - (pending.attempts + 1)
      return NextResponse.json(
        {
          error: 'Código incorrecto',
          attemptsRemaining: remaining,
        },
        { status: 400 }
      )
    }

    // 5. OTP correcto → crear usuario y sesión en una transacción
    const { user, accessToken } = await prisma.$transaction(async (tx) => {
      // Crear el usuario real
      const newUser = await tx.user.create({
        data: {
          email: pending.email,
          password: pending.hashedPassword,
          firstName: pending.firstName,
          lastName: pending.lastName,
          phone: pending.phone,
          role: pending.role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      })

      // Crear sesión automática
      const sessionId = crypto.randomUUID()
      const sessionExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
      const token = signToken({
        sub: newUser.id,
        email: newUser.email,
        role: newUser.role,
        sessionId,
      })

      await tx.session.create({
        data: {
          id: sessionId,
          userId: newUser.id,
          tokenHash: hashToken(token),
          ipAddress: req.headers.get('x-forwarded-for') || '',
          userAgent: req.headers.get('user-agent') || '',
          expiresAt: sessionExpiresAt,
        },
      })

      // Registrar en auditoría
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_REGISTERED',
          entity: 'User',
          entityId: newUser.id,
          ipAddress: req.headers.get('x-forwarded-for') || '',
          metadata: { method: 'email_otp' },
        },
      })

      // Eliminar el registro pendiente
      await tx.pendingRegistration.delete({ where: { email } })

      return { user: newUser, accessToken: token }
    })

    return NextResponse.json(
      {
        message: 'Cuenta verificada y creada exitosamente',
        user,
        accessToken,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[VERIFY EMAIL ERROR]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
