import type { AuthUser } from "@bloomerab/claude-types"

const USER_KEY = "claude_dashboard_user"

const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

const getToken = (): null => {
  // JWT is stored as httpOnly cookie by the server.
  // It is sent automatically via credentials: 'include'.
  return null
}

const setAuth = (user: AuthUser): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

const clearAuth = async (): Promise<void> => {
  localStorage.removeItem(USER_KEY)
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
  } catch {
    // Best-effort logout; cookie may already be expired
  }
}

const isAuthenticated = (): boolean => {
  return getUser() !== null
}

const getGitHubLoginUrl = (): string => {
  return "/api/auth/github"
}

export { getUser, getToken, setAuth, clearAuth, isAuthenticated, getGitHubLoginUrl }
