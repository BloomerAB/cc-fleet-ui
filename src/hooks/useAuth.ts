import { useState, useCallback } from "react"
import { type StoredUser, getUser, setAuth, clearAuth } from "../lib/auth.js"

const useAuth = () => {
  // Token extraction from hash happens synchronously in auth.ts module init
  const [user, setUser] = useState<StoredUser | null>(getUser)

  const login = useCallback((token: string) => {
    setAuth(token)
    setUser(getUser())
  }, [])

  const logout = useCallback(() => {
    clearAuth()
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
