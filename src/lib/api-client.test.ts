import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { api } from "./api-client.js"

const mockFetch = vi.fn()

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

describe("api.createTask", () => {
  it("sends POST to /api/tasks with JSON body and credentials: include", async () => {
    const payload = { prompt: "Fix the bug", repoUrl: "https://github.com/org/repo" }
    const responseBody = { success: true, data: { id: "t1" } }
    mockFetch.mockResolvedValue(jsonResponse(responseBody))

    const result = await api.createTask(payload)

    expect(result).toEqual(responseBody)
    expect(mockFetch).toHaveBeenCalledWith("/api/tasks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  })
})

describe("api.listTasks", () => {
  it("sends GET to /api/tasks with default pagination", async () => {
    const responseBody = { success: true, data: [] }
    mockFetch.mockResolvedValue(jsonResponse(responseBody))

    const result = await api.listTasks()

    expect(result).toEqual(responseBody)
    expect(mockFetch).toHaveBeenCalledWith("/api/tasks?page=1&limit=20", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
  })

  it("sends GET with custom page and limit", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true, data: [] }))

    await api.listTasks(3, 50)

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tasks?page=3&limit=50",
      expect.objectContaining({ credentials: "include" }),
    )
  })
})

describe("api.getTask", () => {
  it("sends GET to /api/tasks/:id", async () => {
    const responseBody = { success: true, data: { id: "t1" } }
    mockFetch.mockResolvedValue(jsonResponse(responseBody))

    const result = await api.getTask("t1")

    expect(result).toEqual(responseBody)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tasks/t1",
      expect.objectContaining({ credentials: "include" }),
    )
  })
})

describe("api.cancelTask", () => {
  it("sends POST to /api/tasks/:id/cancel", async () => {
    const responseBody = { success: true, data: { cancelled: true } }
    mockFetch.mockResolvedValue(jsonResponse(responseBody))

    const result = await api.cancelTask("t1")

    expect(result).toEqual(responseBody)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tasks/t1/cancel",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    )
  })
})

describe("api.exchangeCode", () => {
  it("sends POST to /api/auth/github/callback with code and state", async () => {
    const responseBody = { success: true, data: { user: { id: "u1", login: "malin", avatarUrl: "https://x.com/a" } } }
    mockFetch.mockResolvedValue(jsonResponse(responseBody))

    const result = await api.exchangeCode("abc123", "state456")

    expect(result).toEqual(responseBody)
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/github/callback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "abc123", state: "state456" }),
      }),
    )
  })
})

describe("error handling", () => {
  it("throws with error message from JSON body when response is not ok", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Unauthorized" }, 401),
    )

    await expect(api.listTasks()).rejects.toThrow("Unauthorized")
  })

  it("throws with HTTP status when body has no error field", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({}, 500),
    )

    await expect(api.listTasks()).rejects.toThrow("HTTP 500")
  })

  it("throws with HTTP status when body is not valid JSON", async () => {
    mockFetch.mockResolvedValue(
      new Response("not json", { status: 502 }),
    )

    await expect(api.listTasks()).rejects.toThrow("HTTP 502")
  })
})
