import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '8h') as `${number}${'s' | 'm' | 'h' | 'd'}`

export interface JWTPayload {
  sub: string
  email: string
  role: string
  sessionId: string
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'maritime-erp',
    audience: 'maritime-erp-client',
  })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'maritime-erp',
    audience: 'maritime-erp-client',
  }) as JWTPayload
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
