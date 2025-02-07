"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"

function AdminEmployeePage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      setError(null)

      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch("http://localhost:8000/api/v1/employees/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()
        console.log(data) // Log the response to check its structure

        if (response.ok) {
          if (Array.isArray(data)) {
            setEmployees(data)
          } else {
            setError("Unexpected data format received from the server.")
          }
        } else {
          setError(data.message || "Failed to fetch employee data. Please try again.")
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("An error occurred while fetching employee data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const getYearFromDate = (dateString) => {
    return new Date(dateString).getFullYear()
  }

  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.employment_info.first_name} ${employee.employment_info.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "active" ? employee.employment_info.active : !employee.employment_info.active
    return matchesSearch && matchesTab
  })

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-8">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="space-x-2">
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === "active" ? "bg-[#5C7346] text-white" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => setActiveTab("active")}
              >
                ACTIVE
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === "inactive" ? "bg-[#5C7346] text-white" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => setActiveTab("inactive")}
              >
                INACTIVE
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346]"
              />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-white mb-4">Employees</h2>

          {/* Employee Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">NAME</th>
                  <th className="py-3 px-4">YEAR EMPLOYED</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/10">
                    <td className="py-3 px-4">{employee.employment_info.employee_number}</td>
                    <td className="py-3 px-4">
                      {`${employee.employment_info.first_name} ${employee.employment_info.last_name}`}
                    </td>
                    <td className="py-3 px-4">{getYearFromDate(employee.employment_info.hire_date)}</td>
                    <td className="py-3 px-4">{employee.employment_info.status}</td>
                    <td className="py-3 px-4">
                      <div className="space-x-2">
                        <button className="bg-[#5C7346] text-white px-3 py-1 rounded-md hover:bg-[#4a5c38] transition-colors">
                          Delete
                        </button>
                        <button className="bg-[#5C7346] text-white px-3 py-1 rounded-md hover:bg-[#4a5c38] transition-colors">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="flex justify-between items-center mt-4">
            <button className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors">
              Add Account
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors"
              >
                Previous
              </button>
              <button className="bg-white text-[#5C7346] px-4 py-2 rounded-md">{currentPage}</button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEmployeePage