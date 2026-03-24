import { useState } from "react"
import { z } from "zod"
import type { CreateTaskRequest } from "@bloomerab/claude-types"

interface TaskFormProps {
  readonly onSubmit: (data: CreateTaskRequest) => Promise<void>
  readonly submitting: boolean
}

const taskSchema = z.object({
  prompt: z.string().min(1, "Task description is required").max(10000, "Task description too long"),
  repoUrl: z.string().url("Must be a valid URL").regex(/^https?:\/\//, "Must be an HTTP(S) URL"),
  repoBranch: z.string().max(200, "Branch name too long").optional().or(z.literal("")),
  maxTurns: z.number().int("Must be a whole number").min(1, "Minimum 1 turn").max(200, "Maximum 200 turns"),
})

const TaskForm = ({ onSubmit, submitting }: TaskFormProps) => {
  const [prompt, setPrompt] = useState("")
  const [repoUrl, setRepoUrl] = useState("")
  const [repoBranch, setRepoBranch] = useState("")
  const [maxTurns, setMaxTurns] = useState(50)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors({})

    const result = taskSchema.safeParse({
      prompt,
      repoUrl,
      repoBranch: repoBranch || undefined,
      maxTurns,
    })

    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string") {
          errors[key] = issue.message
        }
      }
      setValidationErrors(errors)
      return
    }

    await onSubmit(result.data)
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
        {validationErrors["repoUrl"] && (
          <p className="mt-1 text-xs text-red-600">{validationErrors["repoUrl"]}</p>
        )}
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
        {validationErrors["repoBranch"] && (
          <p className="mt-1 text-xs text-red-600">{validationErrors["repoBranch"]}</p>
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
        disabled={submitting || !prompt || !repoUrl}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {submitting ? "Submitting..." : "Submit Task"}
      </button>
    </form>
  )
}

export { TaskForm }
