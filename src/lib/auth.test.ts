import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  getUser,
  getToken,
  setAuth,
  clearAuth,
  isAuthenticated,
  getLoginUrl,
  extractTokenFromHash,
} from "./auth.js"

// Helper to create a fake JWT with given payload
const fakeJwt = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-signature`
}

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset location hash
    window.location.hash = ""
  })

  describe("setAuth", () => {
    it("decodes JWT and stores user and token in localStorage", () => {
      const token = fakeJwt({
        sub: "123",
        login: "malin",
        name: "Malin",
        picture: "https://example.com/avatar.png",
      })

      setAuth(token)

      expect(localStorage.getItem("claude_dashboard_token")).toBe(token)
      const stored = JSON.parse(localStorage.getItem("claude_dashboard_user")!)
      expect(stored).toEqual({
        id: "123",
        login: "malin",
        name: "Malin",
        picture: "https://example.com/avatar.png",
      })
    })

    it("handles missing optional fields in JWT payload", () => {
      const token = fakeJwt({ sub: "456", login: "user2" })

      setAuth(token)

      const stored = JSON.parse(localStorage.getItem("claude_dashboard_user")!)
      expect(stored.id).toBe("456")
      expect(stored.login).toBe("user2")
      expect(stored.name).toBeUndefined()
      expect(stored.picture).toBeUndefined()
    })
  })

  describe("getUser", () => {
    it("returns null when no user stored", () => {
      expect(getUser()).toBeNull()
    })

    it("returns parsed user when stored", () => {
      const user = { id: "1", login: "test", name: "Test" }
      localStorage.setItem("claude_dashboard_user", JSON.stringify(user))

      expect(getUser()).toEqual(user)
    })

    it("returns null for invalid JSON", () => {
      localStorage.setItem("claude_dashboard_user", "not-json")

      expect(getUser()).toBeNull()
    })
  })

  describe("getToken", () => {
    it("returns null when no token stored", () => {
      expect(getToken()).toBeNull()
    })

    it("returns token when stored", () => {
      localStorage.setItem("claude_dashboard_token", "my-token")

      expect(getToken()).toBe("my-token")
    })
  })

  describe("clearAuth", () => {
    it("removes user and token from localStorage", () => {
      localStorage.setItem("claude_dashboard_user", "data")
      localStorage.setItem("claude_dashboard_token", "token")

      clearAuth()

      expect(localStorage.getItem("claude_dashboard_user")).toBeNull()
      expect(localStorage.getItem("claude_dashboard_token")).toBeNull()
    })
  })

  describe("isAuthenticated", () => {
    it("returns false when neither user nor token exist", () => {
      expect(isAuthenticated()).toBe(false)
    })

    it("returns false when only user exists", () => {
      localStorage.setItem("claude_dashboard_user", JSON.stringify({ id: "1", login: "t" }))

      expect(isAuthenticated()).toBe(false)
    })

    it("returns false when only token exists", () => {
      localStorage.setItem("claude_dashboard_token", "token")

      expect(isAuthenticated()).toBe(false)
    })

    it("returns true when both user and token exist", () => {
      const token = fakeJwt({ sub: "1", login: "test" })
      setAuth(token)

      expect(isAuthenticated()).toBe(true)
    })
  })

  describe("getLoginUrl", () => {
    it("returns /api/auth/login", () => {
      expect(getLoginUrl()).toBe("/api/auth/login")
    })
  })

  describe("extractTokenFromHash", () => {
    it("returns false when hash is empty", () => {
      window.location.hash = ""

      expect(extractTokenFromHash()).toBe(false)
    })

    it("returns false when hash does not start with #token=", () => {
      window.location.hash = "#other=value"

      expect(extractTokenFromHash()).toBe(false)
    })

    it("returns false when token value is empty", () => {
      window.location.hash = "#token="

      expect(extractTokenFromHash()).toBe(false)
    })

    it("extracts token from hash, stores auth, and cleans hash", () => {
      const token = fakeJwt({ sub: "99", login: "hashuser", name: "Hash" })
      window.location.hash = `#token=${token}`
      const replaceStateSpy = vi.spyOn(window.history, "replaceState")

      const result = extractTokenFromHash()

      expect(result).toBe(true)
      expect(localStorage.getItem("claude_dashboard_token")).toBe(token)
      expect(JSON.parse(localStorage.getItem("claude_dashboard_user")!).login).toBe("hashuser")
      expect(replaceStateSpy).toHaveBeenCalledWith(null, "", window.location.pathname)

      replaceStateSpy.mockRestore()
    })
  })
})
