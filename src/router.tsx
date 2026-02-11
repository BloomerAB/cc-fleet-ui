import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth.js"
import { ErrorBoundary } from "./components/ErrorBoundary.js"
import { Login } from "./pages/Login.js"
import { AuthCallback } from "./pages/AuthCallback.js"
import { Dashboard } from "./pages/Dashboard.js"
import { TaskNew } from "./pages/TaskNew.js"
import { TaskDetail } from "./pages/TaskDetail.js"

const ProtectedRoute = ({ children }: { readonly children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const Router = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/new"
          element={
            <ProtectedRoute>
              <TaskNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
)

export { Router }
