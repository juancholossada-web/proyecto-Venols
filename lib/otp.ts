import crypto from 'crypto'

/** Genera un OTP numérico de 6 dígitos */
export function generateOTP(): string {
  // Genera número aleatorio criptográficamente seguro entre 100000 y 999999
  const buffer = crypto.randomBytes(4)
  const num = buffer.readUInt32BE(0)
  return String(100000 + (num % 900000))
}

/** Hashea el OTP antes de guardarlo en BD */
export function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

/** Verifica el OTP ingresado contra el hash almacenado */
export function verifyOTP(otp: string, storedHash: string): boolean {
  const inputHash = hashOTP(otp)
  // Comparación en tiempo constante para evitar timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  )
}

/** Retorna la fecha de expiración (ahora + N minutos) */
export function otpExpiresAt(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}
