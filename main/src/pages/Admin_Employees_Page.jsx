"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { ArrowLeft, ArrowRight, User2, Calendar, Clock, CheckSquare } from "lucide-react"
import dayjs from "dayjs"
import { API_BASE_URL } from "../config/api"

function AdminEmployeeEditSchedulePage() {
  // All the existing code remains the same...

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
    user_id: null, // We'll set this after fetching employee data
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

  // State for selected days and shifts - start with none selected
  const [selectedDays, setSelectedDays] = useState({
    S: false,
    M: false,
    T: false,
    W: false,
    T2: false,
    F: false,
    S2: false,
  })
  const [selectedShift, setSelectedShift] = useState("")
  const [customShiftStart, setCustomShiftStart] = useState("8:00 AM")
  const [customShiftEnd, setCustomShiftEnd] = useState("5:00 PM")

  // State for calendar data
  const [calendarDays, setCalendarDays] = useState([])
  const [dayStatus, setDayStatus] = useState({})
  const [shifts, setShifts] = useState([])
  const [attendanceData, setAttendanceData] = useState({})

  // State to track if we're currently processing shifts to prevent duplicates
  const [isProcessingShifts, setIsProcessingShifts] = useState(false)

  const navigate = useNavigate()
  const { employeeId } = useParams()

  const handleMonthChange = (direction) => {
    if (direction === "prev") {
      setCurrentDate(currentDate.subtract(1, "month"))
    } else {
      setCurrentDate(currentDate.add(1, "month"))
    }
  }

  const getDayStatusColor = (day) => {
    if (!day.isCurrentMonth) {
      return "bg-gray-100 text-gray-400" // Light gray for days outside the current month
    }

    const dateStr = day.date.format("YYYY-MM-DD")
    const status = dayStatus[dateStr]

    if (status === "attended") {
      return "bg-green-500 text-white" // Green for attended
    } else if (status === "absent") {
      return "bg-red-500 text-white" // Red for absent
    } else if (
      status === "sickleave" ||
      status === "specialholiday" ||
      status === "regularholiday" ||
      status === "vacationleave" ||
      status === "nightdiff" ||
      status === "oncall"
    ) {
      return "bg-orange-400 text-white" // Orange for events
    } else if (status === "selected") {
      return "bg-blue-200 text-black" // Blue for selected
    } else {
      return "bg-white text-gray-700" // Default white for other days
    }
  }

  const handleDayClick = (day) => {
    setSelectedDate(day.date)
  }

  const handleDaySelection = (day) => {
    setSelectedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))
  }

  const handleShiftSelection = (shift) => {
    setSelectedShift(shift === selectedShift ? "" : shift)
  }

  const getEventStatus = (eventType) => {
    const dateStr = selectedDate.format("YYYY-MM-DD")
    return dayStatus[dateStr] === eventType
  }

  const handleEventSelection = (eventType) => {
    const dateStr = selectedDate.format("YYYY-MM-DD")

    setDayStatus((prev) => {
      const newDayStatus = { ...prev }

      // If the event is already selected, unselect it
      if (newDayStatus[dateStr] === eventType) {
        newDayStatus[dateStr] = "unselected" // Or null, depending on your default
      } else {
        // Otherwise, select the new event
        newDayStatus[dateStr] = eventType
      }

      return newDayStatus
    })
  }

  const handleSaveSchedule = async () => {
    // Prepare the data to be sent to the API
    const scheduleData = {
      user_id: employee.id,
      days: Object.keys(selectedDays).filter((day) => selectedDays[day]),
      shift_type: selectedShift === "custom" ? "custom" : selectedShift,
      shift_start: selectedShift === "custom" ? customShiftStart : null,
      shift_end: selectedShift === "custom" ? customShiftEnd : null,
      events: Object.entries(dayStatus)
        .filter(([date, status]) => status !== "unselected")
        .map(([date, status]) => ({ date, type: status })),
    }

    try {
      // Make the API call to save the schedule
      const response = await fetch(`${API_BASE_URL}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      })

      if (response.ok) {
        // Schedule saved successfully
        alert("Schedule saved successfully!")
      } else {
        // Handle error
        console.error("Failed to save schedule:", response.statusText)
        alert("Failed to save schedule.")
      }
    } catch (error) {
      // Handle network errors
      console.error("Network error:", error)
      alert("Network error occurred while saving schedule.")
    }
  }

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/users/${employeeId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setEmployee(data)
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [employeeId])

  useEffect(() => {
    const generateCalendarDays = () => {
      const firstDayOfMonth = currentDate.clone().startOf("month")
      const lastDayOfMonth = currentDate.clone().endOf("month")

      const dayOfWeek = firstDayOfMonth.day() // 0 (Sunday) to 6 (Saturday)
      const calendarDays = []

      // Add the last days of the previous month to fill the first week
      for (let i = 0; i < dayOfWeek; i++) {
        const day = firstDayOfMonth.clone().subtract(dayOfWeek - i, "days")
        calendarDays.push({
          date: day,
          dayOfMonth: day.format("D"),
          isCurrentMonth: false,
        })
      }

      // Add all days of the current month
      const currentDay = firstDayOfMonth.clone()
      while (currentDay <= lastDayOfMonth) {
        calendarDays.push({
          date: currentDay.clone(),
          dayOfMonth: currentDay.format("D"),
          isCurrentMonth: true,
        })
        currentDay.add(1, "day")
      }

      // Add the first days of the next month to fill the last week
      while (calendarDays.length % 7 !== 0) {
        const day = lastDayOfMonth.clone().add(calendarDays.length % 7, "days")
        calendarDays.push({
          date: day,
          dayOfMonth: day.format("D"),
          isCurrentMonth: false,
        })
      }

      setCalendarDays(calendarDays)
    }

    generateCalendarDays()
  }, [currentDate])

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/attendances`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()

        // Transform the attendance data into a more usable format
        const transformedData = {}
        data.forEach((item) => {
          const date = dayjs(item.date).format("YYYY-MM-DD")
          transformedData[date] = item.status
        })

        setAttendanceData(transformedData)
      } catch (error) {
        console.error("Failed to fetch attendance data:", error)
      }
    }

    fetchAttendanceData()
  }, [])

  useEffect(() => {
    // Update dayStatus based on attendanceData
    const newDayStatus = {}
    calendarDays.forEach((day) => {
      if (day.isCurrentMonth) {
        const dateStr = day.date.format("YYYY-MM-DD")
        if (attendanceData[dateStr]) {
          newDayStatus[dateStr] = attendanceData[dateStr] // Set status from attendance data
        } else {
          newDayStatus[dateStr] = "unselected" // Default status
        }
      }
    })
    setDayStatus(newDayStatus)
  }, [calendarDays, attendanceData])

  // Only modifying the return statement to update the Custom Shift Selection section

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

                  return (
                    <div
                      key={index}
                      className={`${getDayStatusColor(
                        day,
                      )} rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90 relative p-2 sm:p-3 md:p-4
                      ${
                        day.date.format("YYYY-MM-DD") === currentDate.format("YYYY-MM-DD")
                          ? "ring-4 ring-blue-500 font-bold shadow-lg"
                          : ""
                      }`}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className="text-md sm:text-lg md:text-xl font-bold">{day.dayOfMonth}</span>

                      {/* Event indicators */}
                      {day.isCurrentMonth && status && status !== "attended" && status !== "absent" && (
                        <div className="absolute bottom-[-2px] left-0 right-0 text-center">
                          <span className="text-xs md:text-sm px-2 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-full">
                            {status === "sickleave" && "Sick Leave"}
                            {status === "specialholiday" && "Special Holiday"}
                            {status === "regularholiday" && "Regular Holiday"}
                            {status === "vacationleave" && "Vacation Leave"}
                            {status === "nightdiff" && "Night Differential"}
                            {status === "oncall" && "On Call"}
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
                  <span className="text-white text-md">Events</span>
                </div>
              </div>
            </div>

            {/* Employee Schedule Panel - Fixed size with max-height */}
            <div className="bg-[#3A4D2B] rounded-lg p-4 lg:w-1/3 h-auto max-h-[800px] overflow-auto flex flex-col">
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
                      : employee && employee.user && employee.user.first_name && employee.user.last_name
                        ? `${employee.user.first_name} ${employee.user.last_name}`
                        : "Employee"}
                  </h3>
                  <p className="text-md text-white">
                    {employee?.employee_id || employee?.user?.id || employeeId || ""}
                  </p>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-white mr-2" />
                  <p className="text-md font-bold text-white">Schedule</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {/* Days of week selector - improved design */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                      const dayKey = index === 4 ? "T2" : index === 6 ? "S2" : day
                      return (
                        <button
                          key={day}
                          className={`h-8 rounded-lg flex items-center justify-center text-md font-medium transition-all ${
                            selectedDays[dayKey]
                              ? "bg-white text-[#5C7346]"
                              : "bg-[#5C7346] text-white hover:bg-opacity-80"
                          }`}
                          onClick={() => handleDaySelection(dayKey)}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Shift Section */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-white mr-2" />
                  <p className="text-md font-bold text-white">Shifts</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {/* Main shift buttons - more responsive grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                    {["morning", "midday", "night"].map((shift) => (
                      <button
                        key={shift}
                        className={`py-2 px-2 w-full rounded-md text-sm font-medium transition-all ${
                          selectedShift === shift
                            ? "bg-white text-[#5C7346]"
                            : "bg-[#5C7346] text-white hover:bg-opacity-80"
                        }`}
                        onClick={() => handleShiftSelection(shift)}
                      >
                        <span className="text-lg font-bold capitalize">{shift}</span>
                        <span className="text-xs block mt-1 opacity-80">
                          {shift === "morning" ? "10 AM - 7 PM" : shift === "midday" ? "12 PM - 9 PM" : "7 PM - 11 PM"}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Shift Selection - UPDATED to hide time inputs until custom is selected */}
                  <div>
                    {selectedShift === "custom" ? (
                      <div className="space-y-2">
                        {/* Custom button with selected state */}
                        <button
                          className="py-2 px-3 w-full rounded-md text-sm font-medium bg-white text-[#5C7346]"
                          onClick={() => handleShiftSelection("custom")}
                        >
                          <span className="text-lg font-bold">Custom</span>
                        </button>

                        {/* Time inputs shown when custom is selected */}
                        <div className="flex items-center gap-2 bg-[#5C7346] p-2 rounded-md">
                          <input
                            type="time"
                            value={customShiftStart}
                            onChange={(e) => setCustomShiftStart(e.target.value)}
                            className="py-1 px-2 text-sm bg-white text-[#5C7346] border border-gray-400 rounded-md focus:outline-none flex-1 min-w-0"
                          />
                          <span className="text-white text-sm font-medium">-</span>
                          <input
                            type="time"
                            value={customShiftEnd}
                            onChange={(e) => setCustomShiftEnd(e.target.value)}
                            className="py-1 px-2 text-sm bg-white text-[#5C7346] border border-gray-400 rounded-md focus:outline-none flex-1 min-w-0"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Just show the custom button when not selected */
                      <button
                        className="py-2 px-3 w-full rounded-md text-sm font-medium bg-[#5C7346] text-white hover:bg-opacity-80"
                        onClick={() => handleShiftSelection("custom")}
                      >
                        <span className="text-lg font-bold">Custom</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Events Section - More compact */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <CheckSquare className="h-5 w-5 text-white mr-2" />
                  <p className="text-md font-bold text-white">Events</p>
                </div>
                <div className="bg-[#A3BC84] rounded-md p-3">
                  {/* Selected date display with fixed layout */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xl font-bold text-white">
                      {/* Event type goes here */}
                      {(() => {
                        const dateStr = selectedDate.format("YYYY-MM-DD")
                        const status = dayStatus[dateStr]

                        if (
                          !status ||
                          status === "unselected" ||
                          status === "selected" ||
                          status === "attended" ||
                          status === "absent"
                        ) {
                          return "No Event"
                        }

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
                            return "No Event"
                        }
                      })()}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {/* Date is fixed on the right */}
                      {selectedDate.format("MMMM D")}
                    </div>
                  </div>

                  {/* Event options in a more compact grid */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      {
                        id: "regularHoliday",
                        label: "Regular Holiday",
                        type: "regularholiday",
                      },
                      {
                        id: "sickLeave",
                        label: "Sick Leave",
                        type: "sickleave",
                      },
                      {
                        id: "specialHoliday",
                        label: "Special Holiday",
                        type: "specialholiday",
                      },
                      { id: "onCall", label: "Oncall", type: "oncall" },
                      { id: "restDay", label: "Rest Day", type: "absent" },
                      {
                        id: "nightDiff",
                        label: "Nightdiff",
                        type: "nightdiff",
                      },
                      {
                        id: "vacationLeave",
                        label: "Vacation Leave",
                        type: "vacationleave",
                      },
                    ].map((event) => (
                      <label
                        key={event.id}
                        htmlFor={event.id}
                        className={`flex items-center p-2 rounded-md cursor-pointer transition-all ${
                          getEventStatus(event.type)
                            ? "bg-white text-[#5C7346]"
                            : "bg-[#5C7346] text-white hover:bg-opacity-90"
                        }`}
                      >
                        <input
                          type="checkbox"
                          id={event.id}
                          checked={getEventStatus(event.type)}
                          onChange={() => handleEventSelection(event.type)}
                          className="mr-4 h-4 w-4 accent-[#5C7346] cursor-pointer"
                        />
                        <span className="text-md font-medium">{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end">
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
        </div>
      </div>
    </div>
  )
}

export default AdminEmployeeEditSchedulePage

