import { describe, it, expect, beforeEach } from "vitest"
import { getUser, getToken, setAuth, clearAuth, isAuthenticated, getGitHubLoginUrl } from "./auth.js"

const USER_KEY = "claude_dashboard_user"
const TOKEN_KEY = "claude_dashboard_token"

const mockUser = { id: "u1", login: "malin", avatarUrl: "https://example.com/avatar.png" }
const mockToken = "eyJhbGciOiJIUzI1NiJ9.test.signature"

beforeEach(() => {
  localStorage.clear()
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
  it("returns null when no token is stored", () => {
    expect(getToken()).toBeNull()
  })

  it("returns the stored token", () => {
    localStorage.setItem(TOKEN_KEY, mockToken)
    expect(getToken()).toBe(mockToken)
  })
})

describe("setAuth", () => {
  it("stores user and token in localStorage", () => {
    setAuth(mockUser, mockToken)
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(mockUser))
    expect(localStorage.getItem(TOKEN_KEY)).toBe(mockToken)
  })
})

describe("clearAuth", () => {
  it("removes user and token from localStorage", () => {
    setAuth(mockUser, mockToken)

    clearAuth()

    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe("isAuthenticated", () => {
  it("returns false when no user is stored", () => {
    expect(isAuthenticated()).toBe(false)
  })

  it("returns false when only user is stored but no token", () => {
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    expect(isAuthenticated()).toBe(false)
  })

  it("returns true when both user and token are stored", () => {
    setAuth(mockUser, mockToken)
    expect(isAuthenticated()).toBe(true)
  })
})

describe("getGitHubLoginUrl", () => {
  it("returns the GitHub auth endpoint path", () => {
    expect(getGitHubLoginUrl()).toBe("/api/auth/github")
  })
})
