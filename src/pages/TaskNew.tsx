import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import type { CreateTaskRequest } from "../types/index.js"
import { api } from "../lib/api-client.js"
import { TaskForm } from "../components/TaskForm.js"

const TaskNew = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CreateTaskRequest) => {
    try {
      setSubmitting(true)
      setError(null)
      const response = await api.createTask(data)
      if (response.success && response.data) {
        navigate(`/tasks/${response.data.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <Link to="/" className="text-gray-500 hover:text-gray-300">
            &larr; Back
          </Link>
          <h1 className="text-lg font-semibold text-gray-100">New Task</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <TaskForm onSubmit={handleSubmit} submitting={submitting} />
        </div>
      </main>
    </div>
  )
}

export { TaskNew }
