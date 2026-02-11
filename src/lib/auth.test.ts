import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getUser, getToken, setAuth, clearAuth, isAuthenticated, getGitHubLoginUrl } from "./auth.js"

const USER_KEY = "claude_dashboard_user"

const mockUser = { id: "u1", login: "malin", avatarUrl: "https://example.com/avatar.png" }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("getUser", () => {
  it("returns null when no user is stored", () => {
    expect(getUser()).toBeNull()
  })

  it("returns the parsed user when valid JSON is stored", () => {
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    expect(getUser()).toEqual(mockUser)
  })

  it("returns null when stored value is invalid JSON", () => {
    localStorage.setItem(USER_KEY, "not-json{{{")
    expect(getUser()).toBeNull()
  })
})

describe("getToken", () => {
  it("always returns null (JWT is httpOnly cookie)", () => {
    expect(getToken()).toBeNull()
  })
})

describe("setAuth", () => {
  it("stores user as JSON in localStorage", () => {
    setAuth(mockUser)
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(mockUser))
  })
})

describe("clearAuth", () => {
  it("removes user from localStorage", async () => {
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))

    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }))

    await clearAuth()

    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })

  it("calls the logout endpoint with POST and credentials: include", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }))

    await clearAuth()

    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
  })

  it("does not throw when logout fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"))

    await expect(clearAuth()).resolves.toBeUndefined()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })
})

describe("isAuthenticated", () => {
  it("returns false when no user is stored", () => {
    expect(isAuthenticated()).toBe(false)
  })

  it("returns true when a valid user is stored", () => {
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    expect(isAuthenticated()).toBe(true)
  })
})

describe("getGitHubLoginUrl", () => {
  it("returns the GitHub auth endpoint path", () => {
    expect(getGitHubLoginUrl()).toBe("/api/auth/github")
  })
})
