"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar.jsx"
import { API_BASE_URL } from "../config/api"

function AdminEmployeeAttendancePage() {
  // Calculate biweekly date range (today to 14 days from today)
  const today = new Date()
  const twoWeeksLater = new Date(today)
  twoWeeksLater.setDate(today.getDate() + 14)

  const [attendanceData, setAttendanceData] = useState([])
  const [rawAttendanceData, setRawAttendanceData] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 7

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
        console.log("Employees fetched:", data.length)
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

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        console.log("Fetching attendance data from:", url)

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch attendance data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Attendance data fetched:", data.length, data)

        // Store the raw data
        setRawAttendanceData(data)
      } catch (error) {
        console.error("Error fetching attendance data:", error)
        setError("An error occurred while fetching attendance data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [])

  // Process attendance data whenever raw data or employees change
  useEffect(() => {
    const processAttendanceData = async () => {
      if (rawAttendanceData.length > 0 && employees.length > 0) {
        const processedData = await enrichAttendanceData(rawAttendanceData)

        // Sort the processed data by date in descending order (newest first)
        const sortedData = [...processedData].sort((a, b) => {
          // Convert dates to timestamps for comparison
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()

          // Sort in descending order (newest first)
          return dateB - dateA
        })

        setAttendanceData(sortedData)
      }
    }

    processAttendanceData()
  }, [rawAttendanceData, employees])

  // Enrich attendance data with employee names
  const enrichAttendanceData = async (attendanceRecords) => {
    // If no attendance records, return empty array
    if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      console.log("No attendance records to process")
      return []
    }

    // If no employees data, return records with placeholders
    if (!employees || employees.length === 0) {
      console.log("No employee data available for mapping")
      return attendanceRecords.map((record) => ({
        ...record,
        employee_name: `Loading... (ID: ${record.user})`,
        employee_id: "Loading...",
        time_in: formatTime(record.check_in_time),
        time_out: formatTime(record.check_out_time),
      }))
    }

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
      }
    })

    console.log("Employee map created with", employeeMap.size, "entries")

    // Enrich attendance records with employee names
    return attendanceRecords.map((record) => {
      const userId = record.user
      const employeeInfo = employeeMap.get(userId)

      return {
        ...record,
        employee_name: employeeInfo ? employeeInfo.name : `Unknown (ID: ${userId})`,
        employee_id: employeeInfo ? employeeInfo.employeeNumber : `User ID: ${userId}`,
        // Format times for display
        time_in: formatTime(record.check_in_time),
        time_out: formatTime(record.check_out_time),
      }
    })
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
        return "bg-green-100 text-green-800"
      case "late":
        return "bg-yellow-400 text-yellow-800"
      case "absent":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-white">Attendance Records</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
            <thead>
                <tr className="text-left text-white border-b border-white/20">
                  
                  <th className="py-3 px-4 w-[10%]">DATE</th>
                  <th className="py-3 px-4 w-[15%]">EMPLOYEE ID</th>
                  <th className="py-3 px-4 w-[30%]">NAME</th>
                  <th className="py-3 px-4 w-[15%]">TIME IN</th>
                  <th className="py-3 px-4 w-[15%]">TIME OUT</th>
                  <th className="py-3 px-4 w-[15%]">STATUS</th>

                </tr>
              </thead>
              <tbody className="text-white">
                {currentRecords.length > 0 ? (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-white/10 text-md">
                      <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{record.employee_id}</td>
                      <td className="py-3 px-4">{record.employee_name}</td>
                      <td className="py-3 px-4">{record.time_in}</td>
                      <td className="py-3 px-4">{record.time_out}</td>
                      <td className="py-3 px-4">
                        <span className={`px-4 py-1 rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}>

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

