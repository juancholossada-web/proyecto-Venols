import { NextRequest, NextResponse } from 'next/server'
import { promises as dns } from 'dns'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/lib/bcrypt'
import { generateOTP, hashOTP, otpExpiresAt } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'
import { z } from 'zod'

const RegisterSchema = z.object({
  email: z.string().email('Formato de email inválido').toLowerCase().trim(),
  password: z.string().min(8, 'Contraseña muy corta'),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT', 'STANDARD']).optional().default('STANDARD'),
})

/** Verifica que el dominio del email tenga registros MX válidos (timeout 3s) */
async function domainHasMXRecords(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1]
    const records = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DNS timeout')), 3000)
      ),
    ])
    return Array.isArray(records) && records.length > 0
  } catch (err) {
    // En dev puede fallar por DNS local — logueamos pero no bloqueamos
    console.warn('[REGISTER] MX lookup failed, skipping validation:', (err as Error).message)
    return true
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validar formato con Zod
    const validation = RegisterSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName, phone, role } = validation.data

    // 2. Validar dominio con registros MX
    const mxValid = await domainHasMXRecords(email)
    if (!mxValid) {
      return NextResponse.json(
        { error: 'Correo no válido. El dominio no existe o no puede recibir emails.' },
        { status: 400 }
      )
    }

    // 3. Validar fortaleza de contraseña
    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'Contraseña débil', details: passwordCheck.errors },
        { status: 400 }
      )
    }

    // 4. Verificar si el email ya está registrado como usuario activo
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      )
    }

    // 5. Generar OTP y guardar registro pendiente
    const otp = generateOTP()
    const hashedPassword = await hashPassword(password)
    const expiresAt = otpExpiresAt(10) // 10 minutos

    // Upsert: si ya tenía un intento previo, lo reemplaza (permite reenvío del código)
    await prisma.pendingRegistration.upsert({
      where: { email },
      create: {
        email,
        hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        otpHash: hashOTP(otp),
        expiresAt,
      },
      update: {
        hashedPassword,
        firstName,
        lastName,
        phone,
        role,
        otpHash: hashOTP(otp),
        expiresAt,
        attempts: 0,
      },
    })

    // 6. Enviar email con el código OTP
    await sendOTPEmail({ to: email, firstName, otp })

    return NextResponse.json(
      {
        message: 'Código de verificación enviado. Revisa tu correo.',
        expiresInMinutes: 10,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[REGISTER ERROR]', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
