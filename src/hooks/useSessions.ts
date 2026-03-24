import { useState, useEffect, useCallback } from "react"
import type { Session } from "@bloomerab/cc-fleet-types"
import { api } from "../lib/api-client.js"

const useSessions = () => {
  const [sessions, setSessions] = useState<readonly Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.listTasks()
      if (response.success && response.data) {
        setSessions(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const updateSession = useCallback((sessionId: string, updates: Partial<Session>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    )
  }, [])

  return { sessions, loading, error, refetch: fetchSessions, updateSession }
}

export { useSessions }
