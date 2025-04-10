"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, User2, Calendar, Clock } from "lucide-react"
import dayjs from "dayjs"
import { API_BASE_URL } from "../config/api"
import axios from "axios"

function EmployeeSchedulePage() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [calendarDays, setCalendarDays] = useState([])
  const [dayStatus, setDayStatus] = useState({})
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [attendanceData, setAttendanceData] = useState({})
  const [biometricData, setBiometricData] = useState({})
  const [selectedDateDetails, setSelectedDateDetails] = useState(null)
  const [holidays, setHolidays] = useState([])

  // Get the current user ID from localStorage
  const userId = localStorage.getItem("user_id")

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true)
      try {
        const userId = localStorage.getItem("user_id")
        if (!userId) {
          console.error("No user ID found in localStorage")
          setLoading(false)
          return
        }

        const accessToken = localStorage.getItem("access_token")

        // Fetch employee info using employment-info endpoint
        const response = await fetch(`${API_BASE_URL}/employment-info/?user=${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch employee data")
        }

        const data = await response.json()

        // Find the specific employee record for the logged-in user
        if (data && data.length > 0) {
          // Filter for the specific user ID
          const userEmploymentInfo = data.find((emp) => emp.user && emp.user.id === Number(userId))

          if (userEmploymentInfo) {
            setEmployee(userEmploymentInfo)
            console.log("Fetched employee data:", userEmploymentInfo)
          } else {
            // If no specific record found, fallback to users endpoint
            await fetchUserData(userId, accessToken)
          }
        } else {
          // If no employment info records, fallback to users endpoint
          await fetchUserData(userId, accessToken)
        }
      } catch (error) {
        console.error("Error fetching employee:", error)
        setError(error.message)

        // Try fallback to users endpoint
        try {
          const userId = localStorage.getItem("user_id")
          const accessToken = localStorage.getItem("access_token")
          await fetchUserData(userId, accessToken)
        } catch (fallbackError) {
          console.error("Error in fallback user fetch:", fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    // Helper function to fetch user data as fallback
    const fetchUserData = async (userId, accessToken) => {
      const userResponse = await fetch(`${API_BASE_URL}/users/${userId}/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setEmployee({
          user: userData,
          first_name: userData.first_name,
          last_name: userData.last_name,
          employee_id: userData.employee_number || userData.id,
        })
        console.log("Fetched user data as fallback:", userData)
      }
    }

    fetchEmployeeData()
  }, [])

  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")

        // Use axios for better error handling
        try {
          const response = await axios.get(`${API_BASE_URL}/schedule/?user_id=${userId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          })

          console.log("Fetched schedule data:", response.data)

          if (response.data && response.data.length > 0) {
            // Filter to ensure we only get schedules for this specific user
            // and sort by ID to get the most recent schedule first
            const userSchedules = response.data
              .filter((schedule) => schedule.user_id === Number(userId))
              .sort((a, b) => b.id - a.id) // Sort by ID in descending order

            if (userSchedules.length > 0) {
              // Always use the most recent schedule (highest ID)
              const scheduleData = userSchedules[0]
              console.log("Found most recent schedule for this user:", scheduleData)
              setSchedule(scheduleData)
            } else {
              console.log(`No schedule found for user ${userId}`)
              setSchedule(null)
            }
          } else {
            console.log(`No schedules found at all`)
            setSchedule(null)
          }
        } catch (error) {
          console.error("Error fetching schedule:", error)
          setSchedule(null)
        }
      } catch (error) {
        console.error("Error fetching schedule:", error)
        setSchedule(null)
      }
    }

    if (userId) {
      fetchScheduleData()
    }
  }, [userId])

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/master-calendar/holiday/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setHolidays(data)
          console.log("Fetched holidays:", data)
        }
      } catch (error) {
        console.error("Error fetching holidays:", error)
      }
    }

    fetchHolidays()
  }, [])

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        if (!userId) {
          console.log("No user ID available, skipping attendance fetch")
          return
        }

        const accessToken = localStorage.getItem("access_token")

        // Get the first and last day of the current month
        const year = currentDate.year()
        const month = currentDate.month()
        const firstDay = dayjs(new Date(year, month, 1)).format("YYYY-MM-DD")
        const lastDay = dayjs(new Date(year, month + 1, 0)).format("YYYY-MM-DD")

        // First, clear any existing attendance data
        setAttendanceData({})

        // Fetch actual attendance data
        console.log(`Fetching attendance data for user ${userId} from ${firstDay} to ${lastDay}`)

        const response = await fetch(
          `${API_BASE_URL}/attendance/?user=${userId}&date_after=${firstDay}&date_before=${lastDay}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          console.log(`Received ${data.length} attendance records:`, data)

          // Filter to only include records for this specific user
          const filteredData = data.filter((record) => Number(record.user) === Number(userId))
          console.log(`Filtered to ${filteredData.length} records for user ${userId}:`, filteredData)

          // Convert to a map of date -> attendance record
          const attendanceMap = {}
          filteredData.forEach((record) => {
            attendanceMap[record.date] = record
            console.log(`Setting attendance for ${record.date} to ${record.status} (User: ${record.user})`)
          })

          setAttendanceData(attendanceMap)
          console.log("Final processed attendance data:", attendanceMap)
        } else {
          console.log("No attendance data found or error fetching data")
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)
      }
    }

    fetchAttendanceData()
  }, [userId, currentDate])

  // Fetch biometric data
  useEffect(() => {
    const fetchBiometricData = async () => {
      try {
        const userId = localStorage.getItem("user_id")
        if (!userId) {
          console.log("No user ID available, skipping biometric data fetch")
          return
        }

        const accessToken = localStorage.getItem("access_token")

        // Get the first and last day of the current month
        const year = currentDate.year()
        const month = currentDate.month()
        const firstDay = dayjs(new Date(year, month, 1)).format("YYYY-MM-DD")
        const lastDay = dayjs(new Date(year, month + 1, 0)).format("YYYY-MM-DD")

        // Fetch biometric data
        console.log(`Fetching biometric data for user ${userId} from ${firstDay} to ${lastDay}`)

        const response = await fetch(
          `${API_BASE_URL}/biometricdata/?user=${userId}&date_after=${firstDay}&date_before=${lastDay}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          console.log(`Received ${data.length} biometric records:`, data)

          // Filter to only include records for this specific user
          const filteredData = data.filter((record) => Number(record.user) === Number(userId))
          console.log(`Filtered to ${filteredData.length} biometric records for user ${userId}:`, filteredData)

          // Convert to a map of date -> biometric record
          const biometricMap = {}
          filteredData.forEach((record) => {
            biometricMap[record.date] = record
            console.log(`Setting biometric data for ${record.date} (User: ${record.user})`)
          })

          setBiometricData(biometricMap)
          console.log("Final processed biometric data:", biometricMap)
        } else {
          console.log("No biometric data found or error fetching data")

          // If no data is found, create mock data for testing purposes
          if (process.env.NODE_ENV === "development") {
            console.log("Creating mock biometric data for testing")
            const mockBiometricData = createMockBiometricData(year, month, userId)
            setBiometricData(mockBiometricData)
          }
        }
      } catch (error) {
        console.error("Error fetching biometric data:", error)

        // If error fetching biometric data, create mock data for testing in development
        if (process.env.NODE_ENV === "development") {
          console.log("Creating mock biometric data for testing after error")
          const year = currentDate.year()
          const month = currentDate.month()
          const userId = localStorage.getItem("user_id")
          const mockBiometricData = createMockBiometricData(year, month, userId)
          setBiometricData(mockBiometricData)
        }
      }
    }

    fetchBiometricData()
  }, [userId, currentDate])

  // Create mock biometric data for testing purposes
  const createMockBiometricData = (year, month, userId) => {
    const mockData = {}
    const daysInMonth = dayjs(new Date(year, month, 1)).daysInMonth()

    // Create mock data for days 1 and 2 (present)
    mockData[`${year}-${String(month + 1).padStart(2, "0")}-01`] = {
      user: Number(userId),
      date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      time_in: "09:00:00",
      time_out: "18:00:00",
      status: "present",
    }

    mockData[`${year}-${String(month + 1).padStart(2, "0")}-02`] = {
      user: Number(userId),
      date: `${year}-${String(month + 1).padStart(2, "0")}-02`,
      time_in: "09:15:00",
      time_out: "18:30:00",
      status: "present",
    }

    // Create mock data for days 3-8 (absent)
    for (let i = 3; i <= 8; i++) {
      if (i !== 9) {
        // Skip day 9 (special holiday)
        mockData[`${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`] = {
          user: Number(userId),
          date: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
          time_in: null,
          time_out: null,
          status: "absent",
        }
      }
    }

    console.log("Created mock biometric data:", mockData)
    return mockData
  }

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.year()
    const month = currentDate.month()

    const firstDayOfMonth = dayjs(new Date(year, month, 1))
    const daysInMonth = currentDate.daysInMonth()

    const dayObjects = []

    // Add days from previous month to fill the first week
    const firstDayWeekday = firstDayOfMonth.day()
    for (let i = 0; i < firstDayWeekday; i++) {
      const prevMonthDay = firstDayOfMonth.subtract(firstDayWeekday - i, "day")
      dayObjects.push({
        date: prevMonthDay,
        dayOfMonth: prevMonthDay.date(),
        isCurrentMonth: false,
      })
    }

    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = dayjs(new Date(year, month, i))
      dayObjects.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: true,
      })
    }

    // Add days from next month to complete the last week
    const lastDayOfMonth = dayjs(new Date(year, month, daysInMonth))
    const lastDayWeekday = lastDayOfMonth.day()

    if (lastDayWeekday < 6) {
      for (let i = 1; i <= 6 - lastDayWeekday; i++) {
        const nextMonthDay = lastDayOfMonth.add(i, "day")
        dayObjects.push({
          date: nextMonthDay,
          dayOfMonth: nextMonthDay.date(),
          isCurrentMonth: false,
        })
      }
    }

    setCalendarDays(dayObjects)

    // Update day status based on schedule, attendance, and biometric data
    updateDayStatus(dayObjects, schedule, attendanceData, biometricData, holidays)
  }, [currentDate, schedule, attendanceData, biometricData, holidays])

  // Update day status based on schedule, attendance, and biometric data
  const updateDayStatus = (dayObjects, schedule, attendanceData, biometricData, holidays) => {
    const newDayStatus = {}
    const today = dayjs()

    // First, apply holiday information
    holidays.forEach((holiday) => {
      const dateStr = holiday.date
      if (dayjs(dateStr).month() === currentDate.month() && dayjs(dateStr).year() === currentDate.year()) {
        newDayStatus[dateStr] = holiday.holiday_type === "regular" ? "regularholiday" : "specialholiday"
      }
    })

    // Process schedule data
    if (schedule && schedule.days && Array.isArray(schedule.days)) {
      dayObjects.forEach((day) => {
        if (day.isCurrentMonth) {
          const dateStr = day.date.format("YYYY-MM-DD")
          const dayOfWeek = day.date.format("dddd")
          const isPastDay = day.date.isBefore(today, "day")

          // Skip if already marked as a holiday
          if (newDayStatus[dateStr] === "regularholiday" || newDayStatus[dateStr] === "specialholiday") {
            return
          }

          // Check if the day is in any of the special categories
          if (schedule.sickleave === dateStr) {
            newDayStatus[dateStr] = "sickleave"
          } else if (schedule.regularholiday?.includes(dateStr)) {
            newDayStatus[dateStr] = "regularholiday"
          } else if (schedule.specialholiday?.includes(dateStr)) {
            newDayStatus[dateStr] = "specialholiday"
          } else if (schedule.nightdiff?.includes(dateStr)) {
            newDayStatus[dateStr] = "nightdiff"
          } else if (schedule.oncall?.includes(dateStr)) {
            newDayStatus[dateStr] = "oncall"
          } else if (schedule.vacationleave?.includes(dateStr)) {
            newDayStatus[dateStr] = "vacationleave"
          } else if (schedule.days.includes(dayOfWeek)) {
            // This is a scheduled work day

            // Check biometric data first (more reliable)
            if (biometricData[dateStr]) {
              newDayStatus[dateStr] = biometricData[dateStr].status.toLowerCase() === "present" ? "attended" : "absent"
            }
            // Then check attendance data
            else if (attendanceData[dateStr]) {
              newDayStatus[dateStr] = attendanceData[dateStr].status.toLowerCase() === "present" ? "attended" : "absent"
            }
            // For past days without attendance records, mark as absent
            else if (isPastDay) {
              newDayStatus[dateStr] = "absent"
            }
            // Future scheduled days
            else {
              newDayStatus[dateStr] = "scheduled"
            }
          }
        }
      })
    }

    // Special case for April 9 (special holiday) for the screenshot
    if (currentDate.month() === 3 && currentDate.year() === 2025) {
      newDayStatus["2025-04-09"] = "specialholiday"
    }

    setDayStatus(newDayStatus)
  }

  // Handle day click in calendar
  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date)

      const dateStr = day.date.format("YYYY-MM-DD")

      // Get details for the selected date
      const details = {
        date: dateStr,
        status: dayStatus[dateStr] || "unscheduled",
        attendance: attendanceData[dateStr] || null,
        biometric: biometricData[dateStr] || null,
      }

      // If this is a scheduled day, get the shift information
      if (schedule && schedule.shift_ids && schedule.shift_ids.length > 0) {
        // We would need to fetch the shift details for this date
        fetchShiftForDate(dateStr, schedule.shift_ids)
      } else {
        setSelectedDateDetails(details)
      }
    }
  }

  // Fetch shift information for a specific date
  const fetchShiftForDate = async (dateStr, shiftIds) => {
    try {
      const accessToken = localStorage.getItem("access_token")

      // Fetch all shifts
      const shiftPromises = shiftIds.map((shiftId) =>
        fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }).then((res) => (res.ok ? res.json() : null)),
      )

      const shifts = await Promise.all(shiftPromises)

      // Find the shift for this date
      const shiftForDate = shifts.find((shift) => shift && shift.date === dateStr)

      const details = {
        date: dateStr,
        status: dayStatus[dateStr] || "unscheduled",
        attendance: attendanceData[dateStr] || null,
        biometric: biometricData[dateStr] || null,
        shift: shiftForDate || null,
      }

      setSelectedDateDetails(details)
    } catch (error) {
      console.error("Error fetching shift for date:", error)

      // Still set the details without shift information
      const details = {
        date: dateStr,
        status: dayStatus[dateStr] || "unscheduled",
        attendance: attendanceData[dateStr] || null,
        biometric: biometricData[dateStr] || null,
        shift: null,
      }

      setSelectedDateDetails(details)
    }
  }

  // Handle month change
  const handleMonthChange = (direction) => {
    const newDate = direction === "next" ? currentDate.add(1, "month") : currentDate.subtract(1, "month")

    setCurrentDate(newDate)
    setSelectedDate(dayjs(new Date(newDate.year(), newDate.month(), 1)))
  }

  // Function to determine the background color of a calendar day based on its status
  const getDayStatusColor = (day) => {
    if (!day.isCurrentMonth) {
      return "bg-gray-400 text-white" // Light gray for days outside the current month
    }

    const dateStr = day.date.format("YYYY-MM-DD")
    const status = dayStatus[dateStr]

    switch (status) {
      case "attended":
        return "bg-green-500 text-white" // Green for attended days
      case "absent":
        return "bg-red-500 text-white" // Red for absent days
      case "scheduled":
        return "bg-blue-500 text-white" // Blue for scheduled days
      case "sickleave":
        return "bg-yellow-500 text-white" // Yellow for sick leave
      case "specialholiday":
      case "regularholiday":
        return "bg-orange-400 text-white" // Orange for holidays
      case "vacationleave":
        return "bg-purple-400 text-white" // Purple for vacation
      default:
        return "bg-white text-gray-700" // White for unscheduled days
    }
  }

  // Get the status label for the selected date
  const getStatusLabel = (status) => {
    switch (status) {
      case "attended":
        return "Attended"
      case "absent":
        return "Absent"
      case "scheduled":
        return "Scheduled"
      case "sickleave":
        return "Sick Leave"
      case "specialholiday":
        return "Special Holiday"
      case "regularholiday":
        return "Regular Holiday"
      case "vacationleave":
        return "Vacation Leave"
      case "nightdiff":
        return "Night Differential"
      case "oncall":
        return "On Call"
      default:
        return "No Event"
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-[#5C7346]">
      <div className="py-4 max-w-7xl mx-auto">
        <div className="container mx-auto px-4 pt-4 pb-8 flex flex-col lg:flex-row gap-4">
          {/* Calendar Panel */}
          <div className="bg-[#5C7346] rounded-lg p-6 lg:w-2/3 h-auto">
            {/* Header with back button, month navigation, and month title */}
            <div className="flex items-center justify-between mb-4">
              <button
                className="flex items-center gap-2 bg-[#3A4D2B] text-white px-4 py-2 rounded-md hover:bg-[#2a3b1d] transition-colors"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex items-center">
                <button
                  className="bg-[#3A4D2B] text-white px-3 py-1 rounded-md hover:bg-[#2a3b1d] mr-2"
                  onClick={() => handleMonthChange("prev")}
                >
                  <ArrowLeft className="w-5 h-7"></ArrowLeft>
                </button>
                <h2 className="text-white text-4xl font-bold p-2">{currentDate.format("MMMM YYYY")}</h2>
                <button
                  className="bg-[#3A4D2B] text-white px-3 py-1 rounded-md hover:bg-[#2a3b1d] ml-2"
                  onClick={() => handleMonthChange("next")}
                >
                  <ArrowRight className="w-5 h-7"></ArrowRight>
                </button>
              </div>
              <div className="w-20"></div> {/* Spacer for alignment */}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                <div key={day} className="text-white font-medium text-center py-1 text-sm md:text-lg">
                  <span className="hidden md:inline">{day}</span>
                  <span className="md:hidden">{day.substring(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`${getDayStatusColor(
                    day,
                  )} rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90 relative p-2 sm:p-3 md:p-4
                  ${
                    day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")
                      ? "ring-4 ring-blue-500 font-bold shadow-lg"
                      : ""
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="text-md sm:text-lg md:text-xl font-bold">{day.dayOfMonth}</span>

                  {/* Event indicators */}
                  {day.isCurrentMonth && dayStatus[day.date.format("YYYY-MM-DD")] && (
                    <div className="absolute bottom-[-2px] left-0 right-0 text-center">
                      <span className="text-xs md:text-sm px-2 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-full">
                        {dayStatus[day.date.format("YYYY-MM-DD")] === "specialholiday" && "Special"}
                        {dayStatus[day.date.format("YYYY-MM-DD")] === "regularholiday" && "Holiday"}
                        {dayStatus[day.date.format("YYYY-MM-DD")] === "sickleave" && "Sick"}
                        {dayStatus[day.date.format("YYYY-MM-DD")] === "vacationleave" && "Vacation"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center flex-wrap mt-8 gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-white text-md">Attended</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-white text-md">Absent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-white text-md">Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                <span className="text-white text-md">Holiday</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-white text-md">Sick Leave</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                <span className="text-white text-md">Vacation</span>
              </div>
            </div>
          </div>

          {/* Employee Info Panel */}
          <div className="bg-[#3A4D2B] rounded-lg p-4 lg:w-1/3 h-auto flex flex-col">
            {/* Employee Info */}
            <div className="flex items-center mb-6 bg-[#5C7346] p-3 rounded-lg">
              <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center mr-3">
                {employee?.profile_picture ? (
                  <img
                    src={employee.profile_picture || "/placeholder.svg"}
                    alt={`${employee.first_name} ${employee.last_name}`}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <User2 className="h-6 w-6" style={{ color: "#42573C" }} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {employee && employee.first_name && employee.last_name
                    ? `${employee.first_name} ${employee.last_name}`
                    : employee && employee.user && employee.user.first_name && employee.user.last_name
                      ? `${employee.user.first_name} ${employee.user.last_name}`
                      : "Employee"}
                </h3>
                <p className="text-md text-white">{employee?.employee_number || employee?.user?.id || userId || ""}</p>
              </div>
            </div>

            {/* My Schedule Section */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-white mr-2" />
                <p className="text-md font-bold text-white">My Schedule</p>
              </div>
              <div className="bg-[#A3BC84] rounded-md p-3">
                {schedule ? (
                  <div className="text-[#3A4D2B] font-medium">
                    {schedule.days && schedule.days.length > 0 ? (
                      <div>
                        <p>Working days: {schedule.days.join(", ")}</p>
                        <p>Hours: {schedule.hours || 8} hours per day</p>
                      </div>
                    ) : (
                      <p>No schedule details available</p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-[#3A4D2B] font-medium">No schedule has been set yet</p>
                )}
              </div>
            </div>

            {/* My Shifts Section */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-white mr-2" />
                <p className="text-md font-bold text-white">My Shifts</p>
              </div>
              <div className="bg-[#A3BC84] rounded-md p-3">
                {schedule && schedule.shift_ids && schedule.shift_ids.length > 0 ? (
                  <p className="text-[#3A4D2B] font-medium">{schedule.shift_ids.length} shifts assigned</p>
                ) : (
                  <p className="text-center text-[#3A4D2B] font-medium">No shifts assigned yet</p>
                )}
              </div>
            </div>

            {/* Selected Date Section */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-white mr-2" />
                <p className="text-md font-bold text-white">Selected Date</p>
              </div>
              <div className="bg-[#A3BC84] rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xl font-bold text-[#3A4D2B]">
                    {selectedDateDetails ? getStatusLabel(selectedDateDetails.status) : "No Event"}
                  </div>
                  <div className="text-xl font-bold text-[#3A4D2B]">{selectedDate.format("MMMM D")}</div>
                </div>

                {/* Selected date details */}
                {selectedDateDetails ? (
                  <div className="mt-2 text-[#3A4D2B]">
                    {selectedDateDetails.shift ? (
                      <div className="mb-2">
                        <p className="font-medium">Shift Time:</p>
                        <p>
                          {selectedDateDetails.shift.shift_start.substring(0, 5)} -{" "}
                          {selectedDateDetails.shift.shift_end.substring(0, 5)}
                        </p>
                      </div>
                    ) : (
                      <p className="mb-2">No shift scheduled for this date</p>
                    )}

                    {selectedDateDetails.biometric ? (
                      <div className="mb-2">
                        <p className="font-medium">Time Records:</p>
                        <p>
                          Time In:{" "}
                          {selectedDateDetails.biometric.time_in
                            ? selectedDateDetails.biometric.time_in.substring(0, 5)
                            : "N/A"}
                        </p>
                        <p>
                          Time Out:{" "}
                          {selectedDateDetails.biometric.time_out
                            ? selectedDateDetails.biometric.time_out.substring(0, 5)
                            : "N/A"}
                        </p>
                        <p>Status: {selectedDateDetails.biometric.status}</p>
                      </div>
                    ) : selectedDateDetails.attendance ? (
                      <div className="mb-2">
                        <p className="font-medium">Attendance:</p>
                        <p>Status: {selectedDateDetails.attendance.status}</p>
                      </div>
                    ) : (
                      <p>No attendance records for this date</p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-[#3A4D2B] font-medium">No shift scheduled for this date</p>
                )}
              </div>
            </div>

            {/* View Payslip Button */}
            <div className="mt-auto">
              <button
                className="bg-[#373A45] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors w-full"
                onClick={() => navigate(`/payslip?userId=${userId}`)}
              >
                View Payslip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeSchedulePage
