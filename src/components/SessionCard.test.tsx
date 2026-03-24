import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { SessionCard, timeAgo, extractRepoName } from "./SessionCard.js"

describe("timeAgo", () => {
  it("returns 'just now' for times less than 60 seconds ago", () => {
    const now = new Date().toISOString()
    expect(timeAgo(now)).toBe("just now")
  })

  it("returns minutes ago for times less than 1 hour ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(timeAgo(fiveMinAgo)).toBe("5m ago")
  })

  it("returns hours ago for times less than 1 day ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    expect(timeAgo(twoHoursAgo)).toBe("2h ago")
  })

  it("returns days ago for times more than 1 day ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString()
    expect(timeAgo(threeDaysAgo)).toBe("3d ago")
  })
})

describe("extractRepoName", () => {
  it("extracts org/repo from GitHub URL", () => {
    expect(extractRepoName("https://github.com/BloomerAB/claude-types")).toBe(
      "BloomerAB/claude-types"
    )
  })

  it("handles .git suffix", () => {
    expect(extractRepoName("https://github.com/org/repo.git")).toBe("org/repo")
  })

  it("returns raw URL when pattern does not match", () => {
    expect(extractRepoName("not-a-url")).toBe("not-a-url")
  })
})

describe("SessionCard", () => {
  const baseSession = {
    id: "s1",
    userId: "u1",
    prompt: "Fix the login bug in the auth module",
    repos: [{ url: "https://github.com/org/repo" }],
    status: "completed" as const,
    jobName: null,
    result: {
      success: true,
      summary: "Fixed the bug",
      costUsd: 1.23,
      turnsUsed: 5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  }

  const renderCard = (session = baseSession) =>
    render(
      <MemoryRouter>
        <SessionCard session={session as never} />
      </MemoryRouter>
    )

  it("renders prompt text", () => {
    renderCard()
    expect(screen.getByText("Fix the login bug in the auth module")).toBeInTheDocument()
  })

  it("truncates long prompts at 100 characters", () => {
    const longPrompt = "A".repeat(150)
    renderCard({ ...baseSession, prompt: longPrompt })
    expect(screen.getByText(`${"A".repeat(100)}...`)).toBeInTheDocument()
  })

  it("renders repo name extracted from URL", () => {
    renderCard()
    expect(screen.getByText("org/repo")).toBeInTheDocument()
  })

  it("renders multiple repo names joined by comma", () => {
    renderCard({
      ...baseSession,
      repos: [
        { url: "https://github.com/org/repo1" },
        { url: "https://github.com/org/repo2" },
      ],
    })
    expect(screen.getByText("org/repo1, org/repo2")).toBeInTheDocument()
  })

  it("renders cost when present", () => {
    renderCard()
    expect(screen.getByText("$1.23")).toBeInTheDocument()
  })

  it("renders turns when present", () => {
    renderCard()
    expect(screen.getByText("5 turns")).toBeInTheDocument()
  })

  it("links to task detail page", () => {
    renderCard()
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/tasks/s1")
  })

  it("does not render cost or turns when result has no values", () => {
    renderCard({ ...baseSession, result: { success: true, summary: "done" } })
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/turns/)).not.toBeInTheDocument()
  })
})
