"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { ArrowLeft, User2 } from "lucide-react"
import dayjs from "dayjs"

function Admin_Employee_Edit_Schedule_Page() {
  const { employeeId } = useParams()
  const navigate = useNavigate()

  // State for employee data
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for calendar and schedule
  const [currentDate, setCurrentDate] = useState(dayjs("2025-04-01"))
  const [selectedDate, setSelectedDate] = useState(null)
  const [schedule, setSchedule] = useState({
    user_id: employeeId,
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
  })

  // State for selected days and shifts
  const [selectedDays, setSelectedDays] = useState({
    S: false,
    M: false,
    T: false,
    W: false,
    T2: false,
    F: false,
    S2: false,
  })
  const [selectedShift, setSelectedShift] = useState("morning")
  const [customShiftStart, setCustomShiftStart] = useState("8:00 AM")
  const [customShiftEnd, setCustomShiftEnd] = useState("5:00 PM")

  // State for calendar data
  const [calendarDays, setCalendarDays] = useState([])
  const [dayStatus, setDayStatus] = useState({})

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true)
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`http://localhost:8000/api/v1/employment-info/${employeeId}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch employee data")
        }

        const data = await response.json()
        setEmployee(data)
      } catch (error) {
        console.error("Error fetching employee:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (employeeId) {
      fetchEmployeeData()
    }
  }, [employeeId])

  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`http://localhost:8000/api/v1/schedule/?user_id=${employeeId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            setSchedule(data[0])

            // Set selected days based on schedule
            const daysMap = {
              Monday: "M",
              Tuesday: "T",
              Wednesday: "W",
              Thursday: "T2",
              Friday: "F",
              Saturday: "S2",
              Sunday: "S",
            }

            const newSelectedDays = { ...selectedDays }
            data[0].days.forEach((day) => {
              newSelectedDays[daysMap[day]] = true
            })
            setSelectedDays(newSelectedDays)
          }
        }
      } catch (error) {
        console.error("Error fetching schedule:", error)
      }
    }

    if (employeeId) {
      fetchScheduleData()
    }
  }, [employeeId])

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
    dayObjects.forEach((day) => {
      if (day.isCurrentMonth) {
        const dateStr = day.date.format("YYYY-MM-DD")

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
        } else {
          // Default status based on whether it's a working day
          const dayOfWeek = day.date.format("dddd")
          if (schedule.days?.includes(dayOfWeek)) {
            newDayStatus[dateStr] = "attended"
          } else {
            newDayStatus[dateStr] = "absent"
          }
        }
      }
    })

    setDayStatus(newDayStatus)
  }, [currentDate, schedule])

  // Handle day click in calendar
  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date)
    }
  }

  // Handle day selection in schedule panel
  const handleDaySelection = (day) => {
    setSelectedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))
  }

  // Handle shift selection
  const handleShiftSelection = (shift) => {
    setSelectedShift(shift)
  }

  // Handle event selection for the selected date
  const handleEventSelection = (eventType) => {
    if (!selectedDate) return

    const dateStr = selectedDate.format("YYYY-MM-DD")
    const newSchedule = { ...schedule }

    // Remove the date from all event arrays first
    if (newSchedule.sickleave === dateStr) {
      newSchedule.sickleave = null
    }
    ;["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].forEach((field) => {
      if (newSchedule[field]?.includes(dateStr)) {
        newSchedule[field] = newSchedule[field].filter((d) => d !== dateStr)
      }
    })

    // Add the date to the selected event type
    if (eventType === "sickleave") {
      newSchedule.sickleave = dateStr
    } else if (["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].includes(eventType)) {
      if (!newSchedule[eventType]) {
        newSchedule[eventType] = []
      }
      newSchedule[eventType].push(dateStr)
    }

    setSchedule(newSchedule)

    // Update day status
    setDayStatus((prev) => ({
      ...prev,
      [dateStr]: eventType,
    }))
  }

  // Handle save schedule
  const handleSaveSchedule = async () => {
    try {
      // Convert selected days to array of day names
      const daysMap = {
        S: "Sunday",
        M: "Monday",
        T: "Tuesday",
        W: "Wednesday",
        T2: "Thursday",
        F: "Friday",
        S2: "Saturday",
      }

      const selectedDaysArray = Object.entries(selectedDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([day, _]) => daysMap[day])

      const updatedSchedule = {
        ...schedule,
        days: selectedDaysArray,
        payroll_period: currentDate.format("YYYY-MM-DD"),
        bi_weekly_start: currentDate.startOf("month").format("YYYY-MM-DD"),
      }

      const accessToken = localStorage.getItem("access_token")
      const method = schedule.id ? "PUT" : "POST"
      const url = schedule.id
        ? `http://localhost:8000/api/v1/schedule/${schedule.id}/`
        : "http://localhost:8000/api/v1/schedule/"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSchedule),
      })

      if (!response.ok) {
        throw new Error("Failed to save schedule")
      }

      alert("Schedule saved successfully")
    } catch (error) {
      console.error("Error saving schedule:", error)
      alert("Failed to save schedule: " + error.message)
    }
  }

  // Get status color for calendar day
  const getDayStatusColor = (day) => {
    if (!day.isCurrentMonth) return "bg-gray-200 text-gray-400"

    const dateStr = day.date.format("YYYY-MM-DD")
    const status = dayStatus[dateStr]

    switch (status) {
      case "attended":
        return "bg-green-500 text-white"
      case "absent":
        return "bg-red-500 text-white"
      case "sickleave":
      case "regularholiday":
      case "specialholiday":
      case "vacationleave":
        return "bg-orange-400 text-white"
      case "nightdiff":
        return "bg-blue-500 text-white"
      case "oncall":
        return "bg-purple-500 text-white"
      default:
        return "bg-white"
    }
  }

  // Get event label for selected date
  const getEventLabel = () => {
    if (!selectedDate) return null

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
      default:
        return selectedDate.format("D")
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Employee Schedule</h2>
            {employee && (
              <div className="text-white">
                <span className="font-medium">
                  {employee.first_name} {employee.last_name}
                </span>{" "}
                -<span className="ml-2">{employee.employee_number}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Calendar Section */}
            <div className="bg-[#5C7346] rounded-lg p-6 flex-1">
              <div className="text-white text-4xl font-bold mb-4">{currentDate.format("MMMM YYYY")}</div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                  <div key={day} className="text-white text-center py-2 text-sm">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`${getDayStatusColor(day)} rounded-lg h-16 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90 relative ${
                      selectedDate && day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className="text-lg font-medium">{day.dayOfMonth}</span>

                    {/* Event indicators */}
                    {day.isCurrentMonth &&
                      dayStatus[day.date.format("YYYY-MM-DD")] &&
                      dayStatus[day.date.format("YYYY-MM-DD")] !== "attended" &&
                      dayStatus[day.date.format("YYYY-MM-DD")] !== "absent" && (
                        <div className="absolute bottom-1 text-[9px] px-1 text-center">
                          {dayStatus[day.date.format("YYYY-MM-DD")] === "sickleave" && "sick leave"}
                          {dayStatus[day.date.format("YYYY-MM-DD")] === "specialholiday" && "special holiday"}
                          {dayStatus[day.date.format("YYYY-MM-DD")] === "regularholiday" && "regular holiday"}
                          {dayStatus[day.date.format("YYYY-MM-DD")] === "vacationleave" && "vacation leave"}
                          {dayStatus[day.date.format("YYYY-MM-DD")] === "nightdiff" && "night diff"}
                          {dayStatus[day.date.format("YYYY-MM-DD")] === "oncall" && "on call"}
                        </div>
                      )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex justify-center mt-4 space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-white text-sm">Attended</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-white text-sm">Absent</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-orange-400 mr-2"></div>
                  <span className="text-white text-sm">Events</span>
                </div>
              </div>
            </div>

            {/* Employee Schedule Panel */}
            <div className="bg-[#5C7346] rounded-lg p-6 md:w-80">
              {/* Employee Info */}
              <div className="flex flex-col items-center mb-6">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-2">
                  {employee?.profile_picture ? (
                    <img
                      src={employee.profile_picture || "/placeholder.svg"}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <User2 className="h-10 w-10" style={{ color: "#42573C" }} />
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {employee?.first_name} {employee?.last_name}
                </h3>
                <p className="text-sm text-white">{employee?.employee_number}</p>
              </div>

              {/* Schedule Section */}
              <div className="mb-6">
                <p className="text-sm font-bold mb-2 text-white">Schedule</p>
                <div className="bg-[#A3BC84] rounded-md p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white">APR 15</span>
                  </div>
                  <div className="flex justify-between">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                      const dayKey = index === 4 ? "T2" : index === 6 ? "S2" : day
                      return (
                        <div
                          key={day}
                          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                            selectedDays[dayKey] ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"
                          }`}
                          onClick={() => handleDaySelection(dayKey)}
                        >
                          {day}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Shifts Section */}
              <div className="mb-6">
                <p className="text-sm font-bold mb-2 text-white">Shifts</p>
                <div className="bg-[#A3BC84] rounded-md p-4">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      className={`py-1 px-2 rounded text-xs ${selectedShift === "morning" ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"}`}
                      onClick={() => handleShiftSelection("morning")}
                    >
                      Morning
                      <div className="text-[10px]">10 AM - 7 PM</div>
                    </button>
                    <button
                      className={`py-1 px-2 rounded text-xs ${selectedShift === "midday" ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"}`}
                      onClick={() => handleShiftSelection("midday")}
                    >
                      Midday
                      <div className="text-[10px]">12 PM - 9 PM</div>
                    </button>
                    <button
                      className={`py-1 px-2 rounded text-xs ${selectedShift === "night" ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"}`}
                      onClick={() => handleShiftSelection("night")}
                    >
                      Night
                      <div className="text-[10px]">7 PM - 11 PM</div>
                    </button>
                    <button
                      className={`py-1 px-2 rounded text-xs ${selectedShift === "custom" ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"}`}
                      onClick={() => handleShiftSelection("custom")}
                    >
                      Custom
                    </button>
                  </div>

                  {selectedShift === "custom" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customShiftStart}
                        onChange={(e) => setCustomShiftStart(e.target.value)}
                        className="py-1 px-2 rounded text-xs bg-white text-[#5C7346]"
                      />
                      <input
                        type="text"
                        value={customShiftEnd}
                        onChange={(e) => setCustomShiftEnd(e.target.value)}
                        className="py-1 px-2 rounded text-xs bg-white text-[#5C7346]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Events Section */}
              <div className="mb-6">
                <p className="text-sm font-bold mb-2 text-white">Events</p>
                <div className="bg-[#A3BC84] rounded-md p-4">
                  <div className="flex flex-col">
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-white">{selectedDate ? getEventLabel() : "-"}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="regularHoliday"
                          name="eventType"
                          className="mr-1"
                          checked={selectedDate && dayStatus[selectedDate.format("YYYY-MM-DD")] === "regularholiday"}
                          onChange={() => handleEventSelection("regularholiday")}
                          disabled={!selectedDate}
                        />
                        <label htmlFor="regularHoliday" className="text-white">
                          Regular Holiday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="sickLeave"
                          name="eventType"
                          className="mr-1"
                          checked={selectedDate && dayStatus[selectedDate.format("YYYY-MM-DD")] === "sickleave"}
                          onChange={() => handleEventSelection("sickleave")}
                          disabled={!selectedDate}
                        />
                        <label htmlFor="sickLeave" className="text-white">
                          Sick leave
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="specialHoliday"
                          name="eventType"
                          className="mr-1"
                          checked={selectedDate && dayStatus[selectedDate.format("YYYY-MM-DD")] === "specialholiday"}
                          onChange={() => handleEventSelection("specialholiday")}
                          disabled={!selectedDate}
                        />
                        <label htmlFor="specialHoliday" className="text-white">
                          Special Holiday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="onCall"
                          name="eventType"
                          className="mr-1"
                          checked={selectedDate && dayStatus[selectedDate.format("YYYY-MM-DD")] === "oncall"}
                          onChange={() => handleEventSelection("oncall")}
                          disabled={!selectedDate}
                        />
                        <label htmlFor="onCall" className="text-white">
                          Oncall
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="restDay"
                          name="eventType"
                          className="mr-1"
                          checked={selectedDate && dayStatus[selectedDate.format("YYYY-MM-DD")] === "absent"}
                          onChange={() => handleEventSelection("absent")}
                          disabled={!selectedDate}
                        />
                        <label htmlFor="restDay" className="text-white">
                          Rest Day
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="nightDiff"
                          name="eventType"
                          className="mr-1"
                          checked={selectedDate && dayStatus[selectedDate.format("YYYY-MM-DD")] === "nightdiff"}
                          onChange={() => handleEventSelection("nightdiff")}
                          disabled={!selectedDate}
                        />
                        <label htmlFor="nightDiff" className="text-white">
                          Nightdiff
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="vacationLeave"
                          name="eventType"
                          className="mr-1"
                          checked={selectedDate && dayStatus[selectedDate.format("YYYY-MM-DD")] === "vacationleave"}
                          onChange={() => handleEventSelection("vacationleave")}
                          disabled={!selectedDate}
                        />
                        <label htmlFor="vacationLeave" className="text-white">
                          Vacation Leave
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  className="bg-[#373A45] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  onClick={() => navigate(`/payslip?employeeId=${employeeId}`)}
                >
                  Payslip
                </button>
                <button
                  className="bg-[#373A45] text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  onClick={handleSaveSchedule}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <button
              className="flex items-center gap-2 bg-[#373A45] text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin_Employee_Edit_Schedule_Page

