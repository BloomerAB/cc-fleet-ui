import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { api } from "./api-client.js"

const mockFetch = vi.fn()

describe("api-client", () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
    vi.stubGlobal("fetch", mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockResponse = (body: unknown, status = 200) =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    })

  it("sends Authorization header when token is stored", async () => {
    localStorage.setItem("claude_dashboard_token", "my-jwt-token")
    mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: [] }))

    await api.listTasks()

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/tasks?page=1&limit=20",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-jwt-token",
        }),
      })
    )
  })

  it("does not send Authorization header when no token", async () => {
    mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: [] }))

    await api.listTasks()

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers.Authorization).toBeUndefined()
  })

  describe("listTasks", () => {
    it("calls GET /api/tasks with pagination", async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: [] }))

      await api.listTasks(2, 10)

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tasks?page=2&limit=10",
        expect.objectContaining({ headers: expect.any(Object) })
      )
    })
  })

  describe("createTask", () => {
    it("sends POST /api/tasks with body", async () => {
      const taskData = { prompt: "Fix bug", repoUrl: "https://github.com/org/repo" }
      mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: { id: "t1" } }))

      await api.createTask(taskData)

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tasks",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(taskData),
        })
      )
    })
  })

  describe("getTask", () => {
    it("calls GET /api/tasks/:id", async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: { id: "t1" } }))

      await api.getTask("t1")

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tasks/t1",
        expect.objectContaining({ headers: expect.any(Object) })
      )
    })
  })

  describe("cancelTask", () => {
    it("calls POST /api/tasks/:id/cancel", async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ success: true, data: { cancelled: true } }))

      await api.cancelTask("t1")

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/tasks/t1/cancel",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  describe("error handling", () => {
    it("throws with error message from response body", async () => {
      mockFetch.mockReturnValueOnce(mockResponse({ error: "Not found" }, 404))

      await expect(api.getTask("missing")).rejects.toThrow("Not found")
    })

    it("throws with HTTP status when body has no error field", async () => {
      mockFetch.mockReturnValueOnce(mockResponse({}, 500))

      await expect(api.listTasks()).rejects.toThrow("HTTP 500")
    })

    it("throws with HTTP status when response body is not JSON", async () => {
      mockFetch.mockReturnValueOnce(
        Promise.resolve({
          ok: false,
          status: 502,
          json: () => Promise.reject(new Error("not json")),
        })
      )

      await expect(api.listTasks()).rejects.toThrow("HTTP 502")
    })
  })
})
