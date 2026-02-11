import type {
  ManagerToDashboardMessage,
  DashboardToManagerMessage,
} from "@bloomer-ab/claude-types"
import { getToken } from "./auth.js"

type MessageHandler = (message: ManagerToDashboardMessage) => void

export function createWsClient() {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const handlers = new Set<MessageHandler>()

  function connect() {
    const token = getToken()
    if (!token) return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const url = `${protocol}//${window.location.host}/ws/dashboard?token=${token}`

    ws = new WebSocket(url)

    ws.onopen = () => {
      reconnectAttempts = 0
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
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
      reconnectAttempts++
      reconnectTimer = setTimeout(connect, delay)
    }
  }

  function send(message: DashboardToManagerMessage) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  return {
    connect,

    disconnect() {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      ws?.close()
      ws = null
    },

    subscribe(handler: MessageHandler) {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },

    subscribeSessions(sessionIds: readonly string[]) {
      send({ type: "subscribe", sessionIds })
    },

    sendAnswer(sessionId: string, answers: Record<string, string>) {
      send({ type: "answer", sessionId, answers })
    },

    cancelSession(sessionId: string) {
      send({ type: "cancel", sessionId })
    },
  }
}

export type WsClient = ReturnType<typeof createWsClient>
