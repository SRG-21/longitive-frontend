export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'PRACTITIONER' | 'USER' | 'FAMILY'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser
}
