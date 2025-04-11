"use client"

import { useState, useEffect, useRef } from "react"
import { UserCircle, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import logo from "../assets/Login_Page/fresco_logo_white.png"

function NavBar() {
  const [userRole, setUserRole] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("user_role")
    setUserRole(role)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownRef])

  // This is the updated logout function
  const handleLogout = () => {
    // Clear all session storage
    sessionStorage.clear()

    // Clear any localStorage items related to authentication if you have any
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("userRole")
    // Add any other auth-related items you might be storing

    // Redirect to login page and replace the history (prevents back button issues)
    navigate("/login", { replace: true })
  }

  // Define navigation links based on user role
  const getNavLinks = () => {
    if (userRole === "admin" || userRole === "owner" || !userRole) {
      // For admin/owner or when role is not set yet, show all admin links
      return [
        { name: "DASHBOARD", href: "/dashboard" },
        { name: "EMPLOYEE", href: "/employee" },
        { name: "ATTENDANCE", href: "/attendance" },
        { name: "PAYROLL", href: "/payroll" },
        { name: "MASTER CALENDAR", href: "/master-calendar" },
        { name: "LOGS", href: "/activity-logs" },
      ]
    } else if (userRole === "employee") {
      // For employees, show only relevant links
      return [
        { name: "SCHEDULE", href: "/employee/schedule" },
        { name: "PAYSLIP", href: "/employee-payslip/:userId" },
      ]
    }

    // Default fallback
    return []
  }

  const navLinks = getNavLinks()

  return (
    <nav className="bg-gray-800 text-white p-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={userRole === "employee" ? "/employee/schedule" : "/dashboard"}>
          <img src={logo || "/placeholder.svg"} alt="Fresco Logo" className="h-16 w-auto" />
        </Link>
        <div className="flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.href} className="font-medium hover:text-gray-300">
              {link.name}
            </Link>
          ))}
          <div className="relative" ref={dropdownRef}>
            <UserCircle
              className="h-8 w-8 cursor-pointer hover:text-gray-300 transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
            />

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
                >
                  <LogOut className="h-4 w-4 mr-2 text-red-500" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
