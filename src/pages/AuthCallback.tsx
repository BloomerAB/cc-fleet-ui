import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "../lib/api-client.js"
import { useAuth } from "../hooks/useAuth.js"

export function AuthCallback() {
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

    api
      .exchangeCode(code, state)
      .then((response) => {
        login(response.data.token, {
          id: response.data.user.id,
          login: response.data.user.login,
          avatarUrl: response.data.user.avatarUrl,
        })
        navigate("/", { replace: true })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Authentication failed")
      })
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
