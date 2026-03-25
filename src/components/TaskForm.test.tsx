import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TaskForm } from "./TaskForm.js"

// Mock the API client
vi.mock("../lib/api-client.js", () => ({
  api: {
    listOrgs: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { login: "testuser", avatarUrl: "" },
        { login: "TestOrg", avatarUrl: "https://example.com/avatar.png" },
      ],
    }),
    listRepos: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { name: "repo-1", fullName: "TestOrg/repo-1", url: "https://github.com/TestOrg/repo-1", description: "First repo", language: "TypeScript", defaultBranch: "main", updatedAt: "2026-01-01", archived: false },
        { name: "repo-2", fullName: "TestOrg/repo-2", url: "https://github.com/TestOrg/repo-2", description: null, language: "Go", defaultBranch: "main", updatedAt: "2026-01-01", archived: false },
      ],
    }),
  },
}))

describe("TaskForm", () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    mockSubmit.mockClear()
  })

  const renderForm = (submitting = false) =>
    render(<TaskForm onSubmit={mockSubmit} submitting={submitting} />)

  it("renders mode selector with three options", () => {
    renderForm()

    expect(screen.getByText("Claude Discovers")).toBeInTheDocument()
    expect(screen.getByText("Organization + Pattern")).toBeInTheDocument()
    expect(screen.getByText("Direct URLs")).toBeInTheDocument()
  })

  it("defaults to discovery mode", () => {
    renderForm()

    expect(screen.getByText(/Claude sees all repos/)).toBeInTheDocument()
  })

  it("renders prompt textarea and max turns input", () => {
    renderForm()

    expect(screen.getByPlaceholderText("Describe the task for Claude...")).toBeInTheDocument()
    expect(screen.getByDisplayValue("200")).toBeInTheDocument()
  })

  it("submit button is disabled when prompt is empty", () => {
    renderForm()

    expect(screen.getByText("Submit Task")).toBeDisabled()
  })

  it("submit button shows 'Submitting...' when submitting", () => {
    renderForm(true)

    expect(screen.getByText("Submitting...")).toBeDisabled()
  })

  it("loads org dropdown in discovery mode", async () => {
    renderForm()

    await waitFor(() => {
      expect(screen.getByText("Organization")).toBeInTheDocument()
    })

    // Orgs should be loaded from mock
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })
  })

  it("shows hint field in discovery mode", () => {
    renderForm()

    expect(screen.getByPlaceholderText(/focus on the backend/)).toBeInTheDocument()
  })

  describe("direct mode", () => {
    const switchToDirect = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByText("Direct URLs"))
    }

    it("shows repo URL inputs when direct mode selected", async () => {
      const user = userEvent.setup()
      renderForm()

      await switchToDirect(user)

      expect(screen.getByPlaceholderText("https://github.com/org/repo")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("branch")).toBeInTheDocument()
    })

    it("submit is disabled without repo URL in direct mode", async () => {
      const user = userEvent.setup()
      renderForm()

      await switchToDirect(user)
      await user.type(screen.getByPlaceholderText("Describe the task for Claude..."), "Fix bug")

      expect(screen.getByText("Submit Task")).toBeDisabled()
    })

    it("adds and removes repo inputs", async () => {
      const user = userEvent.setup()
      renderForm()

      await switchToDirect(user)

      expect(screen.getAllByPlaceholderText("https://github.com/org/repo")).toHaveLength(1)
      expect(screen.queryByText("x")).not.toBeInTheDocument()

      await user.click(screen.getByText("+ Add repo"))
      expect(screen.getAllByPlaceholderText("https://github.com/org/repo")).toHaveLength(2)

      const removeButtons = screen.getAllByText("x")
      expect(removeButtons).toHaveLength(2)

      await user.click(removeButtons[0])
      expect(screen.getAllByPlaceholderText("https://github.com/org/repo")).toHaveLength(1)
    })

    it("submits direct mode with repos", async () => {
      const user = userEvent.setup()
      renderForm()

      await switchToDirect(user)

      await user.type(
        screen.getByPlaceholderText("https://github.com/org/repo"),
        "https://github.com/org/my-repo"
      )
      await user.type(screen.getByPlaceholderText("branch"), "main")
      await user.type(
        screen.getByPlaceholderText("Describe the task for Claude..."),
        "Fix the bug"
      )

      await user.click(screen.getByText("Submit Task"))

      expect(mockSubmit).toHaveBeenCalledWith({
        prompt: "Fix the bug",
        repoSource: {
          mode: "direct",
          repos: [{ url: "https://github.com/org/my-repo", branch: "main" }],
        },
        permissionMode: "acceptEdits",
        model: "sonnet",
        maxTurns: 200,
      })
    })

    it("omits branch when empty", async () => {
      const user = userEvent.setup()
      renderForm()

      await switchToDirect(user)

      await user.type(
        screen.getByPlaceholderText("https://github.com/org/repo"),
        "https://github.com/org/repo"
      )
      await user.type(
        screen.getByPlaceholderText("Describe the task for Claude..."),
        "Do something"
      )

      await user.click(screen.getByText("Submit Task"))

      expect(mockSubmit).toHaveBeenCalledWith({
        prompt: "Do something",
        repoSource: {
          mode: "direct",
          repos: [{ url: "https://github.com/org/repo" }],
        },
        permissionMode: "acceptEdits",
        model: "sonnet",
        maxTurns: 200,
      })
    })
  })

  describe("discovery mode submission", () => {
    it("submits discovery mode with org and prompt", async () => {
      const user = userEvent.setup()
      renderForm()

      // Wait for orgs to load
      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument()
      })

      await user.type(
        screen.getByPlaceholderText("Describe the task for Claude..."),
        "Audit all services"
      )

      await user.click(screen.getByText("Submit Task"))

      expect(mockSubmit).toHaveBeenCalledWith({
        prompt: "Audit all services",
        repoSource: {
          mode: "discovery",
          org: "testuser",
        },
        permissionMode: "acceptEdits",
        model: "sonnet",
        maxTurns: 200,
      })
    })

    it("includes hint when provided", async () => {
      const user = userEvent.setup()
      renderForm()

      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument()
      })

      await user.type(screen.getByPlaceholderText(/focus on the backend/), "only TypeScript repos")
      await user.type(
        screen.getByPlaceholderText("Describe the task for Claude..."),
        "Fix types"
      )

      await user.click(screen.getByText("Submit Task"))

      expect(mockSubmit).toHaveBeenCalledWith({
        prompt: "Fix types",
        repoSource: {
          mode: "discovery",
          org: "testuser",
          hint: "only TypeScript repos",
        },
        permissionMode: "acceptEdits",
        model: "sonnet",
        maxTurns: 200,
      })
    })
  })

  describe("org mode", () => {
    it("shows pattern input when org mode selected", async () => {
      const user = userEvent.setup()
      renderForm()

      await user.click(screen.getByText("Organization + Pattern"))

      expect(screen.getByPlaceholderText(/e\.g\. service-\*/)).toBeInTheDocument()
    })
  })
})
