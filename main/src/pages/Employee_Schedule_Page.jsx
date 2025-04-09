"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { API_BASE_URL } from "../config/api"
import axios from "axios"
import dayjs from "dayjs"
import { ChevronLeft, ChevronRight, User, Calendar, Clock, AlertCircle } from "lucide-react"

function EmployeeSchedulePage() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [schedule, setSchedule] = useState([])
  const [employeeInfo, setEmployeeInfo] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [biometricData, setBiometricData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shifts, setShifts] = useState([])

  // Fetch employee data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const userId = localStorage.getItem("user_id")
        const token = localStorage.getItem("access_token")

        if (!userId || !token) {
          navigate("/", { replace: true })
          return
        }

        // Fetch employee info
        const employeeResponse = await axios.get(`${API_BASE_URL}/users/${userId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setEmployeeInfo(employeeResponse.data)

        // Fetch employee schedule
        const scheduleResponse = await axios.get(`${API_BASE_URL}/schedule/?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (scheduleResponse.data && scheduleResponse.data.length > 0) {
          // Get the most recent schedule
          const userSchedules = scheduleResponse.data
            .filter((schedule) => schedule.user_id === Number.parseInt(userId))
            .sort((a, b) => b.id - a.id)

          if (userSchedules.length > 0) {
            setSchedule(userSchedules[0])
            console.log("Found schedule:", userSchedules[0])
          }
        }

        // Fetch attendance data
        const startDate = currentMonth.startOf("month").format("YYYY-MM-DD")
        const endDate = currentMonth.endOf("month").format("YYYY-MM-DD")

        const attendanceResponse = await axios.get(
          `${API_BASE_URL}/attendance/?user=${userId}&date_after=${startDate}&date_before=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        setAttendanceData(attendanceResponse.data)

        // Fetch biometric data
        const biometricResponse = await axios.get(
          `${API_BASE_URL}/biometricdata/?user=${userId}&date_after=${startDate}&date_before=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        setBiometricData(biometricResponse.data)

        // Fetch shifts
        const shiftsResponse = await axios.get(`${API_BASE_URL}/shift/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setShifts(shiftsResponse.data)
        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load schedule data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, currentMonth])

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"))
  }

  // Get days in current month view
  const getDaysInMonth = () => {
    const monthStart = currentMonth.startOf("month")
    const monthEnd = currentMonth.endOf("month")
    const startDay = monthStart.day() // 0 for Sunday, 1 for Monday, etc.

    const days = []

    // Add days from previous month to fill the first week
    for (let i = 0; i < startDay; i++) {
      days.push({
        date: monthStart.subtract(startDay - i, "day"),
        isCurrentMonth: false,
      })
    }

    // Add all days of current month
    for (let i = 1; i <= monthEnd.date(); i++) {
      days.push({
        date: dayjs(new Date(currentMonth.year(), currentMonth.month(), i)),
        isCurrentMonth: true,
      })
    }

    // Add days from next month to fill the last week
    const endDay = monthEnd.day() // 0-6
    for (let i = 1; i < 7 - endDay; i++) {
      days.push({
        date: monthEnd.add(i, "day"),
        isCurrentMonth: false,
      })
    }

    return days
  }

  // Get day status (scheduled, attended, absent, etc.)
  const getDayStatus = (date) => {
    const dateStr = date.format("YYYY-MM-DD")

    // Check attendance data
    const attendance = attendanceData.find((item) => item.date === dateStr)
    if (attendance) {
      return attendance.status.toLowerCase() // 'present' or 'absent'
    }

    // Check if day is in schedule
    if (schedule && schedule.days) {
      const dayOfWeek = date.format("dddd").toLowerCase()
      if (schedule.days.includes(dayOfWeek)) {
        return "scheduled"
      }
    }

    // Check for special events
    if (schedule) {
      if (schedule.regularholiday && schedule.regularholiday.includes(dateStr)) {
        return "regularholiday"
      }
      if (schedule.specialholiday && schedule.specialholiday.includes(dateStr)) {
        return "specialholiday"
      }
      if (schedule.sickleave && schedule.sickleave.includes(dateStr)) {
        return "sickleave"
      }
      if (schedule.vacationleave && schedule.vacationleave.includes(dateStr)) {
        return "vacationleave"
      }
      if (schedule.nightdiff && schedule.nightdiff.includes(dateStr)) {
        return "nightdiff"
      }
      if (schedule.oncall && schedule.oncall.includes(dateStr)) {
        return "oncall"
      }
      if (schedule.restday && schedule.restday.includes(dateStr)) {
        return "restday"
      }
    }

    return null
  }

  // Get status color class
  const getStatusColorClass = (day) => {
    if (!day.isCurrentMonth) {
      return "bg-gray-200 text-gray-400" // Different month
    }

    if (day.date.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD")) {
      return "border-2 border-blue-500" // Today
    }

    if (day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")) {
      return "border-2 border-blue-500" // Selected date
    }

    const status = getDayStatus(day.date)

    switch (status) {
      case "present":
        return "bg-green-500 text-white" // Green for attended
      case "absent":
        return "bg-red-500 text-white" // Red for absent
      case "scheduled":
        return "bg-blue-100 text-blue-800" // Light blue for scheduled
      case "regularholiday":
      case "specialholiday":
        return "bg-orange-100 text-orange-800" // Orange for holiday
      case "sickleave":
        return "bg-yellow-100 text-yellow-800" // Yellow for sick leave
      case "vacationleave":
        return "bg-purple-100 text-purple-800" // Purple for vacation
      case "nightdiff":
        return "bg-indigo-100 text-indigo-800" // Indigo for night diff
      case "oncall":
        return "bg-teal-100 text-teal-800" // Teal for on call
      case "restday":
        return "bg-gray-100 text-gray-800" // Gray for rest day
      default:
        return "bg-white" // Default
    }
  }

  // Get shift for selected date
  const getShiftForDate = (date) => {
    if (!schedule || !schedule.shift_ids) return null

    const dateStr = date.format("YYYY-MM-DD")
    const dayOfWeek = date.format("dddd").toLowerCase()

    // Check if this day is in the employee's schedule
    if (schedule.days && schedule.days.includes(dayOfWeek)) {
      // Find the shift for this day
      const shiftId = schedule.shift_ids.find((id) => {
        const shift = shifts.find((s) => s.id === id)
        return shift && shift.days && shift.days.includes(dayOfWeek)
      })

      if (shiftId) {
        return shifts.find((s) => s.id === shiftId)
      }
    }

    return null
  }

  // Format time (HH:MM:SS to HH:MM AM/PM)
  const formatTime = (timeString) => {
    if (!timeString) return ""

    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12

    return `${hour12}:${minutes} ${ampm}`
  }

  // Handle day selection
  const handleDayClick = (day) => {
    setSelectedDate(day.date)
  }

  // Get event type for selected date
  const getEventType = (date) => {
    const dateStr = date.format("YYYY-MM-DD")
    const status = getDayStatus(date)

    switch (status) {
      case "present":
        return "Attended"
      case "absent":
        return "Absent"
      case "scheduled":
        return "Scheduled"
      case "regularholiday":
        return "Regular Holiday"
      case "specialholiday":
        return "Special Holiday"
      case "sickleave":
        return "Sick Leave"
      case "vacationleave":
        return "Vacation Leave"
      case "nightdiff":
        return "Night Differential"
      case "oncall":
        return "On Call"
      case "restday":
        return "Rest Day"
      default:
        return "No Event"
    }
  }

  // Get biometric data for selected date
  const getBiometricForDate = (date) => {
    const dateStr = date.format("YYYY-MM-DD")
    return biometricData.filter((item) => item.date === dateStr)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex justify-center items-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex justify-center items-center h-[80vh]">
          <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">{error}</div>
        </div>
      </div>
    )
  }

  const selectedShift = getShiftForDate(selectedDate)
  const eventType = getEventType(selectedDate)
  const biometricRecords = getBiometricForDate(selectedDate)

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="flex flex-col md:flex-row p-4 gap-4">
        {/* Calendar Panel */}
        <div className="bg-[#5C7346] rounded-lg p-4 md:w-2/3">
          {/* Back button */}
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-[#3A4D2B] text-white px-4 py-2 rounded-md flex items-center"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
          </div>

          {/* Month navigation */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="bg-[#3A4D2B] text-white p-2 rounded-md">
              <ChevronLeft size={24} />
            </button>

            <h2 className="text-white text-3xl font-bold">{currentMonth.format("MMMM YYYY")}</h2>

            <button onClick={nextMonth} className="bg-[#3A4D2B] text-white p-2 rounded-md">
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
              <div key={day} className="text-white font-medium text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, index) => (
              <div
                key={index}
                className={`${getStatusColorClass(day)} rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90`}
                onClick={() => handleDayClick(day)}
              >
                <span className="text-lg font-bold">{day.date.format("D")}</span>
                {getDayStatus(day.date) && <div className="text-xs mt-1">{getShiftForDate(day.date)?.name || ""}</div>}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-white text-sm">Attended</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-white text-sm">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-100 mr-2"></div>
              <span className="text-white text-sm">Scheduled</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-300 mr-2"></div>
              <span className="text-white text-sm">Events</span>
            </div>
          </div>
        </div>

        {/* Employee Info Panel */}
        <div className="bg-[#5C7346] rounded-lg p-4 md:w-1/3">
          {/* Employee info */}
          {employeeInfo && (
            <div className="bg-[#5C7346] rounded-lg p-4 mb-4">
              <div className="flex items-center mb-4">
                <div className="bg-white rounded-full p-2 mr-4">
                  <User size={32} className="text-[#5C7346]" />
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">
                    {employeeInfo.first_name} {employeeInfo.last_name}
                  </h3>
                  <p className="text-white text-sm">{employeeInfo.employee_number || employeeInfo.id}</p>
                </div>
              </div>
            </div>
          )}

          {/* Schedule section */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Calendar className="text-white mr-2" />
              <h3 className="text-white text-lg font-bold">Schedule</h3>
            </div>

            <div className="bg-[#5C7346] bg-opacity-50 p-2 rounded-lg">
              <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                  const isScheduled =
                    schedule &&
                    schedule.days &&
                    schedule.days.includes(
                      ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][index],
                    )
                  return (
                    <div
                      key={index}
                      className={`${isScheduled ? "bg-blue-100 text-blue-800" : "bg-[#5C7346]"} text-white text-center py-1 rounded`}
                    >
                      {day}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Shifts section */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Clock className="text-white mr-2" />
              <h3 className="text-white text-lg font-bold">Shifts</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {shifts.slice(0, 3).map((shift, index) => (
                <div key={index} className="bg-[#5C7346] bg-opacity-50 p-2 rounded-lg">
                  <h4 className="text-white text-center font-medium">{shift.name}</h4>
                  <p className="text-white text-xs text-center">
                    {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-[#5C7346] bg-opacity-50 p-2 rounded-lg">
              <h4 className="text-white text-center font-medium">Custom</h4>
            </div>
          </div>

          {/* Events section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Calendar className="text-white mr-2" />
                <h3 className="text-white text-lg font-bold">Events</h3>
              </div>
              <div className="text-white">{selectedDate.format("MMMM D")}</div>
            </div>

            <div className="bg-[#5C7346] bg-opacity-30 p-4 rounded-lg">
              <h4 className="text-white text-lg font-medium mb-4">{eventType}</h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked={eventType === "Regular Holiday"} readOnly />
                  <span className="text-white">Regular Holiday</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked={eventType === "Sick Leave"} readOnly />
                  <span className="text-white">Sick Leave</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked={eventType === "Special Holiday"} readOnly />
                  <span className="text-white">Special Holiday</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked={eventType === "On Call"} readOnly />
                  <span className="text-white">Oncall</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked={eventType === "Rest Day"} readOnly />
                  <span className="text-white">Rest Day</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked={eventType === "Night Differential"} readOnly />
                  <span className="text-white">Nightdiff</span>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" checked={eventType === "Vacation Leave"} readOnly />
                  <span className="text-white">Vacation Leave</span>
                </div>
              </div>
            </div>
          </div>

          {/* Biometric Data */}
          {biometricRecords.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="text-white mr-2" />
                <h3 className="text-white text-lg font-bold">Biometric Data</h3>
              </div>

              <div className="bg-[#5C7346] bg-opacity-30 p-4 rounded-lg">
                {biometricRecords.map((record, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="flex justify-between">
                      <span className="text-white">Time In:</span>
                      <span className="text-white font-medium">{formatTime(record.time_in)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Time Out:</span>
                      <span className="text-white font-medium">{formatTime(record.time_out)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between mt-6">
            <button className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center opacity-50" disabled>
              Delete
            </button>

            <button className="bg-blue-800 text-white px-4 py-2 rounded-md" onClick={() => navigate("/payslip")}>
              Payslip
            </button>

            <button className="bg-green-600 text-white px-4 py-2 rounded-md opacity-50" disabled>
              Save Events Only
            </button>
          </div>

          <div className="flex justify-end mt-4">
            <button className="bg-gray-800 text-white px-6 py-2 rounded-md opacity-50" disabled>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeSchedulePage
