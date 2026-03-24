import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAuth } from "./useAuth.js"

// Helper to create a fake JWT with given payload
const fakeJwt = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-signature`
}

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = ""
  })

  it("returns null user and isAuthenticated false when no stored auth", () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("returns stored user when auth exists in localStorage", () => {
    const token = fakeJwt({ sub: "1", login: "malin", name: "Malin" })
    localStorage.setItem("claude_dashboard_token", token)
    localStorage.setItem(
      "claude_dashboard_user",
      JSON.stringify({ id: "1", login: "malin", name: "Malin" })
    )

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual({ id: "1", login: "malin", name: "Malin" })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("login sets auth from token and updates user state", () => {
    const { result } = renderHook(() => useAuth())
    const token = fakeJwt({ sub: "2", login: "newuser", name: "New" })

    act(() => {
      result.current.login(token)
    })

    expect(result.current.user).toEqual({
      id: "2",
      login: "newuser",
      name: "New",
      picture: undefined,
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("logout clears auth and sets user to null", () => {
    const token = fakeJwt({ sub: "1", login: "malin" })
    localStorage.setItem("claude_dashboard_token", token)
    localStorage.setItem(
      "claude_dashboard_user",
      JSON.stringify({ id: "1", login: "malin" })
    )

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem("claude_dashboard_token")).toBeNull()
  })

  it("extracts token from URL hash via extractTokenFromHash", async () => {
    const { extractTokenFromHash } = await import("../lib/auth.js")
    const token = fakeJwt({ sub: "42", login: "hashlogin", name: "Hash" })
    window.location.hash = `#token=${token}`

    extractTokenFromHash()

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual({
      id: "42",
      login: "hashlogin",
      name: "Hash",
      picture: undefined,
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("does not change state when hash has no token", () => {
    window.location.hash = "#other=value"

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
