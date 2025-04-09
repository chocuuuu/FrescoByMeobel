"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { ArrowLeft, ArrowRight, User2, Calendar } from "lucide-react"
import dayjs from "dayjs"
import { API_BASE_URL } from "../config/api"
import axios from "axios"

function EmployeeSchedulePage() {
  const navigate = useNavigate()

  // State for employee data
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for calendar and schedule
  const currentYear = dayjs().format("YYYY")
  const currentMonth = dayjs().format("MMMM")
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
  const [shiftDetails, setShiftDetails] = useState({})

  // Helper function to check if a date is within the current payroll period
  const isDateInPayrollPeriod = (date) => {
    if (!schedule.payroll_period_start || !schedule.payroll_period_end) return true // If no period set, allow all dates

    const dateObj = dayjs(date)
    const startDate = dayjs(schedule.payroll_period_start)
    const endDate = dayjs(schedule.payroll_period_end)

    return dateObj.isAfter(startDate.subtract(1, "day")) && dateObj.isBefore(endDate.add(1, "day"))
  }

  // Helper function to convert time format (e.g., "08:00:00") to time string (e.g., "8:00 AM")
  const convertTimeFormatToTimeString = (timeFormat) => {
    if (!timeFormat) return "12:00 AM"

    const [hours, minutes, seconds] = timeFormat.split(":")
    let hour = Number.parseInt(hours)
    const modifier = hour >= 12 ? "PM" : "AM"

    hour = hour % 12
    hour = hour ? hour : 12 // the hour '0' should be '12'

    return `${hour}:${minutes} ${modifier}`
  }

  // Fetch holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/master-calendar/holidays/`, {
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

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true)
      try {
        const accessToken = localStorage.getItem("access_token")
        const userId = localStorage.getItem("user_id")

        if (!userId) {
          throw new Error("User ID not found in local storage")
        }

        // First, get the user's employee record
        const employeeResponse = await fetch(`${API_BASE_URL}/employees/?user=${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!employeeResponse.ok) {
          throw new Error("Failed to fetch employee data")
        }

        const employeeData = await employeeResponse.json()

        if (!employeeData || employeeData.length === 0) {
          throw new Error("No employee record found for this user")
        }

        // Then, get the employment info using the employee's employment_info ID
        const employmentInfoId = employeeData[0].employment_info
        const employmentInfoResponse = await fetch(`${API_BASE_URL}/employment-info/${employmentInfoId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!employmentInfoResponse.ok) {
          throw new Error("Failed to fetch employment info")
        }

        const employmentInfoData = await employmentInfoResponse.json()

        // Combine the data
        const combinedData = {
          ...employmentInfoData,
          user: { id: userId },
          employee: employeeData[0],
        }

        console.log("Fetched employee data:", combinedData)
        setEmployee(combinedData)

        // Update schedule with the correct user_id
        setSchedule((prev) => ({
          ...prev,
          user_id: userId,
        }))
      } catch (error) {
        console.error("Error fetching employee:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeData()
  }, [])

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        if (!schedule.user_id) {
          console.log("No user ID available, skipping attendance fetch")
          return
        }

        const accessToken = localStorage.getItem("access_token")
        const userId = schedule.user_id

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

          // Convert to a map of date -> status
          const attendanceMap = {}
          filteredData.forEach((record) => {
            // Store status in lowercase for consistent comparison
            attendanceMap[record.date] = record.status.toLowerCase()
            console.log(
              `Setting attendance for ${record.date} to ${record.status.toLowerCase()} (User: ${record.user})`,
            )
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
  }, [schedule.user_id, currentDate])

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
          payroll_period: "",
          hours: 8,
          bi_weekly_start: "",
          payroll_period_start: null,
          payroll_period_end: null,
        })

        const accessToken = localStorage.getItem("access_token")
        if (!accessToken) {
          console.error("No access token found")
          setLoading(false)
          return
        }

        // Use the user ID from local storage
        const userId = localStorage.getItem("user_id")
        if (!userId) {
          console.warn("No user ID found in local storage")
          setLoading(false)
          return
        }

        console.log(`Fetching schedule for user ID: ${userId}`)

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
              .sort((a, b) => b.id - a.id) // Sort by ID in descending order

            if (userSchedules.length > 0) {
              // Always use the most recent schedule (highest ID)
              const scheduleData = userSchedules[0]
              console.log("Found most recent schedule for this user:", scheduleData)

              // Set the schedule
              setSchedule(scheduleData)

              // Fetch shift details for this schedule
              if (scheduleData.shift_ids && scheduleData.shift_ids.length > 0) {
                fetchShiftDetails(scheduleData.shift_ids, accessToken)
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
  }, [])

  // Fetch shift details
  const fetchShiftDetails = async (shiftIds, accessToken) => {
    try {
      const shiftPromises = shiftIds.map((shiftId) =>
        fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }).then((res) => (res.ok ? res.json() : null)),
      )

      const shiftsData = await Promise.all(shiftPromises)
      const validShifts = shiftsData.filter((shift) => shift !== null)

      // Create a map of date -> shift details
      const shiftDetailsMap = {}
      validShifts.forEach((shift) => {
        shiftDetailsMap[shift.date] = {
          start: shift.shift_start,
          end: shift.shift_end,
          id: shift.id,
        }
      })

      setShiftDetails(shiftDetailsMap)
      console.log("Shift details:", shiftDetailsMap)
    } catch (error) {
      console.error("Error fetching shift details:", error)
    }
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
        } else if (schedule.days?.includes(dayOfWeek) && isInPayrollPeriod) {
          // If it's a scheduled day and in the payroll period
          if (isPastDay && attendanceData[dateStr]) {
            // For past days with attendance data
            const lowerStatus = attendanceData[dateStr].toLowerCase()
            if (lowerStatus === "present") {
              newDayStatus[dateStr] = "attended"
            } else if (lowerStatus === "absent") {
              newDayStatus[dateStr] = "absent"
            } else if (lowerStatus === "late") {
              newDayStatus[dateStr] = "late"
            }
          } else if (isPastDay) {
            // Past scheduled days without attendance records should be marked as absent
            newDayStatus[dateStr] = "absent"
          } else {
            // Future scheduled days
            newDayStatus[dateStr] = "scheduled"
          }
        } else {
          // Days not in schedule - no special status needed
          newDayStatus[dateStr] = "unscheduled"
        }
      }
    })

    setDayStatus(newDayStatus)
  }, [currentDate, schedule, attendanceData, holidays])

  // Handle day click in calendar
  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date)
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
    const dayOfWeek = day.date.format("dddd")
    const isScheduledDay = schedule.days?.includes(dayOfWeek)

    // Only show attendance status for scheduled days
    if (isScheduledDay) {
      switch (status) {
        case "attended":
          return "bg-green-500 text-white" // Green for attended days
        case "absent":
          return "bg-red-500 text-white" // Red for absent days
        case "late":
          return "bg-yellow-500 text-white" // Yellow for late days
        case "scheduled":
          return "bg-blue-200 text-gray-800" // Blue for scheduled days
        case "sickleave":
          return "bg-purple-400 text-white" // Purple for sick leave
        case "vacationleave":
          return "bg-teal-400 text-white" // Teal for vacation leave
        case "regularholiday":
        case "specialholiday":
          return "bg-orange-400 text-white" // Orange for holidays
        case "nightdiff":
          return "bg-blue-500 text-white" // Dark blue for night differential
        case "oncall":
          return "bg-purple-500 text-white" // Purple for on-call
        default:
          return "bg-blue-200 text-gray-800" // Default blue for scheduled days
      }
    } else {
      // For non-scheduled days, still show holidays and events
      switch (status) {
        case "regularholiday":
        case "specialholiday":
          return "bg-orange-400 text-white" // Orange for holidays
        case "sickleave":
          return "bg-purple-400 text-white" // Purple for sick leave
        case "vacationleave":
          return "bg-teal-400 text-white" // Teal for vacation leave
        case "nightdiff":
          return "bg-blue-500 text-white" // Dark blue for night differential
        case "oncall":
          return "bg-purple-500 text-white" // Purple for on-call
        default:
          return "bg-white text-gray-700" // White for unscheduled days
      }
    }
  }

  // Get shift time for the selected date
  const getShiftTimeForSelectedDate = () => {
    if (!selectedDate) return null

    const dateStr = selectedDate.format("YYYY-MM-DD")
    const shift = shiftDetails[dateStr]

    if (shift) {
      return {
        start: convertTimeFormatToTimeString(shift.start),
        end: convertTimeFormatToTimeString(shift.end),
      }
    }

    return null
  }

  // Get event type for the selected date
  const getEventTypeForSelectedDate = () => {
    if (!selectedDate) return "None"

    const dateStr = selectedDate.format("YYYY-MM-DD")
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
      case "attended":
        return "Attended"
      case "absent":
        return "Absent"
      case "late":
        return "Late"
      default:
        return "None"
    }
  }

  // Check if the selected date is a scheduled day
  const isSelectedDateScheduled = () => {
    if (!selectedDate) return false

    const dayOfWeek = selectedDate.format("dddd")
    return schedule.days?.includes(dayOfWeek) || false
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
                  const dayOfWeek = day.date.format("dddd")
                  const isScheduledDay = schedule.days?.includes(dayOfWeek)
                  const shift = shiftDetails[dateStr]

                  return (
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

                      {/* Show shift time if available */}
                      {day.isCurrentMonth && isScheduledDay && shift && (
                        <div className="text-xs text-center mt-1 font-medium">
                          {convertTimeFormatToTimeString(shift.start).substring(0, 5)}
                        </div>
                      )}

                      {/* Event indicators */}
                      {day.isCurrentMonth && status && (
                        <div className="absolute bottom-[-2px] left-0 right-0 text-center">
                          <span className="text-xs md:text-sm px-2 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-full">
                            {status === "sickleave" && "Sick Leave"}
                            {status === "specialholiday" && "Special Holiday"}
                            {status === "regularholiday" && "Regular Holiday"}
                            {status === "vacationleave" && "Vacation Leave"}
                            {status === "nightdiff" && "Night Diff"}
                            {status === "oncall" && "On Call"}
                            {status === "attended" && "Present"}
                            {status === "absent" && "Absent"}
                            {status === "late" && "Late"}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex justify-end flex-wrap mt-8 gap-4">
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
                  <div className="w-3 h-3 rounded-full bg-purple-400 mr-2"></div>
                  <span className="text-white text-md">Leave</span>
                </div>
              </div>
            </div>

            {/* Employee Schedule Panel - Fixed size with max-height */}
            <div className="bg-[#3A4D2B] rounded-lg p-4 lg:w-1/3 h-auto max-h-[800px] overflow-y-auto scrollbar-hide flex flex-col">
              {/* Employee Info - Horizontal layout */}
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
                      : "Employee"}
                  </h3>
                  <p className="text-md text-white">{employee?.employee_number || ""}</p>
                </div>
              </div>

              {/* Payroll Period Display */}
              {schedule.payroll_period_start && schedule.payroll_period_end && (
                <div className="mb-4 bg-[#5C7346] p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-white mr-2" />
                      <span className="text-white font-bold">Payroll Period:</span>
                    </div>
                  </div>
                  <div className="text-white">
                    {dayjs(schedule.payroll_period_start).format("MMM DD, YYYY")} -{" "}
                    {dayjs(schedule.payroll_period_end).format("MMM DD, YYYY")}
                  </div>
                </div>
              )}

              {/* Selected Date Details */}
              <div className="mb-4 bg-[#5C7346] p-3 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-2">{selectedDate.format("MMMM D, YYYY")}</h3>

                <div className="space-y-3">
                  {/* Day Type */}
                  <div className="flex justify-between">
                    <span className="text-white">Day:</span>
                    <span className="text-white font-medium">{selectedDate.format("dddd")}</span>
                  </div>

                  {/* Schedule Status */}
                  <div className="flex justify-between">
                    <span className="text-white">Status:</span>
                    <span className="text-white font-medium">
                      {isSelectedDateScheduled() ? "Scheduled" : "Not Scheduled"}
                    </span>
                  </div>

                  {/* Shift Time if scheduled */}
                  {isSelectedDateScheduled() && getShiftTimeForSelectedDate() && (
                    <div className="flex justify-between">
                      <span className="text-white">Shift Time:</span>
                      <span className="text-white font-medium">
                        {getShiftTimeForSelectedDate().start} - {getShiftTimeForSelectedDate().end}
                      </span>
                    </div>
                  )}

                  {/* Event Type */}
                  <div className="flex justify-between">
                    <span className="text-white">Event:</span>
                    <span className="text-white font-medium">{getEventTypeForSelectedDate()}</span>
                  </div>
                </div>
              </div>

              {/* Schedule Summary */}
              <div className="mb-4 bg-[#5C7346] p-3 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-2">Schedule Summary</h3>

                <div className="space-y-3">
                  {/* Working Days */}
                  <div className="flex justify-between">
                    <span className="text-white">Working Days:</span>
                    <span className="text-white font-medium">{schedule.days?.join(", ") || "None"}</span>
                  </div>

                  {/* Regular Hours */}
                  <div className="flex justify-between">
                    <span className="text-white">Regular Hours:</span>
                    <span className="text-white font-medium">{schedule.hours || 8} hours/day</span>
                  </div>

                  {/* Total Days This Month */}
                  <div className="flex justify-between">
                    <span className="text-white">Working Days This Month:</span>
                    <span className="text-white font-medium">
                      {
                        Object.entries(dayStatus).filter(
                          ([_, status]) =>
                            status === "scheduled" || status === "attended" || status === "absent" || status === "late",
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end mt-auto">
                <button
                  className="bg-[#373A45] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  onClick={() => navigate("/payslip")}
                >
                  View Payslip
                </button>
              </div>
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
