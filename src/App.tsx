import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginForm from './components/auth/LoginForm'
import SignupForm from './components/auth/SignupForm'
import ForgotPasswordForm from './components/auth/ForgotPasswordForm'
import Dashboard from './pages/Dashboard'
import Bills from './pages/Bills'
import Expenses from './pages/Expenses'
import Assets from './pages/Assets'
import Employees from './pages/Employees'
import Attendance from './pages/Attendance'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>

            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/forgot-password" element={<ForgotPasswordForm />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bills"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Bills />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Expenses />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Assets />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Employees />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Attendance />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App