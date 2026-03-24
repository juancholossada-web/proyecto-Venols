export type Role =
  | 'ADMIN'
  | 'OPERATOR_HEAVY'
  | 'OPERATOR_LIGHT'
  | 'STANDARD'
  // deprecated
  | 'OPERATOR'
  | 'TECHNICIAN'

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  status: UserStatus
  lastLoginAt?: string | null
}

export interface AuthResponse {
  message: string
  user: AuthUser
  accessToken: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: Role
}

/** Etiquetas legibles para cada rol */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN:          'Administrador',
  OPERATOR_HEAVY: 'Operador Flota Pesada',
  OPERATOR_LIGHT: 'Operador Flota Liviana',
  STANDARD:       'Estándar',
}

/** Roles que pueden realizar operaciones de escritura */
export const WRITE_ROLES: Role[] = ['ADMIN', 'OPERATOR_HEAVY', 'OPERATOR_LIGHT']
