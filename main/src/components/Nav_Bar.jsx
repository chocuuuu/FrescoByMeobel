import React from 'react'
import { UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../assets/Login_Page/fresco_logo_white.png'

function NavBar() {
  return (
    <nav className="bg-gray-800 text-white p-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard">
          <img src={logo} alt="Fresco Logo" className="h-16 w-auto" />
        </Link>
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="font-medium hover:text-gray-300">DASHBOARD</Link>
          <Link to="/employee" className="font-medium hover:text-gray-300">EMPLOYEE</Link>
          <Link to="/attendance" className="font-medium hover:text-gray-300">ATTENDANCE</Link>
          <Link to="/payroll" className="font-medium hover:text-gray-300">PAYROLL</Link>
          <Link to="/activity-logs" className="font-medium hover:text-gray-300">LOGS</Link>
          <UserCircle className="h-8 w-8 cursor-pointer" />
        </div>
      </div>
    </nav>
  )
}

export default NavBar

