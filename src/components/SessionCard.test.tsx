import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { SessionCard, timeAgo, extractRepoName } from "./SessionCard.js"
import type { Session } from "@bloomerab/claude-types"

afterEach(() => {
  vi.restoreAllMocks()
})

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: "s1",
  userId: "u1",
  taskConfig: {
    prompt: "Fix the authentication bug in the login page",
    repoUrl: "https://github.com/bloomer-ab/platform.git",
  },
  status: "running",
  jobName: null,
  result: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  startedAt: null,
  completedAt: null,
  ...overrides,
})

describe("timeAgo", () => {
  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    const now = new Date().toISOString()
    expect(timeAgo(now)).toBe("just now")
  })

  it("returns minutes ago for timestamps less than an hour ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(timeAgo(fiveMinAgo)).toBe("5m ago")
  })

  it("returns hours ago for timestamps less than a day ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(twoHoursAgo)).toBe("2h ago")
  })

  it("returns days ago for timestamps more than a day ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(threeDaysAgo)).toBe("3d ago")
  })
})

describe("extractRepoName", () => {
  it("extracts org/repo from a GitHub URL with .git", () => {
    expect(extractRepoName("https://github.com/bloomer-ab/platform.git")).toBe("bloomer-ab/platform")
  })

  it("extracts org/repo from a GitHub URL without .git", () => {
    expect(extractRepoName("https://github.com/bloomer-ab/platform")).toBe("bloomer-ab/platform")
  })

  it("returns the original URL if no match", () => {
    expect(extractRepoName("not-a-url")).toBe("not-a-url")
  })
})

describe("SessionCard", () => {
  const renderCard = (session: Session) =>
    render(
      <MemoryRouter>
        <SessionCard session={session} />
      </MemoryRouter>,
    )

  it("renders the session prompt truncated to 100 characters", () => {
    const longPrompt = "A".repeat(150)
    const session = makeSession({ taskConfig: { prompt: longPrompt, repoUrl: "https://github.com/org/repo" } })
    renderCard(session)

    expect(screen.getByText(`${"A".repeat(100)}...`)).toBeInTheDocument()
  })

  it("renders the full prompt when under 100 characters", () => {
    const session = makeSession()
    renderCard(session)
    expect(screen.getByText("Fix the authentication bug in the login page")).toBeInTheDocument()
  })

  it("renders the repository name", () => {
    const session = makeSession()
    renderCard(session)
    expect(screen.getByText("bloomer-ab/platform")).toBeInTheDocument()
  })

  it("renders the status badge", () => {
    const session = makeSession({ status: "completed" })
    renderCard(session)
    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("renders cost when available in result", () => {
    const session = makeSession({ result: { success: true, summary: "Done", costUsd: 1.234, turnsUsed: 5 } })
    renderCard(session)
    expect(screen.getByText("$1.23")).toBeInTheDocument()
  })

  it("renders turns used when available in result", () => {
    const session = makeSession({ result: { success: true, summary: "Done", turnsUsed: 12 } })
    renderCard(session)
    expect(screen.getByText("12 turns")).toBeInTheDocument()
  })

  it("links to the task detail page", () => {
    const session = makeSession({ id: "task-42" })
    renderCard(session)
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/tasks/task-42")
  })
})
