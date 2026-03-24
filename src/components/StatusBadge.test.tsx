import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusBadge } from "./StatusBadge.js"
import type { SessionStatus } from "@bloomerab/claude-types"

const allStatuses: readonly SessionStatus[] = [
  "queued",
  "running",
  "completed",
  "failed",
  "waiting_for_input",
  "timed_out",
  "cancelled",
]

const expectedLabels: Record<SessionStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  waiting_for_input: "Waiting for Input",
  timed_out: "Timed Out",
  cancelled: "Cancelled",
}

describe("StatusBadge", () => {
  allStatuses.forEach((status) => {
    it(`renders the correct label for "${status}"`, () => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(expectedLabels[status])).toBeInTheDocument()
    })
  })

  it("renders a pulsing dot for running status", () => {
    const { container } = render(<StatusBadge status="running" />)
    const dot = container.querySelector(".animate-pulse")
    expect(dot).toBeInTheDocument()
  })

  it("does not render a pulsing dot for non-running statuses", () => {
    const { container } = render(<StatusBadge status="completed" />)
    const dot = container.querySelector(".animate-pulse")
    expect(dot).not.toBeInTheDocument()
  })

  it("applies the correct CSS classes for each status", () => {
    const { container } = render(<StatusBadge status="failed" />)
    const badge = container.querySelector("span")
    expect(badge?.className).toContain("bg-red-100")
    expect(badge?.className).toContain("text-red-800")
  })
})
