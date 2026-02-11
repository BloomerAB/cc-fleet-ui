import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TaskForm } from "./TaskForm.js"

afterEach(() => {
  vi.restoreAllMocks()
})

const renderForm = (overrides: { onSubmit?: (data: unknown) => Promise<void>; submitting?: boolean } = {}) => {
  const onSubmit = overrides.onSubmit ?? vi.fn(() => Promise.resolve())
  const submitting = overrides.submitting ?? false

  const result = render(<TaskForm onSubmit={onSubmit} submitting={submitting} />)

  return { ...result, onSubmit }
}

describe("TaskForm", () => {
  it("renders all form fields", () => {
    renderForm()

    expect(screen.getByPlaceholderText("https://github.com/org/repo")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("main")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Describe the task for Claude...")).toBeInTheDocument()
    expect(screen.getByDisplayValue("50")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submit Task" })).toBeInTheDocument()
  })

  it("submit button is disabled when prompt and repoUrl are empty", () => {
    renderForm()
    expect(screen.getByRole("button", { name: "Submit Task" })).toBeDisabled()
  })

  it("shows Submitting... when submitting prop is true", () => {
    renderForm({ submitting: true })
    expect(screen.getByRole("button", { name: "Submitting..." })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Submitting..." })).toBeDisabled()
  })

  it("shows validation error for invalid repo URL", async () => {
    const user = userEvent.setup()
    renderForm()

    const repoInput = screen.getByPlaceholderText("https://github.com/org/repo")
    const promptInput = screen.getByPlaceholderText("Describe the task for Claude...")

    // Use ftp:// — passes native URL validation but fails Zod's https?:// regex
    await user.type(repoInput, "ftp://invalid.com/repo")
    await user.type(promptInput, "Fix the bug")

    await user.click(screen.getByRole("button", { name: "Submit Task" }))

    expect(screen.getByText("Must be an HTTP(S) URL")).toBeInTheDocument()
  })

  it("shows validation error for empty prompt", async () => {
    const user = userEvent.setup()
    renderForm()

    const repoInput = screen.getByPlaceholderText("https://github.com/org/repo")

    // Type a valid URL but leave prompt empty - button is still disabled due to required
    await user.type(repoInput, "https://github.com/org/repo")

    // Button disabled because prompt is empty (HTML required + disabled logic)
    expect(screen.getByRole("button", { name: "Submit Task" })).toBeDisabled()
  })

  it("calls onSubmit with validated data on successful submission", async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByPlaceholderText("https://github.com/org/repo"), "https://github.com/org/repo")
    await user.type(screen.getByPlaceholderText("Describe the task for Claude..."), "Fix the login bug")

    await user.click(screen.getByRole("button", { name: "Submit Task" }))

    expect(onSubmit).toHaveBeenCalledWith({
      prompt: "Fix the login bug",
      repoUrl: "https://github.com/org/repo",
      maxTurns: 50,
    })
  })

  it("clears prompt after successful submission", async () => {
    const user = userEvent.setup()
    renderForm()

    const promptInput = screen.getByPlaceholderText("Describe the task for Claude...")
    await user.type(screen.getByPlaceholderText("https://github.com/org/repo"), "https://github.com/org/repo")
    await user.type(promptInput, "Fix the login bug")

    await user.click(screen.getByRole("button", { name: "Submit Task" }))

    expect(promptInput).toHaveValue("")
  })

  it("includes repoBranch when provided", async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(screen.getByPlaceholderText("https://github.com/org/repo"), "https://github.com/org/repo")
    await user.type(screen.getByPlaceholderText("Describe the task for Claude..."), "Fix bug")
    await user.type(screen.getByPlaceholderText("main"), "feature/auth")

    await user.click(screen.getByRole("button", { name: "Submit Task" }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ repoBranch: "feature/auth" }),
    )
  })
})
