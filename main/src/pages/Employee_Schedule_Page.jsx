"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react"
import NavBar from "../components/Nav_Bar"
import dayjs from "dayjs"
import { API_BASE_URL } from "../config/api"
import axios from "axios"

function EmployeeSchedulePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [calendarDays, setCalendarDays] = useState([])
  const [dayStatus, setDayStatus] = useState({})
  const [attendanceData, setAttendanceData] = useState({})
  const [holidays, setHolidays] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  const [shifts, setShifts] = useState([])

  // Check if user is logged in and is an employee
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    const userId = localStorage.getItem("user_id")
    const userRole = localStorage.getItem("user_role")

    if (!token) {
      navigate("/")
      return
    }

    if (userRole !== "employee") {
      navigate("/dashboard")
      return
    }

    // Fetch user info
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setUserInfo(data)
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
      }
    }

    fetchUserInfo()
  }, [navigate])

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
        }
      } catch (error) {
        console.error("Error fetching holidays:", error)
      }
    }

    fetchHolidays()
  }, [])

  // Fetch user's schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true)
        const accessToken = localStorage.getItem("access_token")
        const userId = localStorage.getItem("user_id")

        if (!accessToken || !userId) {
          throw new Error("Authentication required")
        }

        try {
          const response = await axios.get(`${API_BASE_URL}/schedule/?user_id=${userId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          })

          if (response.data && response.data.length > 0) {
            // Get the most recent schedule
            const userSchedules = response.data
              .filter((schedule) => schedule.user_id === Number.parseInt(userId))
              .sort((a, b) => b.id - a.id)

            if (userSchedules.length > 0) {
              const scheduleData = userSchedules[0]
              setSchedule(scheduleData)
              console.log("Found schedule:", scheduleData)
            } else {
              console.log("No schedule found for this user")
            }
          } else {
            console.log("No schedules found")
          }
        } catch (error) {
          console.error("Error fetching schedule:", error)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [])

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const userId = localStorage.getItem("user_id")
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
          console.log(`Received ${data.length} attendance records`)

          // Convert to a map of date -> status
          const attendanceMap = {}
          data.forEach((record) => {
            attendanceMap[record.date] = record.status.toLowerCase()
          })

          setAttendanceData(attendanceMap)
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)
      }
    }

    fetchAttendanceData()
  }, [currentDate])

  // Fetch shift details for the schedule
  useEffect(() => {
    const fetchShiftDetails = async () => {
      if (!schedule || !schedule.shift_ids || schedule.shift_ids.length === 0) return

      try {
        const accessToken = localStorage.getItem("access_token")
        const shiftPromises = schedule.shift_ids.map((shiftId) =>
          fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }).then((res) => (res.ok ? res.json() : null)),
        )

        const shiftsData = await Promise.all(shiftPromises)
        const validShifts = shiftsData.filter((shift) => shift !== null)
        setShifts(validShifts)
      } catch (error) {
        console.error("Error fetching shift details:", error)
      }
    }

    fetchShiftDetails()
  }, [schedule])

  // Generate calendar days
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
  }, [currentDate])

  // Update day status based on schedule and attendance
  useEffect(() => {
    if (!schedule || !shifts.length) return

    const newDayStatus = {}
    const today = dayjs()

    // Process holidays
    holidays.forEach((holiday) => {
      const dateStr = holiday.date
      if (dayjs(dateStr).month() === currentDate.month() && dayjs(dateStr).year() === currentDate.year()) {
        newDayStatus[dateStr] = holiday.holiday_type === "regular" ? "regularholiday" : "specialholiday"
      }
    })

    // Process schedule days
    shifts.forEach((shift) => {
      const dateStr = shift.date
      const date = dayjs(dateStr)

      // Only process dates from the current month
      if (date.month() === currentDate.month() && date.year() === currentDate.year()) {
        const dayOfWeek = date.format("dddd")
        const isPastDay = date.isBefore(today, "day")

        // Skip if already marked as a holiday
        if (newDayStatus[dateStr] === "regularholiday" || newDayStatus[dateStr] === "specialholiday") {
          return
        }

        // Check if this date has any special event status
        if (schedule.sickleave === dateStr) {
          newDayStatus[dateStr] = "sickleave"
        } else if (schedule.regularholiday && schedule.regularholiday.includes(dateStr)) {
          newDayStatus[dateStr] = "regularholiday"
        } else if (schedule.specialholiday && schedule.specialholiday.includes(dateStr)) {
          newDayStatus[dateStr] = "specialholiday"
        } else if (schedule.nightdiff && schedule.nightdiff.includes(dateStr)) {
          newDayStatus[dateStr] = "nightdiff"
        } else if (schedule.oncall && schedule.oncall.includes(dateStr)) {
          newDayStatus[dateStr] = "oncall"
        } else if (schedule.vacationleave && schedule.vacationleave.includes(dateStr)) {
          newDayStatus[dateStr] = "vacationleave"
        } else if (isPastDay && attendanceData[dateStr]) {
          // For past days with attendance data
          newDayStatus[dateStr] = attendanceData[dateStr] === "present" ? "attended" : "absent"
        } else if (isPastDay) {
          // Past days without attendance are marked as absent
          newDayStatus[dateStr] = "absent"
        } else {
          // Future scheduled days
          newDayStatus[dateStr] = "scheduled"
        }
      }
    })

    setDayStatus(newDayStatus)
  }, [currentDate, schedule, shifts, attendanceData, holidays])

  const handleMonthChange = (direction) => {
    const newDate = direction === "next" ? currentDate.add(1, "month") : currentDate.subtract(1, "month")
    setCurrentDate(newDate)
    setSelectedDate(dayjs(new Date(newDate.year(), newDate.month(), 1)))
  }

  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date)
    }
  }

  // Function to determine the background color of a calendar day based on its status
  const getDayStatusColor = (day) => {
    if (!day.isCurrentMonth) {
      return "bg-gray-400 text-white opacity-50" // Light gray for days outside the current month
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
      default:
        return "bg-white text-gray-700" // White for unscheduled days
    }
  }

  // Get shift details for selected date
  const getShiftForDate = (date) => {
    if (!shifts || !shifts.length) return null

    const dateStr = date.format("YYYY-MM-DD")
    return shifts.find((shift) => shift.date === dateStr)
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

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[80vh]">
          <div className="text-xl font-semibold text-gray-700">Loading your schedule...</div>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[80vh]">
          <div className="text-xl font-semibold text-red-500">{error}</div>
        </div>
      </div>
    )

  const selectedShift = selectedDate ? getShiftForDate(selectedDate) : null
  const selectedDateStr = selectedDate.format("YYYY-MM-DD")
  const selectedStatus = dayStatus[selectedDateStr]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar Panel */}
          <div className="bg-[#5C7346] rounded-lg p-6 w-full md:w-2/3 shadow-lg">
            {/* Header with month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                className="bg-[#3A4D2B] text-white px-3 py-1 rounded-md hover:bg-[#2a3b1d] transition-colors"
                onClick={() => handleMonthChange("prev")}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-white text-2xl md:text-3xl font-bold">{currentDate.format("MMMM YYYY")}</h2>
              <button
                className="bg-[#3A4D2B] text-white px-3 py-1 rounded-md hover:bg-[#2a3b1d] transition-colors"
                onClick={() => handleMonthChange("next")}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-white font-medium text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {calendarDays.map((day, index) => {
                const dateStr = day.date.format("YYYY-MM-DD")
                return (
                  <div
                    key={index}
                    className={`${getDayStatusColor(
                      day,
                    )} rounded-lg h-16 md:h-20 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90
                    ${
                      day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")
                        ? "ring-2 ring-white shadow-lg"
                        : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className="text-md md:text-lg font-bold">{day.dayOfMonth}</span>
                    {day.isCurrentMonth && shifts.some((shift) => shift.date === dateStr) && (
                      <div className="text-[10px] md:text-xs mt-1 px-1 text-center truncate w-full">
                        {formatTime(getShiftForDate(day.date)?.shift_start).split(" ")[0]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-200 mr-1"></div>
                <span className="text-white text-xs">Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-white text-xs">Attended</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-white text-xs">Absent</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-1"></div>
                <span className="text-white text-xs">Holiday</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></div>
                <span className="text-white text-xs">Sick Leave</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-400 mr-1"></div>
                <span className="text-white text-xs">Vacation</span>
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full md:w-1/3">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-[#5C7346]" />
              Schedule Details
            </h2>

            {schedule ? (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {selectedDate.format("dddd, MMMM D, YYYY")}
                  </h3>

                  {selectedShift ? (
                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600 font-medium">Shift Time:</span>
                        <span className="text-gray-800 font-semibold">
                          {formatTime(selectedShift.shift_start)} - {formatTime(selectedShift.shift_end)}-{" "}
                          {formatTime(selectedShift.shift_end)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Status:</span>
                        <span
                          className={`font-semibold ${
                            selectedStatus === "attended"
                              ? "text-green-600"
                              : selectedStatus === "absent"
                                ? "text-red-600"
                                : selectedStatus === "regularholiday" || selectedStatus === "specialholiday"
                                  ? "text-orange-600"
                                  : selectedStatus === "sickleave"
                                    ? "text-yellow-600"
                                    : selectedStatus === "vacationleave"
                                      ? "text-purple-600"
                                      : "text-blue-600"
                          }`}
                        >
                          {selectedStatus === "attended"
                            ? "Attended"
                            : selectedStatus === "absent"
                              ? "Absent"
                              : selectedStatus === "regularholiday"
                                ? "Regular Holiday"
                                : selectedStatus === "specialholiday"
                                  ? "Special Holiday"
                                  : selectedStatus === "sickleave"
                                    ? "Sick Leave"
                                    : selectedStatus === "vacationleave"
                                      ? "Vacation Leave"
                                      : selectedStatus === "nightdiff"
                                        ? "Night Differential"
                                        : selectedStatus === "oncall"
                                          ? "On Call"
                                          : selectedStatus === "scheduled"
                                            ? "Scheduled"
                                            : "Not Scheduled"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600">
                      No shift scheduled for this date
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Weekly Schedule</h3>
                  <div className="space-y-2">
                    {schedule.days && schedule.days.length > 0 ? (
                      schedule.days.map((day) => (
                        <div key={day} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span className="font-medium text-gray-700">{day}</span>
                          <span className="text-sm text-gray-600">
                            {/* Find a shift for this day of week to show typical hours */}
                            {(() => {
                              const dayShift = shifts.find((shift) => dayjs(shift.date).format("dddd") === day)
                              return dayShift
                                ? `${formatTime(dayShift.shift_start)} - ${formatTime(dayShift.shift_end)}`
                                : "Hours vary"
                            })()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-2">No regular schedule days set</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">No schedule information available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeSchedulePage
