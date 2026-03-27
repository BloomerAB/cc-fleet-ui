import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-100">New Task</h2>
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
          <TaskForm onSubmit={handleSubmit} submitting={submitting} />
        </div>
      </div>
    </div>
  )
}

export { TaskNew }
