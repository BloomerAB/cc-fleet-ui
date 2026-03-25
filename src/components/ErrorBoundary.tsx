import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"

interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

interface ErrorBoundaryState {
  readonly hasError: boolean
  readonly error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to external service in production
    void error
    void errorInfo
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8">
            <h2 className="mb-2 text-lg font-semibold text-gray-100">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-gray-400">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <pre className="mb-4 overflow-auto rounded-lg bg-red-900/30 border border-red-800 p-3 text-xs text-red-400">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
