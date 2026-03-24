import { useState, useCallback, useEffect } from "react"
import { type StoredUser, getUser, setAuth, clearAuth, extractTokenFromHash } from "../lib/auth.js"

const useAuth = () => {
  const [user, setUser] = useState<StoredUser | null>(getUser)

  // Check for token in URL hash on mount (server redirect flow)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional one-time check
  useEffect(() => {
    const found = extractTokenFromHash()
    if (found) {
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
