"use client"

import { useState, useEffect } from "react"
import { UserCircle, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import logo from "../assets/Login_Page/fresco_logo_white.png"
import { endSession } from "../utils/sessionHandler"

function NavBar() {
  const [userRole, setUserRole] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("user_role")
    setUserRole(role)
  }, [])

  const handleLogout = () => {
    // Use the endSession function from sessionHandler
    endSession(navigate)
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
      ]
    } else if (userRole === "employee") {
      // For employees, show only relevant links
      return [
        { name: "SCHEDULE", href: "/employee/schedule" },
        { name: "PAYSLIP", href: "/payslip" },
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
          <div className="relative">
            <UserCircle className="h-8 w-8 cursor-pointer" onClick={() => setShowDropdown(!showDropdown)} />

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
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
