import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromHeader, hashToken } from './jwt'
import { prisma } from './prisma'
import { Role, FleetType } from '@prisma/client'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: Role
    sessionId: string
  }
}

type RouteHandler = (
  req: AuthenticatedRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse>

/**
 * Devuelve el filtro de flota que aplica a un rol.
 * ADMIN y STANDARD no tienen restricción de flota.
 */
export function getFleetFilter(role: Role): FleetType | null {
  if (role === 'OPERATOR_HEAVY') return 'PESADA'
  if (role === 'OPERATOR_LIGHT') return 'LIVIANA'
  return null
}

/**
 * Roles que pueden escribir/mutar datos operacionales.
 */
export const WRITE_ROLES: Role[] = ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT']

/**
 * Verifica que un vessel pertenezca a la flota del rol.
 * Devuelve true si el acceso es válido.
 */
export async function canAccessVessel(vesselId: string, role: Role): Promise<boolean> {
  const fleetFilter = getFleetFilter(role)
  if (!fleetFilter) return true // ADMIN y STANDARD ven todo
  const vessel = await prisma.vessel.findFirst({
    where: { id: vesselId, fleetType: fleetFilter },
    select: { id: true },
  })
  return vessel !== null
}

export function withAuth(handler: RouteHandler, allowedRoles?: Role[]) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      const token = getTokenFromHeader(req.headers.get('authorization'))

      if (!token) {
        return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
      }

      const payload = verifyToken(token)

      const session = await prisma.session.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { user: { select: { status: true } } },
      })

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 })
      }

      if (session.user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Cuenta suspendida o inactiva' }, { status: 403 })
      }

      if (allowedRoles && !allowedRoles.includes(payload.role as Role)) {
        return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
      }

      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role as Role,
        sessionId: payload.sessionId,
      }

      return handler(authenticatedReq, context)
    } catch (error) {
      console.error('[AUTH MIDDLEWARE ERROR]', error)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
  }
}
