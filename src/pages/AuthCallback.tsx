import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "../lib/api-client.js"
import { useAuth } from "../hooks/useAuth.js"

const AUTH_TIMEOUT_MS = 10_000

const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      setError("Missing authorization code")
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
      setError("Authentication timed out. Please try again.")
    }, AUTH_TIMEOUT_MS)

    api
      .exchangeCode(code, state)
      .then((response) => {
        clearTimeout(timeout)
        if (controller.signal.aborted) return
        login(
          {
            id: response.data.user.id,
            login: response.data.user.login,
            avatarUrl: response.data.user.avatarUrl,
          },
          response.data.token,
        )
        navigate("/", { replace: true })
      })
      .catch((err) => {
        clearTimeout(timeout)
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Authentication failed")
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [searchParams, login, navigate])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <a href="/login" className="mt-4 text-blue-600 underline">
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Signing in...</p>
    </div>
  )
}

export { AuthCallback }
