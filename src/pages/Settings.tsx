import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/api-client.js"

const Settings = () => {
  const [authMode, setAuthMode] = useState<"apiKey" | "subscription">("apiKey")
  const [hasKey, setHasKey] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [rules, setRules] = useState("")
  const [claudeSettings, setClaudeSettings] = useState("")
  const [hasKubeconfig, setHasKubeconfig] = useState(false)
  const [kubeconfig, setKubeconfig] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    api.getSettings()
      .then((res) => {
        if (res.success && res.data) {
          setAuthMode(res.data.authMode ?? "apiKey")
          setHasKey(res.data.hasAnthropicKey)
          setRules(res.data.rules ?? "")
          setClaudeSettings(res.data.claudeSettings ?? "")
          setHasKubeconfig(res.data.hasKubeconfig ?? false)
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
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <Link to="/" className="text-gray-500 hover:text-gray-300">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-gray-100">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-green-900/30 border border-green-800 text-green-400" : "bg-red-900/30 border border-red-800 text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        {/* MCP Setup */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-100">Local CLI Integration</h2>
          <p className="mb-4 text-xs text-gray-500">
            Sync sessions between your local Claude Code and Fleet. Push sessions to Fleet or pull them locally.
          </p>

          <div className="space-y-4">
            {/* Step 1: Generate token */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-300">1. Generate an API token</p>
              <button
                onClick={async () => {
                  setSaving(true)
                  setMessage(null)
                  try {
                    const response = await fetch("/api/settings/api-token", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${localStorage.getItem("claude_dashboard_token")}` },
                    })
                    const data = await response.json() as { success: boolean; data?: { token: string } }
                    if (data.success && data.data) {
                      await navigator.clipboard.writeText(data.data.token)
                      setMessage({ type: "success", text: "API token copied to clipboard (valid 1 year)" })
                    }
                  } catch (err) {
                    setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed" })
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark disabled:bg-gray-700 disabled:text-gray-500"
              >
                Generate & Copy Token
              </button>
            </div>

            {/* Step 2: Install */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-300">2. Install the MCP server</p>
              <pre className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs text-gray-300 overflow-x-auto">
{`npx @bloomerab/cc-fleet-mcp`}
              </pre>
              <p className="mt-1 text-xs text-gray-500">Or clone and build from the cc-fleet-manager repo (mcp/ directory)</p>
            </div>

            {/* Step 3: Add to Claude Code */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-300">3. Add to ~/.claude/settings.json</p>
              <pre className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs text-gray-300 overflow-x-auto">
{`{
  "mcpServers": {
    "cc-fleet": {
      "command": "npx",
      "args": ["@bloomerab/cc-fleet-mcp"]
    }
  }
}`}
              </pre>
            </div>

            {/* Step 4: Configure in Claude */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-300">4. In Claude Code, say:</p>
              <pre className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-xs text-claude overflow-x-auto">
{`"Configure fleet with URL ${window.location.origin} and token <paste>"`}
              </pre>
            </div>

            {/* Usage */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-300">Then use naturally:</p>
              <div className="space-y-1 text-xs text-gray-400">
                <p><span className="text-claude">"Push this session to fleet"</span> — uploads your current session</p>
                <p><span className="text-claude">"Pull session X from fleet"</span> — downloads a Fleet session locally</p>
                <p><span className="text-claude">"List fleet sessions"</span> — shows all your Fleet sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth mode info */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
          <p className="text-sm text-gray-300">
            Auth mode: <span className="font-medium">{authMode === "subscription" ? "Pro/Max Subscription" : "API Key"}</span>
          </p>
          {authMode === "subscription" && (
            <p className="mt-1 text-xs text-gray-500">Using Claude Pro/Max subscription. API keys are not needed.</p>
          )}
        </div>

        {/* API Key — only shown in apiKey mode */}
        {authMode === "apiKey" && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-100">Anthropic API Key</h2>

          {hasKey && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-green-800 bg-green-900/30 px-4 py-3">
              <span className="text-sm text-green-400">API key is configured</span>
              <button
                onClick={handleRemoveKey}
                disabled={saving}
                className="text-xs text-red-400 hover:text-red-300"
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
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-claude focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark disabled:bg-gray-700 disabled:text-gray-500"
            >
              {saving ? "Saving..." : "Save Key"}
            </button>
          </form>
        </div>
        )}

        {/* Rules (CLAUDE.md equivalent) */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-100">Rules</h2>
          <p className="mb-4 text-xs text-gray-500">
            Your personal CLAUDE.md — applied to all your tasks. Platform defaults are always included.
          </p>

          <form onSubmit={handleSaveRules} className="space-y-3">
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder={"# My Rules\n\n- Use TypeScript, not JavaScript\n- Always add tests\n- Prefer functional patterns"}
              rows={12}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-500 focus:border-claude focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark disabled:bg-gray-700 disabled:text-gray-500"
            >
              {saving ? "Saving..." : "Save Rules"}
            </button>
          </form>
        </div>

        {/* Claude Settings (settings.json) */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-100">Claude Settings</h2>
          <p className="mb-4 text-xs text-gray-500">
            Override .claude/settings.json for your sessions. Default tool permissions are always included.
            Use JSON format.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault()
            setSaving(true)
            setMessage(null)
            try {
              if (claudeSettings.trim()) {
                JSON.parse(claudeSettings) // validate JSON
              }
              await api.updateSettings({ claudeSettings })
              setMessage({ type: "success", text: "Claude settings saved." })
            } catch (err) {
              setMessage({
                type: "error",
                text: err instanceof SyntaxError ? "Invalid JSON" : (err instanceof Error ? err.message : "Failed to save"),
              })
            } finally {
              setSaving(false)
            }
          }} className="space-y-3">
            <textarea
              value={claudeSettings}
              onChange={(e) => setClaudeSettings(e.target.value)}
              placeholder={'{\n  "permissions": {\n    "allow": ["mcp__my-server__*"]\n  }\n}'}
              rows={8}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-500 focus:border-claude focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark disabled:bg-gray-700 disabled:text-gray-500"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>

        {/* Kubeconfig */}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-100">Kubeconfig</h2>
          <p className="mb-4 text-xs text-gray-500">
            Provide a kubeconfig for kubectl access in your sessions. Written to ~/.kube/config.
          </p>

          {hasKubeconfig && !kubeconfig && (
            <div className="mb-4 flex items-center justify-between rounded-lg border border-green-800 bg-green-900/30 px-4 py-3">
              <span className="text-sm text-green-400">Kubeconfig is configured</span>
              <button
                onClick={async () => {
                  setSaving(true)
                  setMessage(null)
                  try {
                    await api.updateSettings({ kubeconfig: "" })
                    setHasKubeconfig(false)
                    setMessage({ type: "success", text: "Kubeconfig removed." })
                  } catch (err) {
                    setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to remove" })
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={saving}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!kubeconfig.trim()) return
            setSaving(true)
            setMessage(null)
            try {
              await api.updateSettings({ kubeconfig: kubeconfig.trim() })
              setHasKubeconfig(true)
              setKubeconfig("")
              setMessage({ type: "success", text: "Kubeconfig saved." })
            } catch (err) {
              setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" })
            } finally {
              setSaving(false)
            }
          }} className="space-y-3">
            <textarea
              value={kubeconfig}
              onChange={(e) => setKubeconfig(e.target.value)}
              placeholder={"apiVersion: v1\nkind: Config\nclusters:\n- cluster:\n    server: https://..."}
              rows={8}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-gray-100 placeholder-gray-500 focus:border-claude focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving || !kubeconfig.trim()}
              className="rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark disabled:bg-gray-700 disabled:text-gray-500"
            >
              {saving ? "Saving..." : "Save Kubeconfig"}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export { Settings }
