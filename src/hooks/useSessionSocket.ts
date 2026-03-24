import { useEffect, useRef, useState, useCallback } from "react"
import type {
  ManagerToDashboardMessage,
  DashboardOutputMessage,
  Question,
  SessionStatus,
} from "../types/index.js"
import { createWsClient, type WsClient } from "../lib/ws-client.js"

interface SessionSocketState {
  readonly outputs: readonly DashboardOutputMessage[]
  readonly questions: readonly Question[] | null
  readonly status: SessionStatus | null
}

const useSessionSocket = (sessionId: string | null) => {
  const clientRef = useRef<WsClient | null>(null)
  const [state, setState] = useState<SessionSocketState>({
    outputs: [],
    questions: null,
    status: null,
  })

  useEffect(() => {
    if (!sessionId) return

    const client = createWsClient()
    clientRef.current = client
    client.connect()

    const unsubscribe = client.subscribe((message: ManagerToDashboardMessage) => {
      if ("sessionId" in message && message.sessionId !== sessionId) return

      switch (message.type) {
        case "output":
          setState((prev) => ({
            ...prev,
            outputs: [...prev.outputs, message],
          }))
          break
        case "question":
          setState((prev) => ({
            ...prev,
            questions: message.questions,
          }))
          break
        case "session_update":
          setState((prev) => ({
            ...prev,
            status: message.status,
          }))
          break
        case "result":
          setState((prev) => ({
            ...prev,
            status: "completed",
            questions: null,
          }))
          break
      }
    })

    client.subscribeSessions([sessionId])

    return () => {
      unsubscribe()
      client.disconnect()
      clientRef.current = null
    }
  }, [sessionId])

  const sendAnswer = useCallback(
    (answers: Record<string, string>) => {
      if (sessionId && clientRef.current) {
        clientRef.current.sendAnswer(sessionId, answers)
        setState((prev) => ({ ...prev, questions: null }))
      }
    },
    [sessionId],
  )

  const cancel = useCallback(() => {
    if (sessionId && clientRef.current) {
      clientRef.current.cancelSession(sessionId)
    }
  }, [sessionId])

  return {
    ...state,
    sendAnswer,
    cancel,
  }
}

export { useSessionSocket }
