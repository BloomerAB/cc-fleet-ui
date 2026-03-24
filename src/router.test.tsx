import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { Router } from "./router.js"

// Helper to create a fake JWT with given payload
const fakeJwt = (payload: Record<string, unknown>): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-signature`
}

describe("Router", () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.pushState({}, "", "/")
  })

  it("redirects to /login when not authenticated", () => {
    render(<Router />)

    // Should see login page content (or at least not the dashboard)
    expect(window.location.pathname).toBe("/login")
  })

  it("renders dashboard when authenticated", () => {
    const token = fakeJwt({ sub: "1", login: "malin" })
    localStorage.setItem("claude_dashboard_token", token)
    localStorage.setItem(
      "claude_dashboard_user",
      JSON.stringify({ id: "1", login: "malin" })
    )

    render(<Router />)

    // Authenticated user on "/" should see the dashboard, not login
    expect(window.location.pathname).toBe("/")
  })

  it("does not define an /auth/callback route", () => {
    window.history.pushState({}, "", "/auth/callback")

    const { container } = render(<Router />)

    // /auth/callback is not a defined route - no page content should render
    // (no login page, no dashboard - just the empty error boundary wrapper)
    expect(screen.queryByText("Sign in with GitHub")).not.toBeInTheDocument()
    expect(container.querySelector("main")).toBeNull()
  })
})
