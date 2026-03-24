import type {
  ManagerToDashboardMessage,
  DashboardToManagerMessage,
} from "@bloomerab/claude-types"

type MessageHandler = (message: ManagerToDashboardMessage) => void

const MAX_RECONNECT_ATTEMPTS = 10

const createWsClient = () => {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const handlers = new Set<MessageHandler>()

  const connect = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const url = `${protocol}//${window.location.host}/ws/dashboard`

    ws = new WebSocket(url)

    ws.onopen = () => {
      reconnectAttempts = 0
      // Authenticate via first message; httpOnly cookie handles the HTTP upgrade,
      // but we send an explicit auth message so the server can verify the session.
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "auth" }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as ManagerToDashboardMessage
        for (const handler of handlers) {
          handler(message)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        return
      }
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
      reconnectAttempts++
      reconnectTimer = setTimeout(connect, delay)
    }
  }

  const send = (message: DashboardToManagerMessage) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  const disconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
    ws = null
  }

  const subscribe = (handler: MessageHandler) => {
    handlers.add(handler)
    return () => {
      handlers.delete(handler)
    }
  }

  const subscribeSessions = (sessionIds: readonly string[]) => {
    send({ type: "subscribe", sessionIds })
  }

  const sendAnswer = (sessionId: string, answers: Record<string, string>) => {
    send({ type: "answer", sessionId, answers })
  }

  const cancelSession = (sessionId: string) => {
    send({ type: "cancel", sessionId })
  }

  return {
    connect,
    disconnect,
    subscribe,
    subscribeSessions,
    sendAnswer,
    cancelSession,
  }
}

type WsClient = ReturnType<typeof createWsClient>

export { createWsClient }
export type { WsClient }
