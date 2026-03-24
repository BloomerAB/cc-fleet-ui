import type {
  CreateTaskRequest,
  CreateTaskResponse,
  ListTasksResponse,
  GetTaskResponse,
  CancelTaskResponse,
} from "../types/index.js"
import { getToken } from "./auth.js"

const BASE_URL = "/api"

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

const api = {
  createTask: (data: CreateTaskRequest): Promise<CreateTaskResponse> =>
    request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listTasks: (page = 1, limit = 20): Promise<ListTasksResponse> =>
    request(`/tasks?page=${page}&limit=${limit}`),

  getTask: (id: string): Promise<GetTaskResponse> =>
    request(`/tasks/${id}`),

  cancelTask: (id: string): Promise<CancelTaskResponse> =>
    request(`/tasks/${id}/cancel`, { method: "POST" }),
}

export { api }
