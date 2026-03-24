import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/api-client.js"

const Settings = () => {
  const [hasKey, setHasKey] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [rules, setRules] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.data) {
          setHasKey(res.data.hasAnthropicKey)
          setRules(res.data.rules ?? "")
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    setSaving(true)
    setMessage(null)
    try {
      await api.updateSettings({ anthropicApiKey: apiKey.trim() })
      setHasKey(true)
      setApiKey("")
      setMessage({ type: "success", text: "API key saved." })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveKey = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await api.removeAnthropicKey()
      setHasKey(false)
      setMessage({ type: "success", text: "API key removed." })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to remove" })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await api.updateSettings({ rules })
      setMessage({ type: "success", text: "Rules saved." })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            {message.text}
          </div>
        )}

        {/* API Key */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Anthropic API Key</h2>

          {hasKey && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <span className="text-sm text-green-700">API key is configured</span>
              <button
                onClick={handleRemoveKey}
                disabled={saving}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}

          <form onSubmit={handleSaveKey} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {hasKey ? "Replace with a new key" : "Enter your Anthropic API key"}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save Key"}
            </button>
          </form>
        </div>

        {/* Rules (CLAUDE.md equivalent) */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-900">Rules</h2>
          <p className="mb-4 text-xs text-gray-500">
            Your personal CLAUDE.md — applied to all your tasks. Platform defaults are always included.
          </p>

          <form onSubmit={handleSaveRules} className="space-y-3">
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder={"# My Rules\n\n- Use TypeScript, not JavaScript\n- Always add tests\n- Prefer functional patterns"}
              rows={12}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save Rules"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export { Settings }
