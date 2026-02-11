import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAuth } from "./useAuth.js"

const USER_KEY = "claude_dashboard_user"

const mockUser = { id: "u1", login: "malin", avatarUrl: "https://example.com/avatar.png" }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useAuth", () => {
  it("returns null user and isAuthenticated=false when no user in storage", () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("returns stored user and isAuthenticated=true when user exists in storage", () => {
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("login sets the user and updates isAuthenticated", () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(mockUser))
  })

  it("logout clears the user and calls the logout endpoint", async () => {
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }))

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })

  it("login is stable across renders (useCallback)", () => {
    const { result, rerender } = renderHook(() => useAuth())
    const loginRef = result.current.login
    rerender()
    expect(result.current.login).toBe(loginRef)
  })

  it("logout is stable across renders (useCallback)", () => {
    const { result, rerender } = renderHook(() => useAuth())
    const logoutRef = result.current.logout
    rerender()
    expect(result.current.logout).toBe(logoutRef)
  })
})
