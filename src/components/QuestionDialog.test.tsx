import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QuestionDialog } from "./QuestionDialog.js"
import type { Question } from "@bloomerab/claude-types"

afterEach(() => {
  vi.restoreAllMocks()
})

const textQuestion: Question = {
  id: "q1",
  question: "What branch should I push to?",
}

const optionQuestion: Question = {
  id: "q2",
  question: "Which approach do you prefer?",
  options: [
    { label: "Option A", value: "a" },
    { label: "Option B", value: "b" },
  ],
}

const questionWithDefault: Question = {
  id: "q3",
  question: "Enter your name",
  defaultAnswer: "Malin",
}

describe("QuestionDialog", () => {
  it("renders the heading", () => {
    render(<QuestionDialog questions={[textQuestion]} onAnswer={vi.fn()} />)
    expect(screen.getByText("Claude needs your input")).toBeInTheDocument()
  })

  it("renders a text question with an input field", () => {
    render(<QuestionDialog questions={[textQuestion]} onAnswer={vi.fn()} />)
    expect(screen.getByText("What branch should I push to?")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Type your answer...")).toBeInTheDocument()
  })

  it("renders an option question with radio buttons", () => {
    render(<QuestionDialog questions={[optionQuestion]} onAnswer={vi.fn()} />)
    expect(screen.getByText("Which approach do you prefer?")).toBeInTheDocument()
    expect(screen.getByText("Option A")).toBeInTheDocument()
    expect(screen.getByText("Option B")).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(2)
  })

  it("shows default answer in text input when provided", () => {
    render(<QuestionDialog questions={[questionWithDefault]} onAnswer={vi.fn()} />)
    expect(screen.getByDisplayValue("Malin")).toBeInTheDocument()
  })

  it("calls onAnswer with text input value on submit", async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionDialog questions={[textQuestion]} onAnswer={onAnswer} />)

    await user.type(screen.getByPlaceholderText("Type your answer..."), "main")
    await user.click(screen.getByRole("button", { name: "Submit Answer" }))

    expect(onAnswer).toHaveBeenCalledWith({ q1: "main" })
  })

  it("calls onAnswer with selected radio option on submit", async () => {
    const user = userEvent.setup()
    const onAnswer = vi.fn()
    render(<QuestionDialog questions={[optionQuestion]} onAnswer={onAnswer} />)

    await user.click(screen.getByText("Option B"))
    await user.click(screen.getByRole("button", { name: "Submit Answer" }))

    expect(onAnswer).toHaveBeenCalledWith({ q2: "b" })
  })

  it("renders multiple questions", () => {
    render(<QuestionDialog questions={[textQuestion, optionQuestion]} onAnswer={vi.fn()} />)
    expect(screen.getByText("What branch should I push to?")).toBeInTheDocument()
    expect(screen.getByText("Which approach do you prefer?")).toBeInTheDocument()
  })

  it("renders submit button", () => {
    render(<QuestionDialog questions={[textQuestion]} onAnswer={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Submit Answer" })).toBeInTheDocument()
  })
})
