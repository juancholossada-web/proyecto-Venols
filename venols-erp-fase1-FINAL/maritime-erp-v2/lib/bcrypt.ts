import bcrypt from 'bcryptjs'

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  if (password.length < 8) errors.push('Mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula')
  if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula')
  if (!/[0-9]/.test(password)) errors.push('Al menos un número')
  return { valid: errors.length === 0, errors }
}
