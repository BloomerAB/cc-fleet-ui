import { useState, useCallback, useEffect } from "react"
import { type StoredUser, getUser, setAuth, clearAuth, extractTokenFromHash } from "../lib/auth.js"

const useAuth = () => {
  const [user, setUser] = useState<StoredUser | null>(getUser)

  // Check for token in URL hash on mount (server redirect flow)
  useEffect(() => {
    if (extractTokenFromHash()) {
      setUser(getUser())
    }
  }, [])

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
