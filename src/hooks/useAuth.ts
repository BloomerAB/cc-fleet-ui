import { useState, useCallback } from "react"
import type { AuthUser } from "@bloomer-ab/claude-types"
import { getUser, getToken, setAuth, clearAuth } from "../lib/auth.js"

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getUser)
  const [token, setToken] = useState<string | null>(getToken)

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setAuth(newToken, newUser)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  return {
    user,
    token,
    isAuthenticated: token !== null,
    login,
    logout,
  }
}
