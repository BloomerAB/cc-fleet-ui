import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth.js"
import { ErrorBoundary } from "./components/ErrorBoundary.js"
import { Login } from "./pages/Login.js"
import { Dashboard } from "./pages/Dashboard.js"
import { TaskNew } from "./pages/TaskNew.js"
import { TaskDetail } from "./pages/TaskDetail.js"
import { Settings } from "./pages/Settings.js"

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
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
)

export { Router }
