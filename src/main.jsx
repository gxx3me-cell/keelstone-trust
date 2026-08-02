import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { I18nProvider } from './i18n'
import ErrorPage, { ErrorBoundary } from './components/ErrorPage'
import Landing from './pages/Lumen'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

// Every route gets an errorElement. Without one, React Router falls back to its
// built-in page — a stack trace plus a note telling the developer to add an
// errorElement — which is the last thing an investor should see when a balance
// screen fails.
const routes = [
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/verify-email', element: <VerifyEmail /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/admin', element: <AdminDashboard /> },
  { path: '/terms', element: <Terms /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '*', element: <NotFound /> },
]

const router = createBrowserRouter(
  routes.map((r) => ({ ...r, errorElement: <ErrorPage /> })),
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Catches anything thrown above the routes — a provider, or the router
        itself — which errorElement cannot reach. */}
    <ErrorBoundary>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
