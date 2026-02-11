import { useState } from "react"
import type { CreateTaskRequest } from "@bloomer-ab/claude-types"

interface TaskFormProps {
  readonly onSubmit: (data: CreateTaskRequest) => Promise<void>
  readonly submitting: boolean
}

export function TaskForm({ onSubmit, submitting }: TaskFormProps) {
  const [prompt, setPrompt] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [repoBranch, setRepoBranch] = useState("")
  const [maxTurns, setMaxTurns] = useState(50)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      prompt,
      repoUrl,
      repoBranch: repoBranch || undefined,
      maxTurns,
    })
    setPrompt("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Repository URL
        </label>
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Branch (optional)
        </label>
        <input
          type="text"
          value={repoBranch}
          onChange={(e) => setRepoBranch(e.target.value)}
          placeholder="main"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
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
      </div>

      <button
        type="submit"
        disabled={submitting || !prompt || !repoUrl}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {submitting ? "Submitting..." : "Submit Task"}
      </button>
    </form>
  )
}
