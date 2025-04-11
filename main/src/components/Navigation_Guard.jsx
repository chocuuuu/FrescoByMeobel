"use client"

import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

function NavigationGuard() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Function to handle navigation attempts
    const handleNavigation = () => {
      const token = sessionStorage.getItem("access_token")
      const role = sessionStorage.getItem("user_role")
      const currentPath = window.location.pathname

      // Public routes that don't require authentication
      const publicRoutes = ["/", "/forgot-password", "/reset-password", "/force-logout"]
      const isPublicRoute = publicRoutes.some(
        (route) => currentPath === route || currentPath.startsWith("/reset-password/"),
      )

      // If logged in and trying to access public routes, redirect to dashboard
      if (token && isPublicRoute && currentPath !== "/force-logout") {
        if (role === "admin" || role === "owner") {
          navigate("/dashboard", { replace: true })
        } else if (role === "employee") {
          navigate("/employee/schedule", { replace: true })
        }
        return
      }

      // If not logged in and trying to access protected routes, redirect to login
      if (!token && !isPublicRoute) {
        navigate("/", { replace: true })
        return
      }
    }

    // Call the function on mount and when location changes
    handleNavigation()

    // Set up event listeners for navigation attempts
    const handleBeforeUnload = () => {
      // This is just a hook for detecting navigation attempts
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Disable back button for authenticated users
    const handlePopState = () => {
      const token = sessionStorage.getItem("access_token")
      if (token) {
        window.history.forward()
      }
    }

    window.addEventListener("popstate", handlePopState)

    // Check URL changes periodically
    const interval = setInterval(() => {
      handleNavigation()
    }, 100)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      clearInterval(interval)
    }
  }, [navigate, location])

  return null
}

export default NavigationGuard
