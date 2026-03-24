import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { SessionOutput } from "./SessionOutput.js"
import type { DashboardOutputMessage } from "@bloomerab/claude-types"

const makeOutput = (overrides: Partial<DashboardOutputMessage> = {}): DashboardOutputMessage => ({
  type: "output",
  sessionId: "s1",
  text: "Hello from Claude",
  timestamp: new Date().toISOString(),
  ...overrides,
})

describe("SessionOutput", () => {
  it("shows waiting message when outputs is empty", () => {
    render(<SessionOutput outputs={[]} />)
    expect(screen.getByText("Waiting for output...")).toBeInTheDocument()
  })

  it("renders output text", () => {
    const outputs = [makeOutput({ text: "Running tests..." })]
    render(<SessionOutput outputs={outputs} />)
    expect(screen.getByText("Running tests...")).toBeInTheDocument()
  })

  it("renders toolName when present", () => {
    const outputs = [makeOutput({ toolName: "bash", text: "npm test" })]
    render(<SessionOutput outputs={outputs} />)
    expect(screen.getByText("[bash]")).toBeInTheDocument()
    expect(screen.getByText("npm test")).toBeInTheDocument()
  })

  it("does not render toolName bracket when toolName is absent", () => {
    const outputs = [makeOutput({ text: "Some output" })]
    render(<SessionOutput outputs={outputs} />)
    expect(screen.queryByText(/\[/)).not.toBeInTheDocument()
  })

  it("renders multiple outputs", () => {
    const outputs = [
      makeOutput({ text: "Line one" }),
      makeOutput({ text: "Line two" }),
      makeOutput({ text: "Line three" }),
    ]
    render(<SessionOutput outputs={outputs} />)
    expect(screen.getByText("Line one")).toBeInTheDocument()
    expect(screen.getByText("Line two")).toBeInTheDocument()
    expect(screen.getByText("Line three")).toBeInTheDocument()
  })

  it("does not show waiting message when there are outputs", () => {
    const outputs = [makeOutput()]
    render(<SessionOutput outputs={outputs} />)
    expect(screen.queryByText("Waiting for output...")).not.toBeInTheDocument()
  })
})
