import type { AuthUser } from "@bloomerab/claude-types"

const USER_KEY = "claude_dashboard_user"
const TOKEN_KEY = "claude_dashboard_token"

const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

const setAuth = (user: AuthUser, token: string): void => {
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

const getGitHubLoginUrl = (): string => {
  return "/api/auth/github"
}

export { getUser, getToken, setAuth, clearAuth, isAuthenticated, getGitHubLoginUrl }
