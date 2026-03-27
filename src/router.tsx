import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./hooks/useAuth.js"
import { ErrorBoundary } from "./components/ErrorBoundary.js"
import { Login } from "./pages/Login.js"
import { TaskNew } from "./pages/TaskNew.js"
import { TaskDetail } from "./pages/TaskDetail.js"
import { Settings } from "./pages/Settings.js"
import { AppLayout } from "./layouts/AppLayout.js"

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
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="tasks/new" element={<TaskNew />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
)

export { Router }
