import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "./ErrorBoundary.js"

// Suppress React error boundary console.error noise in test output
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalError
  vi.restoreAllMocks()
})

const ThrowingChild = ({ message }: { readonly message: string }) => {
  throw new Error(message)
}

const GoodChild = () => <p>Everything is fine</p>

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Everything is fine")).toBeInTheDocument()
  })

  it("renders default fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild message="Test explosion" />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    expect(screen.getByText("Test explosion")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Refresh Page" })).toBeInTheDocument()
  })

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingChild message="kaboom" />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Custom fallback")).toBeInTheDocument()
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument()
  })

  it("displays the error message in the default fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild message="Database connection failed" />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Database connection failed")).toBeInTheDocument()
  })
})
