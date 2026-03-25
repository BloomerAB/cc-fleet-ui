import { useEffect, useState } from "react"
import type { CreateTaskRequest, RepoSourceMode, GitHubOrg, GitHubRepo, PermissionMode, ModelChoice } from "../types/index.js"
import { api } from "../lib/api-client.js"

interface TaskFormProps {
  readonly onSubmit: (data: CreateTaskRequest) => Promise<void>
  readonly submitting: boolean
}

interface RepoInput {
  url: string
  branch: string
}

const MODE_LABELS: Record<RepoSourceMode, string> = {
  direct: "Direct URLs",
  org: "Organization + Pattern",
  discovery: "Claude Discovers",
}

const MODE_DESCRIPTIONS: Record<RepoSourceMode, string> = {
  direct: "Specify exact repo URLs to clone",
  org: "Select an org, optionally filter by glob pattern. Matching repos are pre-cloned.",
  discovery: "Claude sees all repos in the org and decides which to clone based on the task.",
}

const TaskForm = ({ onSubmit, submitting }: TaskFormProps) => {
  const [mode, setMode] = useState<RepoSourceMode>("discovery")
  const [prompt, setPrompt] = useState("")
  const [maxTurns, setMaxTurns] = useState(200)

  // Direct mode state
  const [repos, setRepos] = useState<RepoInput[]>([{ url: "", branch: "" }])

  // Org/Discovery mode state
  const [orgs, setOrgs] = useState<readonly GitHubOrg[]>([])
  const [orgsLoading, setOrgsLoading] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState("")
  const [pattern, setPattern] = useState("")
  const [hint, setHint] = useState("")
  const [taskRules, setTaskRules] = useState("")
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("acceptEdits")
  const [model, setModel] = useState<ModelChoice>("sonnet")

  // Preview for org mode
  const [previewRepos, setPreviewRepos] = useState<readonly GitHubRepo[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // Fetch orgs on mount
  useEffect(() => {
    const fetchOrgs = async () => {
      setOrgsLoading(true)
      try {
        const response = await api.listOrgs()
        if (response.success && response.data) {
          setOrgs(response.data)
          if (response.data.length > 0) {
            setSelectedOrg(response.data[0].login)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orgs")
      } finally {
        setOrgsLoading(false)
      }
    }
    fetchOrgs()
  }, [])

  // Fetch repo preview when org/pattern changes (org mode only)
  useEffect(() => {
    if (mode !== "org" || !selectedOrg) {
      setPreviewRepos([])
      return
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const response = await api.listRepos(selectedOrg, pattern || undefined)
        if (response.success && response.data) {
          setPreviewRepos(response.data)
        }
      } catch {
        setPreviewRepos([])
      } finally {
        setPreviewLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [mode, selectedOrg, pattern])

  const updateRepo = (index: number, field: keyof RepoInput, value: string) => {
    setRepos((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const addRepo = () => {
    if (repos.length < 10) {
      setRepos((prev) => [...prev, { url: "", branch: "" }])
    }
  }

  const removeRepo = (index: number) => {
    if (repos.length > 1) {
      setRepos((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const buildRepoSource = (): CreateTaskRequest["repoSource"] => {
    switch (mode) {
      case "direct":
        return {
          mode: "direct",
          repos: repos
            .filter((r) => r.url)
            .map((r) => ({ url: r.url, ...(r.branch ? { branch: r.branch } : {}) })),
        }
      case "org":
        return {
          mode: "org",
          org: selectedOrg,
          ...(pattern ? { pattern } : {}),
        }
      case "discovery":
        return {
          mode: "discovery",
          org: selectedOrg,
          ...(hint ? { hint } : {}),
        }
    }
  }

  const isValid = (): boolean => {
    if (!prompt.trim()) return false
    if (mode === "direct") return repos.some((r) => r.url.length > 0)
    return selectedOrg.length > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const repoSource = buildRepoSource()
    if (mode === "direct" && repoSource.mode === "direct" && repoSource.repos.length === 0) {
      setError("At least one repository URL is required")
      return
    }

    try {
      await onSubmit({
        prompt,
        repoSource,
        ...(taskRules.trim() ? { rules: taskRules.trim() } : {}),
        permissionMode,
        model,
        maxTurns,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Mode selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Repo Source</label>
        <div className="grid grid-cols-3 gap-2">
          {(["discovery", "org", "direct"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                mode === m
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">{MODE_DESCRIPTIONS[mode]}</p>
      </div>

      {/* Direct mode: repo URLs */}
      {mode === "direct" && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Repositories</label>
            {repos.length < 10 && (
              <button type="button" onClick={addRepo} className="text-xs text-orange-600 hover:text-orange-800">
                + Add repo
              </button>
            )}
          </div>
          {repos.map((repo, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                type="url"
                value={repo.url}
                onChange={(e) => updateRepo(i, "url", e.target.value)}
                placeholder="https://github.com/org/repo"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
              <input
                type="text"
                value={repo.branch}
                onChange={(e) => updateRepo(i, "branch", e.target.value)}
                placeholder="branch"
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
              {repos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRepo(i)}
                  className="px-2 text-sm text-red-500 hover:text-red-700"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Org/Discovery mode: org selector */}
      {mode !== "direct" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Organization</label>
          {orgsLoading ? (
            <div className="py-2 text-sm text-gray-500">Loading organizations...</div>
          ) : (
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
            >
              {orgs.map((org) => (
                <option key={org.login} value={org.login}>
                  {org.login}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Org mode: pattern filter + preview */}
      {mode === "org" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Pattern filter <span className="text-gray-400">(optional glob)</span>
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="e.g. service-* or *-api"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
          {previewLoading && <p className="mt-1 text-xs text-gray-500">Loading repos...</p>}
          {!previewLoading && previewRepos.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
              <p className="mb-1 text-xs font-medium text-gray-500">
                {previewRepos.length} repo{previewRepos.length !== 1 ? "s" : ""} will be cloned:
              </p>
              {previewRepos.map((repo) => (
                <div key={repo.name} className="flex items-center gap-2 py-0.5 text-xs">
                  <span className="font-mono text-gray-700">{repo.name}</span>
                  {repo.language && (
                    <span className="text-gray-400">{repo.language}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Discovery mode: hint */}
      {mode === "discovery" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Hint for Claude <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. focus on the backend services, or repos with Terraform"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
          />
        </div>
      )}

      {/* Task prompt */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Task Description</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the task for Claude..."
          required
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Task-specific rules */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Task Rules <span className="text-gray-400">(optional — added to your global rules)</span>
        </label>
        <textarea
          value={taskRules}
          onChange={(e) => setTaskRules(e.target.value)}
          placeholder="e.g. Use Go for new services, target Go 1.24"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Permission mode + Model */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Permission Mode</label>
          <div className="space-y-1">
            {([
              ["plan", "Plan Only", "Read-only, safest"],
              ["acceptEdits", "Accept Edits", "Auto-approve file edits"],
              ["bypassPermissions", "Full Auto", "No permission checks"],
            ] as const).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPermissionMode(value)}
                className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm transition-colors ${
                  permissionMode === value
                    ? value === "bypassPermissions"
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="ml-1 text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Model</label>
          <div className="space-y-1">
            {([
              ["sonnet", "Sonnet", "Fast, default"],
              ["opus", "Opus", "Deep reasoning"],
            ] as const).map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                onClick={() => setModel(value)}
                className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm transition-colors ${
                  model === value
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="ml-1 text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Max turns */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Max Turns <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="number"
          value={maxTurns}
          onChange={(e) => setMaxTurns(Number(e.target.value))}
          min={1}
          max={500}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !isValid()}
        className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-400"
      >
        {submitting ? "Submitting..." : "Submit Task"}
      </button>
    </form>
  )
}

export { TaskForm }
