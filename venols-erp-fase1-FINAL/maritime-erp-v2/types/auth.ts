export type Role = 'ADMIN' | 'OPERATOR' | 'TECHNICIAN'
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
