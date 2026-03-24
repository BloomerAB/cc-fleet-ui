const USER_KEY = "claude_dashboard_user"
const TOKEN_KEY = "claude_dashboard_token"

interface StoredUser {
  readonly id: string
  readonly login: string
  readonly name?: string
  readonly picture?: string
}

const getUser = (): StoredUser | null => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

const setAuth = (token: string): void => {
  // Decode JWT payload to extract user info
  const payload = JSON.parse(atob(token.split(".")[1]))
  const user: StoredUser = {
    id: payload.sub,
    login: payload.login,
    name: payload.name,
    picture: payload.picture,
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, token)
}

const clearAuth = (): void => {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

const isAuthenticated = (): boolean => {
  return getUser() !== null && getToken() !== null
}

const getLoginUrl = (): string => {
  return "/api/auth/login"
}

/**
 * Check URL hash for token from server redirect (/#token=<jwt>).
 * Extracts and stores the token, then cleans the hash.
 */
const extractTokenFromHash = (): boolean => {
  const hash = window.location.hash
  if (!hash.startsWith("#token=")) return false

  const token = hash.slice("#token=".length)
  if (!token) return false

  setAuth(token)
  window.history.replaceState(null, "", window.location.pathname)
  return true
}

export { type StoredUser, getUser, getToken, setAuth, clearAuth, isAuthenticated, getLoginUrl, extractTokenFromHash }
