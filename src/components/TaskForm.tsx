import { useState } from "react"
import { z } from "zod"
import type { CreateTaskRequest } from "@bloomerab/claude-types"

interface TaskFormProps {
  readonly onSubmit: (data: CreateTaskRequest) => Promise<void>
  readonly submitting: boolean
}

const repoSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  branch: z.string().max(200).optional().or(z.literal("")),
})

const taskSchema = z.object({
  prompt: z.string().min(1, "Task description is required").max(10000, "Task description too long"),
  repos: z.array(repoSchema).min(1, "At least one repository is required").max(10),
  maxTurns: z.number().int("Must be a whole number").min(1, "Minimum 1 turn").max(200, "Maximum 200 turns"),
})

interface RepoInput {
  url: string
  branch: string
}

const TaskForm = ({ onSubmit, submitting }: TaskFormProps) => {
  const [prompt, setPrompt] = useState("")
  const [repos, setRepos] = useState<RepoInput[]>([{ url: "", branch: "" }])
  const [maxTurns, setMaxTurns] = useState(50)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors({})

    const parsed = taskSchema.safeParse({
      prompt,
      repos: repos.map((r) => ({
        url: r.url,
        branch: r.branch || undefined,
      })),
      maxTurns,
    })

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".")
        errors[key] = issue.message
      }
      setValidationErrors(errors)
      return
    }

    await onSubmit(parsed.data)
    setPrompt("")
    setRepos([{ url: "", branch: "" }])
  }

  const hasRepoUrl = repos.some((r) => r.url.length > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Repositories</label>
          {repos.length < 10 && (
            <button type="button" onClick={addRepo} className="text-xs text-blue-600 hover:text-blue-800">
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
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={repo.branch}
              onChange={(e) => updateRepo(i, "branch", e.target.value)}
              placeholder="branch"
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
        {validationErrors["repos"] && (
          <p className="mt-1 text-xs text-red-600">{validationErrors["repos"]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Task Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the task for Claude..."
          required
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {validationErrors["prompt"] && (
          <p className="mt-1 text-xs text-red-600">{validationErrors["prompt"]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Max Turns
        </label>
        <input
          type="number"
          value={maxTurns}
          onChange={(e) => setMaxTurns(Number(e.target.value))}
          min={1}
          max={200}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {validationErrors["maxTurns"] && (
          <p className="mt-1 text-xs text-red-600">{validationErrors["maxTurns"]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || !prompt || !hasRepoUrl}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {submitting ? "Submitting..." : "Submit Task"}
      </button>
    </form>
  )
}

export { TaskForm }
