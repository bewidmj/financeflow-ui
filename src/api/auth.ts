import { identityApi } from './client'
import type { AuthResponse, UserProfile } from '../types/api'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  displayName: string
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await identityApi.post<AuthResponse>('/api/v1/auth/login', input)
  return response.data
}

export async function register(input: RegisterInput): Promise<UserProfile> {
  const response = await identityApi.post<UserProfile>('/api/v1/auth/register', input)
  return response.data
}

export async function getProfile(): Promise<UserProfile> {
  const response = await identityApi.get<UserProfile>('/api/v1/users/me')
  return response.data
}
