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

const useSessionSocket = (sessionId: string | null, initialOutputs?: readonly DashboardOutputMessage[]) => {
  const clientRef = useRef<WsClient | null>(null)
  const [state, setState] = useState<SessionSocketState>({
    outputs: initialOutputs ?? [],
    questions: null,
    status: null,
  })

  // Update outputs when initial outputs are loaded
  useEffect(() => {
    if (initialOutputs && initialOutputs.length > 0) {
      setState((prev) => ({
        ...prev,
        outputs: prev.outputs.length === 0 ? initialOutputs : prev.outputs,
      }))
    }
  }, [initialOutputs])

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
          // Don't hardcode completed — trust session_update messages for status
          setState((prev) => ({
            ...prev,
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

  const sendFollowUp = useCallback(
    (text: string) => {
      if (sessionId && clientRef.current) {
        clientRef.current.sendFollowUp(sessionId, text)
      }
    },
    [sessionId],
  )

  const endSession = useCallback(() => {
    if (sessionId && clientRef.current) {
      clientRef.current.endSession(sessionId)
    }
  }, [sessionId])

  return {
    ...state,
    sendAnswer,
    cancel,
    sendFollowUp,
    endSession,
  }
}

export { useSessionSocket }
