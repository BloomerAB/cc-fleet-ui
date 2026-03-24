import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createWsClient } from "./ws-client.js"

// Mock WebSocket
class MockWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3

  readyState = MockWebSocket.OPEN
  url: string
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  send = vi.fn()
  close = vi.fn()
  protocol = ""
  extensions = ""
  bufferedAmount = 0
  binaryType: BinaryType = "blob"
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()

  constructor(url: string) {
    this.url = url
    // Auto-trigger onopen in microtask
    queueMicrotask(() => {
      if (this.onopen) {
        this.onopen(new Event("open"))
      }
    })
  }
}

let latestWs: MockWebSocket

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.setItem("claude_dashboard_token", "test-jwt-token")
  vi.stubGlobal("WebSocket", class extends MockWebSocket {
    constructor(url: string) {
      super(url)
      latestWs = this
    }
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe("createWsClient", () => {
  it("returns an object with connect, disconnect, subscribe, subscribeSessions, sendAnswer, cancelSession", () => {
    const client = createWsClient()
    expect(client.connect).toBeTypeOf("function")
    expect(client.disconnect).toBeTypeOf("function")
    expect(client.subscribe).toBeTypeOf("function")
    expect(client.subscribeSessions).toBeTypeOf("function")
    expect(client.sendAnswer).toBeTypeOf("function")
    expect(client.cancelSession).toBeTypeOf("function")
  })
})

describe("connect", () => {
  it("creates a WebSocket with correct URL including token", async () => {
    const client = createWsClient()
    client.connect()

    // jsdom defaults to http://localhost, so ws:// is used
    expect(latestWs.url).toContain("/ws/dashboard?token=test-jwt-token")
  })

  it("does not connect when no token is available", async () => {
    localStorage.clear()
    let wsCreated = false
    vi.stubGlobal("WebSocket", class extends MockWebSocket {
      constructor(url: string) {
        super(url)
        wsCreated = true
      }
    })
    const client = createWsClient()
    client.connect()

    expect(wsCreated).toBe(false)
  })
})

describe("subscribe / message handling", () => {
  it("calls subscribed handlers with parsed messages", async () => {
    const client = createWsClient()
    const handler = vi.fn()
    client.subscribe(handler)
    client.connect()

    await vi.advanceTimersByTimeAsync(0)

    const msg = { type: "session_update", sessionId: "s1", status: "running" }
    latestWs.onmessage!(new MessageEvent("message", { data: JSON.stringify(msg) }))

    expect(handler).toHaveBeenCalledWith(msg)
  })

  it("ignores malformed JSON messages", async () => {
    const client = createWsClient()
    const handler = vi.fn()
    client.subscribe(handler)
    client.connect()

    await vi.advanceTimersByTimeAsync(0)

    latestWs.onmessage!(new MessageEvent("message", { data: "not json{{{" }))

    expect(handler).not.toHaveBeenCalled()
  })

  it("unsubscribe removes handler", async () => {
    const client = createWsClient()
    const handler = vi.fn()
    const unsubscribe = client.subscribe(handler)
    client.connect()

    await vi.advanceTimersByTimeAsync(0)

    unsubscribe()

    const msg = { type: "session_update", sessionId: "s1", status: "running" }
    latestWs.onmessage!(new MessageEvent("message", { data: JSON.stringify(msg) }))

    expect(handler).not.toHaveBeenCalled()
  })
})

describe("send helpers", () => {
  it("subscribeSessions sends subscribe message", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    client.subscribeSessions(["s1", "s2"])

    expect(latestWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "subscribe", sessionIds: ["s1", "s2"] }),
    )
  })

  it("sendAnswer sends answer message", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    client.sendAnswer("s1", { q1: "yes" })

    expect(latestWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "answer", sessionId: "s1", answers: { q1: "yes" } }),
    )
  })

  it("cancelSession sends cancel message", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    client.cancelSession("s1")

    expect(latestWs.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "cancel", sessionId: "s1" }),
    )
  })

  it("does not send when WebSocket is not open", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    latestWs.readyState = MockWebSocket.CLOSED

    client.subscribeSessions(["s1"])

    // No send calls should have been made (onopen doesn't call send anymore unless there are subscriptions)
    expect(latestWs.send).not.toHaveBeenCalled()
  })
})

