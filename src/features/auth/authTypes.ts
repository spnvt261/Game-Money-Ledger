export interface AdminSession {
  sessionToken: string
  role: 'admin'
  expiresAt: string
}

export interface CheckAdminKeyRow {
  session_token: string
  role: string
  expires_at: string
}
