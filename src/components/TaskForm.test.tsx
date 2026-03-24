import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TaskForm } from "./TaskForm.js"

describe("TaskForm", () => {
  const mockSubmit = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    mockSubmit.mockClear()
  })

  const renderForm = (submitting = false) =>
    render(<TaskForm onSubmit={mockSubmit} submitting={submitting} />)

  it("renders repo URL input, branch input, prompt textarea, and max turns", () => {
    renderForm()

    expect(screen.getByPlaceholderText("https://github.com/org/repo")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("branch")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Describe the task for Claude...")).toBeInTheDocument()
    expect(screen.getByDisplayValue("50")).toBeInTheDocument()
  })

  it("submit button is disabled when prompt is empty", () => {
    renderForm()

    expect(screen.getByText("Submit Task")).toBeDisabled()
  })

  it("submit button is disabled when no repo URL entered", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByPlaceholderText("Describe the task for Claude..."), "Fix bug")

    expect(screen.getByText("Submit Task")).toBeDisabled()
  })

  it("submit button shows 'Submitting...' when submitting", () => {
    renderForm(true)

    expect(screen.getByText("Submitting...")).toBeDisabled()
  })

  it("adds and removes repo inputs", async () => {
    const user = userEvent.setup()
    renderForm()

    // Initially one repo input, no remove button
    expect(screen.getAllByPlaceholderText("https://github.com/org/repo")).toHaveLength(1)
    expect(screen.queryByText("x")).not.toBeInTheDocument()

    // Add a repo
    await user.click(screen.getByText("+ Add repo"))
    expect(screen.getAllByPlaceholderText("https://github.com/org/repo")).toHaveLength(2)

    // Now remove buttons appear
    const removeButtons = screen.getAllByText("x")
    expect(removeButtons).toHaveLength(2)

    // Remove one
    await user.click(removeButtons[0])
    expect(screen.getAllByPlaceholderText("https://github.com/org/repo")).toHaveLength(1)
  })

  it("hides 'Add repo' button when 10 repos added", async () => {
    const user = userEvent.setup()
    renderForm()

    // Add 9 more repos (start with 1)
    for (let i = 0; i < 9; i++) {
      await user.click(screen.getByText("+ Add repo"))
    }

    expect(screen.getAllByPlaceholderText("https://github.com/org/repo")).toHaveLength(10)
    expect(screen.queryByText("+ Add repo")).not.toBeInTheDocument()
  })

  it("submits valid form data with repos array", async () => {
    const user = userEvent.setup()
    renderForm()

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
      repos: [{ url: "https://github.com/org/my-repo", branch: "main" }],
      maxTurns: 50,
    })
  })

  it("submits repos without branch when branch is empty", async () => {
    const user = userEvent.setup()
    renderForm()

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
      repos: [{ url: "https://github.com/org/repo" }],
      maxTurns: 50,
    })
  })

  it("resets form after successful submission", async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(
      screen.getByPlaceholderText("https://github.com/org/repo"),
      "https://github.com/org/repo"
    )
    await user.type(
      screen.getByPlaceholderText("Describe the task for Claude..."),
      "Fix bug"
    )

    await user.click(screen.getByText("Submit Task"))

    // After submit, prompt should be cleared
    expect(screen.getByPlaceholderText("Describe the task for Claude...")).toHaveValue("")
  })

  it("shows validation error for invalid repo URL", async () => {
    const user = userEvent.setup()
    renderForm()

    // Type invalid URL in repo field
    await user.type(
      screen.getByPlaceholderText("https://github.com/org/repo"),
      "not-a-url"
    )
    await user.type(
      screen.getByPlaceholderText("Describe the task for Claude..."),
      "Fix bug"
    )

    await user.click(screen.getByText("Submit Task"))

    // The form uses browser validation for url type, but zod also validates
    // mockSubmit should NOT have been called
    expect(mockSubmit).not.toHaveBeenCalled()
  })
})