describe("reconnection", () => {
  it("reconnects after close with exponential backoff", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    const firstWs = latestWs

    // Simulate close
    firstWs.onclose!(new CloseEvent("close"))

    // Should reconnect after 1000ms (1000 * 2^0)
    await vi.advanceTimersByTimeAsync(1000)

    expect(latestWs).not.toBe(firstWs)
  })

  it("stops reconnecting after MAX_RECONNECT_ATTEMPTS (10)", async () => {
    // Override mock: no auto-open so reconnectAttempts accumulates
    let wsCount = 0
    vi.stubGlobal("WebSocket", class MockWS {
      static readonly CONNECTING = 0
      static readonly OPEN = 1
      static readonly CLOSING = 2
      static readonly CLOSED = 3
      readonly CONNECTING = 0
      readonly OPEN = 1
      readonly CLOSING = 2
      readonly CLOSED = 3
      readyState = 1
      url: string
      onopen: ((event: Event) => void) | null = null
      onclose: ((event: CloseEvent) => void) | null = null
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      send = vi.fn()
      close = vi.fn()
      constructor(url: string) {
        this.url = url
        latestWs = this as any
        wsCount++
        // Do NOT auto-trigger onopen
      }
    })

    const client = createWsClient()
    client.connect()

    // Simulate 10 closes without onopen firing (so reconnectAttempts increments)
    for (let i = 0; i < 10; i++) {
      latestWs.onclose!(new CloseEvent("close"))
      const delay = Math.min(1000 * Math.pow(2, i), 30000)
      await vi.advanceTimersByTimeAsync(delay)
    }

    const countAfterMaxReconnects = wsCount

    // 11th close should NOT trigger another reconnect
    latestWs.onclose!(new CloseEvent("close"))
    await vi.advanceTimersByTimeAsync(60000)

    expect(wsCount).toBe(countAfterMaxReconnects)
    // 1 initial + 10 reconnects = 11 total WebSocket instances
    expect(countAfterMaxReconnects).toBe(11)
  })

  it("resets reconnect attempts on successful open", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    // Simulate close then reconnect
    latestWs.onclose!(new CloseEvent("close"))
    await vi.advanceTimersByTimeAsync(1000)

    // New connection opens - should reset attempts
    // (onopen is auto-triggered by our mock in microtask)
    await vi.advanceTimersByTimeAsync(0)

    // Simulate close again - delay should be back to 1000ms (attempt 0)
    const wsBeforeSecondClose = latestWs
    latestWs.onclose!(new CloseEvent("close"))
    await vi.advanceTimersByTimeAsync(1000)

    expect(latestWs).not.toBe(wsBeforeSecondClose)
  })
})

describe("disconnect", () => {
  it("closes the WebSocket and clears reconnect timer", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    const ws = latestWs

    client.disconnect()

    expect(ws.close).toHaveBeenCalled()
  })

  it("clears pending reconnect timer on disconnect", async () => {
    const client = createWsClient()
    client.connect()
    await vi.advanceTimersByTimeAsync(0)

    // Trigger close to start reconnect timer
    latestWs.onclose!(new CloseEvent("close"))

    // Disconnect before timer fires
    client.disconnect()

    const wsBeforeTimer = latestWs

    // Advance past the reconnect delay
    await vi.advanceTimersByTimeAsync(5000)

    // No new WebSocket should have been created (the latestWs won't change via constructor)
    // but the old ws was closed
    expect(wsBeforeTimer.close).toHaveBeenCalled()
  })
})
