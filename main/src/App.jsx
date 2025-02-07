import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'

import logo from './assets/Login_Page/fresco_logo_black.png'
import leaf_1 from './assets/Login_Page/leaf-1.png'
import leaf_2 from './assets/Login_Page/leaf-2.png'
import leaf_3 from './assets/Login_Page/leaf-3.png'
import AdminDashboardPage from './pages/Admin_Dashboard_Page'
import AdminEmployeePayrollPage from './pages/Admin_Employee_Payroll_Page'
import AdminEmployeePage from './pages/Admin_Employees_Page'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    id: '',
    password: ''
  })
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      // Sending the POST request to the API
      const response = await fetch("http://localhost:8000/api/v1/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send formData with id and password
      })

      const data = await response.json() // Parse the JSON response
      console.log(data)  // Log the response to check its structure

      if (response.ok) {

        // Check if response contains tokens and user info
        if (data.access && data.refresh) {
          // Store the tokens and user details in localStorage
          localStorage.setItem("access_token", data.access)
          localStorage.setItem("refresh_token", data.refresh)
          localStorage.setItem("user_id", data.user)
          localStorage.setItem("user_email", data.email)

          // Redirect to the dashboard
          navigate("/dashboard")
        } else {
          // If no tokens are returned, show an error
          setError("Login failed. Please check your credentials and try again.")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Login failed. Please try again.")
      }
    } catch (error) {
      setError("An error occurred. Please try again later.")
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div className="min-h-screen w-full relative bg-white p-4 sm:p-6 overflow-hidden">
      {/* Logo */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <img
          src={logo}
          alt="Fresco Logo"
          className="w-40 sm:w-60 object-contain"
        />
      </div>

      {/* Decorative Leaves */}
      <img
        src={leaf_1}
        alt="Decorative Leaf"
        className="absolute bottom-0 left-0 w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 max-w-xs opacity-70"
      />
      <img
        src={leaf_3}
        alt="Decorative Leaf"
        className="absolute top-0 right-0 w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 max-w-xs opacity-70"
      />
      <img
        src={leaf_2}
        alt="Decorative Leaf"
        className="absolute bottom-0 right-0 w-1/4 sm:w-1/5 md:w-1/6 lg:w-1/8 max-w-xs opacity-70"
      />

      {/* Login Form */}
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-[384px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-800 mb-6 sm:mb-10">Log In</h1>
          <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID</label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                            focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Log In
              </button>
              <div className="text-sm underline text-center">
                <a href="#" className="font-medium text-gray-600 hover:text-gray-900">
                  Forgot password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/employee" element={<AdminEmployeePage />} />
        <Route path="/payroll" element={<AdminEmployeePayrollPage />} />
      </Routes>
    </Router>
  )
}

export default App
