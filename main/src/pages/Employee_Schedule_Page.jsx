"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { API_BASE_URL } from "../config/api"
import { ArrowLeft, ArrowRight, User2, Calendar, Clock } from "lucide-react"
import dayjs from "dayjs"
import axios from "axios"

function EmployeeSchedulePage() {
  const navigate = useNavigate()

  // State for employee data
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for calendar and schedule
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [schedule, setSchedule] = useState({
    id: null,
    user_id: null,
    shift_ids: [],
    days: [],
    sickleave: null,
    regularholiday: [],
    specialholiday: [],
    nightdiff: [],
    oncall: [],
    vacationleave: [],
    restday: [],
    payroll_period: "",
    hours: 8,
    bi_weekly_start: "",
    payroll_period_start: null,
    payroll_period_end: null,
  })

  // State for calendar data
  const [calendarDays, setCalendarDays] = useState([])
  const [dayStatus, setDayStatus] = useState({})
  const [shifts, setShifts] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const [holidays, setHolidays] = useState([])
  const [hasSchedule, setHasSchedule] = useState(false)
  const [selectedDateDetails, setSelectedDateDetails] = useState(null)

  // Get the current user ID from localStorage
  const userId = localStorage.getItem("user_id")

  // Helper function to check if a date is within the current payroll period
  const isDateInPayrollPeriod = (date) => {
    if (!schedule.payroll_period_start || !schedule.payroll_period_end) return true // If no period set, allow all dates

    const dateObj = dayjs(date)
    const startDate = dayjs(schedule.payroll_period_start)
    const endDate = dayjs(schedule.payroll_period_end)

    return dateObj.isAfter(startDate.subtract(1, "day")) && dateObj.isBefore(endDate.add(1, "day"))
  }

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
        }
      } catch (error) {
        console.error("Error fetching holidays:", error)
      }
    }

    fetchHolidays()
  }, [])

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true)
      try {
        const userId = localStorage.getItem("user_id")
        const accessToken = localStorage.getItem("access_token")

        if (!userId || !accessToken) {
          navigate("/", { replace: true })
          return
        }

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
  }, [navigate])

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        if (!userId) return

        const accessToken = localStorage.getItem("access_token")

        // Get the first and last day of the current month
        const year = currentDate.year()
        const month = currentDate.month()
        const firstDay = dayjs(new Date(year, month, 1)).format("YYYY-MM-DD")
        const lastDay = dayjs(new Date(year, month + 1, 0)).format("YYYY-MM-DD")

        // Clear existing attendance data
        setAttendanceData({})

        // Fetch actual attendance data
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

          // Convert to a map of date -> attendance record
          const attendanceMap = {}
          data.forEach((record) => {
            attendanceMap[record.date] = record
            console.log(`Processed attendance for ${record.date}: ${record.status}`)
          })

          setAttendanceData(attendanceMap)
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)
      }
    }

    fetchAttendanceData()
  }, [currentDate, userId])

  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        console.log("Starting fetchScheduleData...")
        setLoading(true)

        // Reset schedule state first
        setSchedule({
          id: null,
          user_id: null,
          shift_ids: [],
          days: [],
          sickleave: null,
          regularholiday: [],
          specialholiday: [],
          nightdiff: [],
          oncall: [],
          vacationleave: [],
          restday: [],
          payroll_period: "",
          hours: 8,
          bi_weekly_start: "",
          payroll_period_start: null,
          payroll_period_end: null,
        })

        // Reset day status
        setDayStatus({})
        setHasSchedule(false)
        setShifts([])

        const accessToken = localStorage.getItem("access_token")
        if (!accessToken) {
          console.error("No access token found")
          setLoading(false)
          return
        }

        // Use the user ID from localStorage
        if (!userId) {
          console.warn("No user ID found")
          setLoading(false)
          return
        }

        console.log(`Fetching schedule for user ID: ${userId}`)

        // Use axios for better error handling
        try {
          const response = await axios.get(`${API_BASE_URL}/schedule/?user_id=${userId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          })

          console.log(`Fetched schedule data:`, response.data)

          if (response.data && response.data.length > 0) {
            // Filter to ensure we only get schedules for this specific user
            // and sort by ID to get the most recent schedule first
            const userSchedules = response.data
              .filter((schedule) => schedule.user_id === Number(userId))
              .sort((a, b) => b.id - a.id)

            if (userSchedules.length > 0) {
              // Always use the most recent schedule (highest ID)
              const scheduleData = userSchedules[0]
              console.log("Found most recent schedule for this user:", scheduleData)

              // Set the schedule
              setSchedule(scheduleData)
              setHasSchedule(true)

              // Fetch shift details
              if (scheduleData.shifts && scheduleData.shifts.length > 0) {
                // Sort shifts by date
                const sortedShifts = [...scheduleData.shifts].sort((a, b) => {
                  return new Date(a.date) - new Date(b.date)
                })
                setShifts(sortedShifts)
              } else if (scheduleData.shift_ids && scheduleData.shift_ids.length > 0) {
                // Fetch shift details if only IDs are provided
                const shiftPromises = scheduleData.shift_ids.map((shiftId) =>
                  fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json",
                    },
                  }).then((res) => (res.ok ? res.json() : null)),
                )

                const shiftsData = await Promise.all(shiftPromises)
                const validShifts = shiftsData.filter((shift) => shift !== null)

                // Sort shifts by date
                const sortedShifts = validShifts.sort((a, b) => {
                  return new Date(a.date) - new Date(b.date)
                })
                setShifts(sortedShifts)
              }
            } else {
              console.log(`No schedule found for user ID ${userId}`)
            }
          } else {
            console.log(`No schedules found at all`)
          }
        } catch (error) {
          console.error("Error fetching schedule:", error)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching schedule:", error)
        setLoading(false)
      }
    }

    fetchScheduleData()
  }, [userId])

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

    // Initialize day status
    const newDayStatus = {}
    const today = dayjs()

    // First, apply holiday information
    holidays.forEach((holiday) => {
      const dateStr = holiday.date
      if (dayjs(dateStr).month() === month && dayjs(dateStr).year() === year) {
        newDayStatus[dateStr] = holiday.holiday_type === "regular" ? "regularholiday" : "specialholiday"
      }
    })

    // If we have a schedule, update the day status
    if (hasSchedule && schedule.days && schedule.days.length > 0) {
      dayObjects.forEach((day) => {
        if (day.isCurrentMonth) {
          const dateStr = day.date.format("YYYY-MM-DD")
          const dayOfWeek = day.date.format("dddd")
          const isPastDay = day.date.isBefore(today, "day")
          const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

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
          } else if (schedule.restday?.includes(dateStr)) {
            newDayStatus[dateStr] = "restday"
          } else if (attendanceData[dateStr] && isInPayrollPeriod) {
            // Only mark attendance if it's within the payroll period
            const status = attendanceData[dateStr].status.toLowerCase()
            if (status === "present") {
              newDayStatus[dateStr] = "attended"
            } else if (status === "absent") {
              newDayStatus[dateStr] = "absent"
            } else if (status === "late") {
              newDayStatus[dateStr] = "late"
            }
          } else if (schedule.days?.includes(dayOfWeek) && isInPayrollPeriod) {
            // If it's a scheduled day and in the payroll period (and no attendance data)
            if (isPastDay) {
              // Past scheduled days without attendance records should be marked as absent
              newDayStatus[dateStr] = "absent"
            } else {
              // Future scheduled days
              newDayStatus[dateStr] = "scheduled"
            }
          } else if (isPastDay && schedule.days?.includes(dayOfWeek) && isInPayrollPeriod) {
            // Only mark as absent if it's a scheduled working day (Monday or Wednesday)
            // and it's in the payroll period
            newDayStatus[dateStr] = "absent"
          } else {
            // Default status for future days
            newDayStatus[dateStr] = isInPayrollPeriod ? "unscheduled" : "outside-period"
          }
        }
      })
    }

    setDayStatus(newDayStatus)
  }, [currentDate, schedule, holidays, attendanceData, hasSchedule])

  // Handle day click in calendar
  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date)

      const dateStr = day.date.format("YYYY-MM-DD")
      const dayOfWeek = day.date.format("dddd")

      // Find shift for this date
      const shiftForDate = shifts.find((shift) => shift.date === dateStr)

      // Find attendance for this date
      const attendanceForDate = attendanceData[dateStr]

      // Check if this is a scheduled day
      const isScheduledDay = schedule.days && schedule.days.includes(dayOfWeek) && isDateInPayrollPeriod(dateStr)

      // Get the status
      const status = dayStatus[dateStr] || "unscheduled"

      // Set selected date details
      setSelectedDateDetails({
        date: dateStr,
        status: status,
        shift: shiftForDate,
        attendance: attendanceForDate,
        isScheduledDay: isScheduledDay,
        isInPayrollPeriod: isDateInPayrollPeriod(dateStr),
      })
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
        return "bg-blue-200 text-gray-800" // Blue for scheduled days
      case "sickleave":
        return "bg-yellow-400 text-white" // Yellow for sick leave
      case "regularholiday":
      case "specialholiday":
        return "bg-orange-400 text-white" // Orange for holidays
      case "vacationleave":
        return "bg-purple-400 text-white" // Purple for vacation
      case "nightdiff":
        return "bg-blue-500 text-white" // Dark blue for night differential
      case "oncall":
        return "bg-purple-500 text-white" // Purple for on-call
      case "restday":
        return "bg-gray-300 text-gray-700" // Gray for rest days
      case "outside-period":
        return "bg-gray-200 text-gray-500" // Light gray for days outside payroll period
      default:
        return "bg-white text-gray-700" // White for unscheduled days
    }
  }

  // Format time from "HH:MM:SS" to "HH:MM AM/PM"
  const formatTime = (timeStr) => {
    if (!timeStr) return ""

    const [hours, minutes] = timeStr.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12

    return `${hour12}:${minutes} ${ampm}`
  }

  // Get event status for selected date
  const getEventForDate = (date) => {
    if (!date) return "No Event"

    const dateStr = date.format("YYYY-MM-DD")
    const isInPayrollPeriod = isDateInPayrollPeriod(dateStr)

    // If not in payroll period, return "Outside Period"
    if (!isInPayrollPeriod) {
      return "Outside Payroll Period"
    }

    // If we have attendance data for this date and it's in the payroll period, prioritize it
    if (attendanceData[dateStr] && isInPayrollPeriod) {
      const attendanceStatus = attendanceData[dateStr].status.toLowerCase()
      if (attendanceStatus === "present") return "Attended"
      if (attendanceStatus === "absent") return "Absent"
      if (attendanceStatus === "late") return "Late"
    }

    const status = dayStatus[dateStr]
    switch (status) {
      case "sickleave":
        return "Sick Leave"
      case "regularholiday":
        return "Regular Holiday"
      case "specialholiday":
        return "Special Holiday"
      case "vacationleave":
        return "Vacation Leave"
      case "nightdiff":
        return "Night Differential"
      case "oncall":
        return "On Call"
      case "restday":
        return "Rest Day"
      case "attended":
        return "Attended"
      case "absent":
        return "Absent"
      case "scheduled":
        return "Scheduled"
      case "outside-period":
        return "Outside Payroll Period"
      default:
        return "No Event"
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="py-4 max-w-7xl mx-auto">
        <div className="container mx-auto px-4 pt-4 pb-8 flex flex-col gap-6">
          {/* Main content container with two panels side by side */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Calendar Panel - Fixed size with max-height */}
            <div className="bg-[#5C7346] rounded-lg p-6 lg:w-2/3 h-auto max-h-[800px] overflow-auto">
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
                {calendarDays.map((day, index) => {
                  const dateStr = day.date.format("YYYY-MM-DD")
                  const status = day.isCurrentMonth ? dayStatus[dateStr] : null
                  const isToday = day.date.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD")
                  const isSelected = day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")

                  return (
                    <div
                      key={index}
                      className={`${getDayStatusColor(day)} 
                        rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90 relative p-2 sm:p-3 md:p-4
                        ${day.isCurrentMonth ? "cursor-pointer" : "cursor-not-allowed"} 
                        transition-colors relative
                        ${isToday ? "ring-2 ring-blue" : ""}
                        ${isSelected && day.isCurrentMonth ? "ring-4 ring-blue-500 shadow-lg" : ""}`}
                      onClick={() => day.isCurrentMonth && handleDayClick(day)}
                    >
                      <span className="text-md sm:text-lg md:text-xl font-bold mt-1">{day.dayOfMonth}</span>

                      {/* Event indicators */}
                      {day.isCurrentMonth &&
                        status &&
                        status !== "attended" &&
                        status !== "absent" &&
                        status !== "scheduled" && (
                          <div className="absolute bottom-1 left-0 right-0 text-center">
                            <span className="text-xs px-1 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-full">
                              {status === "sickleave" && "Sick Leave"}
                              {status === "specialholiday" && "Special Holiday"}
                              {status === "regularholiday" && "Regular Holiday"}
                              {status === "vacationleave" && "Vacation Leave"}
                              {status === "nightdiff" && "Night Differential"}
                              {status === "oncall" && "On Call"}
                              {status === "restday" && "Rest Day"}
                              {status === "outside-period"}
                            </span>
                          </div>
                        )}
                    </div>
                  )
                })}
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
                  <div className="w-3 h-3 rounded-full bg-blue-200 mr-2"></div>
                  <span className="text-white text-md">Scheduled</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                  <span className="text-white text-md">Holiday</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                  <span className="text-white text-md">Sick Leave</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                  <span className="text-white text-md">Vacation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-200 mr-2"></div>
                  <span className="text-white text-md">Outside Period</span>
                </div>
              </div>
            </div>

            {/* Employee Schedule Panel - Fixed size with max-height */}
            <div className="bg-[#3A4D2B] rounded-lg p-4 lg:w-1/3 h-auto max-h-[800px] overflow-y-auto scrollbar-hide flex flex-col">
              {/* Employee Info - Horizontal layout */}
              <div className="bg-[#5C7346] p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center mr-4">
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
                    <h3 className="text-xl font-bold text-white">
                      {employee && employee.first_name && employee.last_name
                        ? `${employee.first_name} ${employee.last_name}`
                        : employee && employee.user && employee.user.first_name && employee.user.last_name
                          ? `${employee.user.first_name} ${employee.user.last_name}`
                          : "Employee"}
                    </h3>
                    <p className="text-md text-white">
                      {employee?.employee_number || employee?.user?.id || userId || ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-white mr-2" />
                  <p className="text-lg font-bold text-white">My Schedule</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {hasSchedule && schedule.days && schedule.days.length > 0 ? (
                    <div className="text-[#3A4D2B] font-medium">
                      <p>Working days: {schedule.days.join(", ")}</p>
                      <p>Hours: {schedule.hours || 8} hours per day</p>
                      {schedule.payroll_period_start && schedule.payroll_period_end && (
                        <p>
                          Payroll period: {dayjs(schedule.payroll_period_start).format("MMM DD")} -{" "}
                          {dayjs(schedule.payroll_period_end).format("MMM DD")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-[#3A4D2B] font-medium">No schedule has been set yet</div>
                  )}
                </div>
              </div>

              {/* Shifts Section */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-white mr-2" />
                  <p className="text-lg font-bold text-white">My Shifts</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {hasSchedule && shifts.length > 0 ? (
                    <div className="space-y-2">
                      {shifts.map((shift, index) => (
                        <div key={index} className="bg-[#5C7346] p-2 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold">{dayjs(shift.date).format("ddd, MMM D")}</span>
                            <span className="text-white text-sm">
                              {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-[#3A4D2B] font-medium">No shifts assigned yet</div>
                  )}
                </div>
              </div>

              {/* Selected Date Section */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-white mr-2" />
                  <p className="text-lg font-bold text-white">Selected Date</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {/* Selected date display with fixed layout */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xl font-bold text-[#3A4D2B]">
                      {selectedDateDetails ? getEventForDate(selectedDate) : "No Event"}
                    </div>
                    <div className="text-xl font-bold text-[#3A4D2B]">{selectedDate.format("MMMM D")}</div>
                  </div>

                  {/* Selected date details */}
                  <div className="bg-[#5C7346] p-3 rounded-md text-white">
                    {selectedDateDetails ? (
                      <div>
                        {selectedDateDetails.shift ? (
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">Shift:</span>
                              <span>
                                {formatTime(selectedDateDetails.shift.shift_start)} -{" "}
                                {formatTime(selectedDateDetails.shift.shift_end)}
                              </span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">Hours:</span>
                              <span>{selectedDateDetails.shift.expected_hours || 8}</span>
                            </div>
                            {selectedDateDetails.attendance && (
                              <>
                                <div className="flex justify-between mb-2">
                                  <span className="font-medium">Time In:</span>
                                  <span>{formatTime(selectedDateDetails.attendance.check_in_time)}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <span className="font-medium">Time Out:</span>
                                  <span>{formatTime(selectedDateDetails.attendance.check_out_time)}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="font-medium">Status:</span>
                              <span>{getEventForDate(selectedDate)}</span>
                            </div>
                          </div>
                        ) : selectedDateDetails.isScheduledDay ? (
                          <div className="text-center py-2">
                            This is a scheduled work day, but no shift details are available.
                          </div>
                        ) : !selectedDateDetails.isInPayrollPeriod ? (
                          <div className="text-center py-2">This date is outside the current payroll period</div>
                        ) : (
                          <div className="text-center py-2">No shift scheduled for this date</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2">No shift scheduled for this date</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  )
}

export default EmployeeSchedulePage
