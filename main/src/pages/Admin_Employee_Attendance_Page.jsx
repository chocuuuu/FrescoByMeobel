"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar.jsx"
import { API_BASE_URL } from "../config/api"

function AdminEmployeeAttendancePage() {
  const [attendanceData, setAttendanceData] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], // First day of current month
    endDate: new Date().toISOString().split("T")[0], // Today
  })
  const recordsPerPage = 10

  // Fetch employees for the dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/employment-info/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch employees")
        }

        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("An error occurred while fetching employees. Please try again later.")
      }
    }

    fetchEmployees()
  }, [])

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true)
      setError(null)
      try {
        const accessToken = localStorage.getItem("access_token")

        // Build the URL with query parameters
        let url = `${API_BASE_URL}/attendance/`
        const params = new URLSearchParams()

        if (selectedEmployee) {
          params.append("user", selectedEmployee)
        }

        if (dateRange.startDate) {
          params.append("date_after", dateRange.startDate)
        }

        if (dateRange.endDate) {
          params.append("date_before", dateRange.endDate)
        }

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch attendance data")
        }

        const data = await response.json()

        // Process the attendance data to include employee names
        const processedData = await enrichAttendanceData(data)
        setAttendanceData(processedData)
      } catch (error) {
        console.error("Error fetching attendance data:", error)
        setError("An error occurred while fetching attendance data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [selectedEmployee, dateRange])

  // Enrich attendance data with employee names
  const enrichAttendanceData = async (attendanceRecords) => {
    // If no employees or attendance records, return empty array
    if (!employees.length || !attendanceRecords.length) {
      return attendanceRecords
    }

    console.log("Employees data:", employees)
    console.log("Attendance records:", attendanceRecords)

    // Create a map of user IDs to employee information
    const employeeMap = new Map()

    employees.forEach((employee) => {
      // Find the user ID associated with this employee
      const userId = employee.user?.id
      if (userId) {
        employeeMap.set(userId, {
          name: `${employee.first_name} ${employee.last_name}`,
          employeeNumber: employee.employee_number,
        })
        console.log(`Mapped user ID ${userId} to employee ${employee.first_name} ${employee.last_name}`)
      }
    })

    console.log("Employee map:", Array.from(employeeMap.entries()))

    // Enrich attendance records with employee names
    const enrichedRecords = attendanceRecords.map((record) => {
      const userId = record.user
      console.log(`Looking up user ID ${userId} in employee map`)

      const employeeInfo = employeeMap.get(userId)
      console.log(`Found employee info:`, employeeInfo)

      return {
        ...record,
        employee_name: employeeInfo ? employeeInfo.name : `Unknown (ID: ${userId})`,
        employee_id: employeeInfo ? employeeInfo.employeeNumber : `User ID: ${userId}`,
        // Format times for display
        time_in: formatTime(record.check_in_time),
        time_out: formatTime(record.check_out_time),
      }
    })

    console.log("Enriched records:", enrichedRecords)
    return enrichedRecords
  }

  // Helper function to format time from "HH:MM:SS" to "HH:MM AM/PM"
  const formatTime = (timeString) => {
    if (!timeString) return "-"

    try {
      // Parse the time string (assuming format is "HH:MM:SS")
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours, 10)
      const minute = Number.parseInt(minutes, 10)

      // Create a date object to use toLocaleTimeString
      const date = new Date()
      date.setHours(hour)
      date.setMinutes(minute)

      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeString // Return original if parsing fails
    }
  }

  // Log employees data when it changes
  useEffect(() => {
    if (employees.length > 0) {
      console.log("Employees loaded:", employees.length)
      console.log("Sample employee structure:", employees[0])
    }
  }, [employees])

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value)
  }

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const filteredAttendanceData = attendanceData.filter(
    (record) =>
      record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredAttendanceData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredAttendanceData.length / recordsPerPage)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  // Determine status color based on status string
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "bg-green-500"
      case "late":
        return "bg-yellow-500"
      case "absent":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Attendance Records</h2>
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

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  id="employee"
                  value={selectedEmployee || ""}
                  onChange={handleEmployeeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5C7346] focus:border-[#5C7346]"
                >
                  <option value="">All Employees</option>
                  {employees.map((employee) => {
                    // Only include employees with a user ID
                    if (employee.user?.id) {
                      return (
                        <option key={employee.id} value={employee.user.id}>
                          {employee.first_name} {employee.last_name}
                        </option>
                      )
                    }
                    return null
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5C7346] focus:border-[#5C7346]"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5C7346] focus:border-[#5C7346]"
                />
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4 w-[15%]">DATE</th>
                  <th className="py-3 px-4 w-[15%]">EMPLOYEE ID</th>
                  <th className="py-3 px-4 w-[20%]">NAME</th>
                  <th className="py-3 px-4 w-[15%]">TIME IN</th>
                  <th className="py-3 px-4 w-[15%]">TIME OUT</th>
                  <th className="py-3 px-4 w-[20%]">STATUS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {currentRecords.length > 0 ? (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-white/10">
                      <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{record.employee_id}</td>
                      <td className="py-3 px-4">{record.employee_name}</td>
                      <td className="py-3 px-4">{record.time_in}</td>
                      <td className="py-3 px-4">{record.time_out}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                          {record.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center">
                      No attendance records found
                    </td>
                  </tr>
                )}
                {/* Add empty rows to maintain table height */}
                {currentRecords.length > 0 &&
                  [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                      <td colSpan="6"></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="flex justify-end items-center mt-4">
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Previous
              </button>
              <button className="bg-white text-[#5C7346] px-4 py-2 rounded-md">
                {currentPage} of {totalPages || 1}
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors ${
                  currentPage === totalPages || totalPages === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
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

export default AdminEmployeeAttendancePage

