import { useState, useCallback } from "react"
import type { AuthUser } from "@bloomerab/claude-types"
import { getUser, setAuth, clearAuth } from "../lib/auth.js"

const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(getUser)

  const login = useCallback((newUser: AuthUser) => {
    setAuth(newUser)
    setUser(newUser)
  }, [])

  const logout = useCallback(async () => {
    await clearAuth()
    setUser(null)
  }, [])

  return {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
  }
}

export { useAuth }
