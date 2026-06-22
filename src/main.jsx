import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Lumen from './pages/Lumen'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'

const router = createBrowserRouter([
  { path: '/', element: <Lumen /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/dashboard', element: <Dashboard /> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
