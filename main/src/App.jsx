"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"

import LoginPage from "./pages/Login_Page"
import ForgotPasswordPage from "./pages/Forgot_Password_Page"
import ResetPasswordPage from "./pages/Reset_Password_Page"
import AdminDashboardPage from "./pages/Admin_Dashboard_Page"
import AdminEmployeePayrollPage from "./pages/Admin_Employee_Payroll_Page"
import AdminEmployeePage from "./pages/Admin_Employees_Page"
import PayslipPage from "./pages/Payslip_Page"
import AdminEmployeeEditSchedulePage from "./pages/Admin_Employee_Edit_Schedule_Page"
import AdminEmployeeAttendancePage from "./pages/Admin_Employee_Attendance_Page"
import AdminMasterCalendarPage from "./pages/Admin_Master_Calendar_Page"
import EmployeeSchedulePage from "./pages/Employee_Schedule_Page"
import ActivityLogPage from "./pages/Admin_Activity_Logs_Page"
import ForceLogout from "./pages/ForceLogout"
import NavigationGuard from "./components/Navigation_Guard"

// Protected route component
function ProtectedRoute({ children, allowedRoles }) {
  const role = sessionStorage.getItem("user_role")
  const isAuthenticated = !!sessionStorage.getItem("access_token")

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "employee") {
      return <Navigate to="/employee/schedule" replace />
    } else if (role === "admin" || role === "owner") {
      return <Navigate to="/dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  return children
}

function App() {
  return (
    <Router>
      <NavigationGuard />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/force-logout" element={<ForceLogout />} />

        {/* Admin/Owner routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeePayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/schedule/:employeeId"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeeEditSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminEmployeeAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-calendar"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <AdminMasterCalendarPage />
            </ProtectedRoute>
          }
        />

        {/* Employee routes */}
        <Route
          path="/employee/schedule"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payslip"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner", "employee"]}>
              <PayslipPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity-logs"
          element={
            <ProtectedRoute allowedRoles={["admin", "owner"]}>
              <ActivityLogPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to appropriate dashboard or login */}
        <Route
          path="*"
          element={
            sessionStorage.getItem("access_token") ? (
              sessionStorage.getItem("user_role") === "employee" ? (
                <Navigate to="/employee/schedule" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App
