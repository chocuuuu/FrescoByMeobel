"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { ArrowLeft, User2 } from "lucide-react"
import dayjs from "dayjs"

function AdminEmployeeEditSchedulePage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()

  // State for employee data
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for calendar and schedule
  const currentMonthYear = dayjs().format("MMMM YYYY")
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

  // State to track if we're currently processing shifts to prevent duplicates
  const [isProcessingShifts, setIsProcessingShifts] = useState(false)

  // Dummy functions for generateShiftsForDay and removeShiftsForDay
  // Replace these with your actual implementation
  const generateShiftsForDay = async (dayName) => {
    console.log(`Generating shifts for ${dayName}`)
    // Implement your logic here to generate shifts
    return Promise.resolve()
  }

  const removeShiftsForDay = async (dayName) => {
    console.log(`Removing shifts for ${dayName}`)
    // Implement your logic here to remove shifts
    return Promise.resolve()
  }

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

        // Update schedule with the correct user_id
        setSchedule((prev) => ({
          ...prev,
          user_id: data.user?.id || null,
        }))
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

  // Fetch shifts data
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`http://localhost:8000/api/v1/shifts/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setShifts(data)
        }
      } catch (error) {
        console.error("Error fetching shifts:", error)
      }
    }

    fetchShifts()
  }, [])

  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        // Reset schedule state first to avoid showing previous employee's data
        setSchedule({
          id: null,
          user_id: employee?.user?.id || null,
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

        // Reset selected days to none selected
        setSelectedDays({
          S: false,
          M: false,
          T: false,
          W: false,
          T2: false,
          F: false,
          S2: false,
        })

        // Reset selected shift
        setSelectedShift("")

        const accessToken = localStorage.getItem("access_token")
        console.log(`Fetching schedule for employee ID: ${employeeId}`)

        const response = await fetch(`http://localhost:8000/api/v1/schedule/?user_id=${employeeId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`Fetched schedule data for employee ${employeeId}:`, data)

          if (data && data.length > 0) {
            const scheduleData = data[0]

            // Verify this schedule belongs to the current employee
            if (scheduleData.user_id === Number.parseInt(employeeId) || scheduleData.user_id === employee?.user?.id) {
              setSchedule(scheduleData)

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

              const newSelectedDays = {
                S: false,
                M: false,
                T: false,
                W: false,
                T2: false,
                F: false,
                S2: false,
              }

              scheduleData.days.forEach((day) => {
                if (daysMap[day]) {
                  newSelectedDays[daysMap[day]] = true
                }
              })

              setSelectedDays(newSelectedDays)

              // Determine shift type based on shift_ids
              if (scheduleData.shift_ids && scheduleData.shift_ids.length > 0) {
                // Fetch the first shift to determine the type
                try {
                  const shiftResponse = await fetch(
                    `http://localhost:8000/api/v1/shift/${scheduleData.shift_ids[0]}/`,
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                      },
                    },
                  )

                  if (shiftResponse.ok) {
                    const shiftData = await shiftResponse.json()

                    // Determine shift type based on start/end times
                    const startTime = shiftData.shift_start
                    const endTime = shiftData.shift_end

                    if (startTime === "10:00:00" && endTime === "19:00:00") {
                      setSelectedShift("morning")
                    } else if (startTime === "12:00:00" && endTime === "21:00:00") {
                      setSelectedShift("midday")
                    } else if (startTime === "19:00:00" && endTime === "23:00:00") {
                      setSelectedShift("night")
                    } else {
                      setSelectedShift("custom")
                      // Convert 24h format to 12h format for display
                      setCustomShiftStart(convertTimeFormatToTimeString(startTime))
                      setCustomShiftEnd(convertTimeFormatToTimeString(endTime))
                    }
                  }
                } catch (error) {
                  console.error("Error fetching shift details:", error)
                }
              }
            } else {
              console.warn(`Received schedule for user_id ${scheduleData.user_id} but expected ${employeeId}`)
            }
          } else {
            console.log(`No schedule found for employee ${employeeId}`)
          }
        }
      } catch (error) {
        console.error("Error fetching schedule:", error)
      }
    }

    if (employeeId && employee) {
      fetchScheduleData()
    }
  }, [employeeId, employee])

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
        const dayOfWeek = day.date.format("dddd")
        const isToday = day.date.isSame(dayjs(), "day")
        const isFuture = day.date.isAfter(dayjs(), "day")

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
          if (schedule.days?.includes(dayOfWeek)) {
            // Only mark as attended/absent for past days
            if (isToday || isFuture) {
              newDayStatus[dateStr] = "unselected" // Keep future days neutral
            } else {
              newDayStatus[dateStr] = "absent" // Only past days can be marked absent by default
            }
          } else {
            newDayStatus[dateStr] = "unselected"
          }
        }
      }
    })

    setDayStatus(newDayStatus)
  }, [currentDate, schedule, employeeId])

  // Handle day click in calendar
  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date)
    }
  }

  // Handle day selection in schedule panel
  const handleDaySelection = async (day) => {
    // Prevent multiple operations at once
    if (isProcessingShifts) return

    // Update the selected days state immediately
    setSelectedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }))

    // Get the day name from the key
    const dayName = {
      S: "Sunday",
      M: "Monday",
      T: "Tuesday",
      W: "Wednesday",
      T2: "Thursday",
      F: "Friday",
      S2: "Saturday",
    }[day]

    // If a shift type is selected, generate or remove shifts
    if (selectedShift) {
      setIsProcessingShifts(true)

      try {
        // If the day is being selected (not deselected)
        if (!selectedDays[day]) {
          // Generate shifts for all instances of this day in the current month
          await generateShiftsForDay(dayName)
        } else {
          // Remove this day from the schedule
          await removeShiftsForDay(dayName)
        }

        // Update calendar colors for all instances of this day
        updateCalendarDayStatus(day, !selectedDays[day])
      } catch (error) {
        console.error("Error handling day selection:", error)
      } finally {
        setIsProcessingShifts(false)
      }
    } else {
      // Just update the calendar UI without generating shifts
      updateCalendarDayStatus(day, !selectedDays[day])
    }
  }

  // Helper function to update calendar day status
  const updateCalendarDayStatus = (dayKey, isSelected) => {
    const newDayStatus = { ...dayStatus }

    calendarDays.forEach((calDay) => {
      if (calDay.isCurrentMonth) {
        const dateStr = calDay.date.format("YYYY-MM-DD")
        const dayOfWeek = calDay.date.format("dddd")
        const currentDayKey = {
          Sunday: "S",
          Monday: "M",
          Tuesday: "T",
          Wednesday: "W",
          Thursday: "T2",
          Friday: "F",
          Saturday: "S2",
        }[dayOfWeek]

        // If this day's checkbox was toggled, update its status
        if (currentDayKey === dayKey) {
          // Check if this day has any special status
          const hasSpecialStatus =
            schedule.sickleave === dateStr ||
            (schedule.regularholiday && schedule.regularholiday.includes(dateStr)) ||
            (schedule.specialholiday && schedule.specialholiday.includes(dateStr)) ||
            (schedule.nightdiff && schedule.nightdiff.includes(dateStr)) ||
            (schedule.oncall && schedule.oncall.includes(dateStr)) ||
            (schedule.vacationleave && schedule.vacationleave.includes(dateStr))

          // Only update if it doesn't have a special status
          if (!hasSpecialStatus) {
            newDayStatus[dateStr] = isSelected ? "selected" : "unselected"
          }
        }
      }
    })

    setDayStatus(newDayStatus)
  }

  // Handle shift selection
  const handleShiftSelection = async (shift) => {
    // Prevent multiple operations at once
    if (isProcessingShifts) return

    setSelectedShift(shift)
    console.log(`Selected shift type: ${shift}`)

    // Check if any days are selected
    const hasSelectedDays = Object.values(selectedDays).some((isSelected) => isSelected)

    if (hasSelectedDays) {
      setIsProcessingShifts(true)

      try {
        // Regenerate shifts for all selected days with the new shift type
        const selectedDayNames = []
        Object.entries(selectedDays).forEach(([day, isSelected]) => {
          if (isSelected) {
            const dayName = {
              S: "Sunday",
              M: "Monday",
              T: "Tuesday",
              W: "Wednesday",
              T2: "Thursday",
              F: "Friday",
              S2: "Saturday",
            }[day]
            selectedDayNames.push(dayName)
          }
        })

        console.log(`Regenerating shifts for ${selectedDayNames.length} days with new shift type`)

        // Process each day one at a time to avoid race conditions
        for (const dayName of selectedDayNames) {
          // Remove existing shifts for this day
          await removeShiftsForDay(dayName)

          // Generate new shifts with the updated shift type
          await generateShiftsForDay(dayName)
        }
      } catch (error) {
        console.error("Error handling shift selection:", error)
      } finally {
        setIsProcessingShifts(false)
      }
    }
  }

  // Handle event selection for the selected date
  const handleEventSelection = (eventType) => {
    if (!selectedDate) return

    const dateStr = selectedDate.format("YYYY-MM-DD")
    const newSchedule = { ...schedule }
    const currentStatus = dayStatus[dateStr]

    // If the same event type is clicked again, remove it (toggle off)
    if (currentStatus === eventType) {
      // Remove the date from the event array
      if (eventType === "sickleave") {
        newSchedule.sickleave = null
      } else if (["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].includes(eventType)) {
        if (Array.isArray(newSchedule[eventType])) {
          newSchedule[eventType] = newSchedule[eventType].filter((d) => d !== dateStr)
        }
      }

      // Reset to default status based on whether it's a working day
      const dayOfWeek = selectedDate.format("dddd")
      const isWorkingDay = newSchedule.days?.includes(dayOfWeek)

      setDayStatus((prev) => ({
        ...prev,
        [dateStr]: isWorkingDay ? "selected" : "unselected",
      }))
    } else {
      // Remove the date from all event arrays first
      if (newSchedule.sickleave === dateStr) {
        newSchedule.sickleave = null
      }
      // Clear from all event arrays
      ;["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].forEach((field) => {
        if (Array.isArray(newSchedule[field])) {
          newSchedule[field] = newSchedule[field].filter((d) => d !== dateStr)
        } else {
          newSchedule[field] = []
        }
      })

      // Add the date to the selected event type
      if (eventType === "sickleave") {
        newSchedule.sickleave = dateStr
      } else if (eventType === "absent") {
        // For "absent", we just remove the date from all arrays
        // and make sure it's not in the working days
        const dayOfWeek = selectedDate.format("dddd")
        if (newSchedule.days.includes(dayOfWeek)) {
          console.log(`Note: ${dateStr} is marked as absent but is part of the regular working days (${dayOfWeek})`)
        }
      } else if (["regularholiday", "specialholiday", "nightdiff", "oncall", "vacationleave"].includes(eventType)) {
        if (!Array.isArray(newSchedule[eventType])) {
          newSchedule[eventType] = []
        }
        newSchedule[eventType].push(dateStr)
      }

      // Update day status
      setDayStatus((prev) => ({
        ...prev,
        [dateStr]: eventType,
      }))
    }

    console.log(`Updated ${eventType} for ${dateStr}:`, newSchedule)
    setSchedule(newSchedule)
  }

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

      // Use the shift IDs that have already been created
      const shiftIds = schedule.shift_ids

      // Get the correct user ID from the employee data
      // This ensures we're using the user_id associated with this employee, not the employee ID
      const userId = employee?.user?.id || Number.parseInt(employeeId)

      // Prepare the schedule data in the exact format expected by the API
      const scheduleData = {
        user_id: userId,
        shift_ids: shiftIds,
        days: selectedDaysArray,
        sickleave: schedule.sickleave,
        regularholiday: schedule.regularholiday || [],
        specialholiday: schedule.specialholiday || [],
        nightdiff: schedule.nightdiff || [],
        oncall: schedule.oncall || [],
        vacationleave: schedule.vacationleave || [],
        payroll_period: "2025-04-15",
        hours: 8,
        bi_weekly_start: "2025-04-01",
      }

      console.log("Saving schedule data:", scheduleData)

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
        body: JSON.stringify(scheduleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to save schedule: ${JSON.stringify(errorData)}`)
      }

      const savedData = await response.json()
      console.log("Schedule saved successfully:", savedData)

      // Update the local schedule state with the saved data
      setSchedule(savedData)

      alert("Schedule saved successfully")
      await fetchAttendanceData()
    } catch (error) {
      console.error("Error saving schedule:", error)
      alert(error.message)
    }
  }

  // Get status color for calendar day
  const getDayStatusColor = (day) => {
    if (!day.isCurrentMonth) return "bg-gray-100 text-gray-400 cursor-default pointer-events-none"

    const dateStr = day.date.format("YYYY-MM-DD")
    const status = dayStatus[dateStr]

    // Check if this is a future date
    const isToday = day.date.isSame(dayjs(), "day")
    const isFuture = day.date.isAfter(dayjs(), "day")

    // For future dates or today, don't show as absent unless explicitly set
    if ((isToday || isFuture) && status === "absent") {
      return "bg-white" // Keep future days white
    }

    switch (status) {
      case "attended":
        return "bg-green-500 text-white"
      case "absent":
        return "bg-red-500 text-white"
      case "selected":
        return "bg-blue-200 text-blue-800"
      case "sickleave":
        return "bg-orange-400 text-white"
      case "regularholiday":
        return "bg-orange-400 text-white"
      case "specialholiday":
        return "bg-orange-400 text-white"
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
    if (!selectedDate) return "6"

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

  // Get event status for selected date
  const getEventStatus = (eventType) => {
    if (!selectedDate) return false

    const dateStr = selectedDate.format("YYYY-MM-DD")
    const status = dayStatus[dateStr]

    return status === eventType
  }

  // Helper function to convert time strings like "10:00 AM" to "10:00:00" format
  const convertTimeStringToTimeFormat = (timeString) => {
    try {
      // Parse the time string
      const [time, period] = timeString.split(" ")
      let [hours, minutes] = time.split(":").map(Number)

      // Convert to 24-hour format
      if (period === "PM" && hours < 12) {
        hours += 12
      } else if (period === "AM" && hours === 12) {
        hours = 0
      }

      // Format as HH:MM:00
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`
    } catch (error) {
      console.error("Error converting time string:", error)
      return "00:00:00" // Default fallback
    }
  }

  // Helper function to convert time format like "10:00:00" to "10:00 AM"
  const convertTimeFormatToTimeString = (timeFormat) => {
    try {
      const [hours, minutes] = timeFormat.split(":").map(Number)

      // Convert to 12-hour format
      let period = "AM"
      let displayHours = hours

      if (hours >= 12) {
        period = "PM"
        displayHours = hours === 12 ? 12 : hours - 12
      }
      if (displayHours === 0) {
        displayHours = 12
      }

      return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
    } catch (error) {
      console.error("Error converting time format:", error)
      return "12:00 AM" // Default fallback
    }
  }

  // Function to fetch attendance data and update calendar
  const fetchAttendanceData = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const userId = employee?.user?.id

      if (!userId) return

      // Get the first and last day of the current month
      const year = currentDate.year()
      const month = currentDate.month()
      const firstDay = dayjs(new Date(year, month, 1)).format("YYYY-MM-DD")
      const lastDay = dayjs(new Date(year, month + 1, 0)).format("YYYY-MM-DD")

      // Fetch attendance data for this employee and month
      const response = await fetch(
        `http://localhost:8000/api/v1/attendance/?user=${userId}&date_after=${firstDay}&date_before=${lastDay}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      if (response.ok) {
        const attendanceData = await response.json()
        console.log("Fetched attendance data:", attendanceData)

        // Update day status based on attendance
        const newDayStatus = { ...dayStatus }

        // Mark all working days as absent by default (but only past days)
        calendarDays.forEach((day) => {
          if (day.isCurrentMonth) {
            const dateStr = day.date.format("YYYY-MM-DD")
            const dayOfWeek = day.date.format("dddd")
            const isToday = day.date.isSame(dayjs(), "day")
            const isFuture = day.date.isAfter(dayjs(), "day")

            // If it's a working day according to the schedule
            if (schedule.days?.includes(dayOfWeek)) {
              // Check if it has a special status first
              const hasSpecialStatus =
                schedule.sickleave === dateStr ||
                (schedule.regularholiday && schedule.regularholiday.includes(dateStr)) ||
                (schedule.specialholiday && schedule.specialholiday.includes(dateStr)) ||
                (schedule.nightdiff && schedule.nightdiff.includes(dateStr)) ||
                (schedule.oncall && schedule.oncall.includes(dateStr)) ||
                (schedule.vacationleave && schedule.vacationleave.includes(dateStr))

              // Only mark past days as absent
              if (!hasSpecialStatus && !isToday && !isFuture) {
                newDayStatus[dateStr] = "absent"
              }
            }
          }
        })

        // Mark days as attended based on attendance data
        attendanceData.forEach((record) => {
          const dateStr = dayjs(record.date).format("YYYY-MM-DD")
          if (newDayStatus[dateStr] === "absent") {
            newDayStatus[dateStr] = "attended"
          }
        })

        setDayStatus(newDayStatus)
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error)
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-2 sm:px-4 pt-8 pb-8 flex flex-col md:flex-row gap-4 md:gap-6 mt-16">
        {/* Calendar Section */}
        <div className="bg-[#5C7346] rounded-lg p-3 sm:p-4 md:p-6 flex-1">
          <div className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-4 text-center">
            {currentMonthYear}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <div key={day} className="text-white text-center py-2 text-xs sm:text-sm md:text-base lg:text-xl">
                <span className="hidden md:inline">
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i]}
                </span>
                <span className="md:hidden">{day}</span>
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dateStr = day.date.format("YYYY-MM-DD")
              const status = day.isCurrentMonth ? dayStatus[dateStr] : null

              return (
                <div
                  key={index}
                  className={`${getDayStatusColor(day)} rounded-lg h-20 flex flex-col items-center justify-center transition-colors hover:opacity-90 relative p-2 sm:p-3 md:p-4 ${
                    !day.isCurrentMonth ? "cursor-default" : "cursor-pointer"
                  } ${
                    selectedDate && day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")
                      ? "ring-2 ring-white"
                      : ""
                  }`}
                  onClick={() => day.isCurrentMonth && handleDayClick(day)}
                >
                  <span className="text-sm sm:text-base md:text-lg font-medium">{day.dayOfMonth}</span>

                  {/* Event indicators */}
                  {day.isCurrentMonth &&
                    status &&
                    status !== "attended" &&
                    status !== "absent" &&
                    status !== "selected" &&
                    status !== "unselected" && (
                      <div className="absolute bottom-1 left-0 right-0 text-center">
                        <span className="text-[8px] md:text-[9px] lg:text-[10px] px-1 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-full">
                          {status === "sickleave" && "sick leave"}
                          {status === "specialholiday" && "special holiday"}
                          {status === "regularholiday" && "regular holiday"}
                          {status === "vacationleave" && "vacation leave"}
                          {status === "nightdiff" && "night diff"}
                          {status === "oncall" && "on call"}
                        </span>
                      </div>
                    )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center mt-4 gap-2 sm:gap-4 md:gap-6">
            <div className="flex items-center">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 mr-1 md:mr-2"></div>
              <span className="text-white text-xs md:text-sm">Attended</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-red-500 mr-1 md:mr-2"></div>
              <span className="text-white text-xs md:text-sm">Absent</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-orange-400 mr-1 md:mr-2"></div>
              <span className="text-white text-xs md:text-sm">Events</span>
            </div>
          </div>
        </div>

        {/* Employee Schedule Panel */}
        <div className="bg-[#3A4D2B] rounded-lg p-3 sm:p-4 md:p-6 w-full md:w-80">
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
              {employee ? `${employee.first_name} ${employee.last_name}` : "Admin One"}
            </h3>
            <p className="text-sm text-white">{employee?.employee_number || "2001"}</p>
          </div>

          {/* Schedule Section */}
          <div className="mb-4 md:mb-6">
            <p className="text-sm font-bold mb-2 text-white">Schedule</p>
            <div className="bg-[#A3BC84] rounded-md p-3 md:p-4">
              <div className="flex justify-end mb-2">
                <span className="text-white bg-[#5C7346] px-2 py-1 rounded-md text-xs">{currentMonthYear}</span>
              </div>
              <div className="flex justify-between">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                  const dayKey = index === 4 ? "T2" : index === 6 ? "S2" : day
                  return (
                    <div
                      key={day}
                      className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center cursor-pointer text-xs sm:text-sm ${
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
          <div className="mb-4 md:mb-6">
            <p className="text-sm font-bold mb-2 text-white">Shifts</p>
            <div className="bg-[#A3BC84] rounded-md p-3 md:p-4">
              <div className="flex justify-end mb-2">
                <span className="text-white bg-[#5C7346] px-2 py-1 rounded-md text-xs">{currentMonthYear}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  className={`py-1 px-2 rounded text-xs ${selectedShift === "morning" ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"}`}
                  onClick={() => handleShiftSelection("morning")}
                >
                  <span className="block">Morning</span>
                  <span className="text-[9px] md:text-[10px] block">10 AM - 7 PM</span>
                </button>
                <button
                  className={`py-1 px-2 rounded text-xs ${selectedShift === "midday" ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"}`}
                  onClick={() => handleShiftSelection("midday")}
                >
                  <span className="block">Midday</span>
                  <span className="text-[9px] md:text-[10px] block">12 PM - 9 PM</span>
                </button>
                <button
                  className={`py-1 px-2 rounded text-xs ${selectedShift === "night" ? "bg-white text-[#5C7346]" : "bg-[#5C7346] text-white"}`}
                  onClick={() => handleShiftSelection("night")}
                >
                  <span className="block">Night</span>
                  <span className="text-[9px] md:text-[10px] block">7 PM - 11 PM</span>
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
          <div className="mb-4 md:mb-6">
            <p className="text-sm font-bold mb-2 text-white">Events</p>
            <div className="bg-[#A3BC84] rounded-md p-3 md:p-4">
              <div className="flex flex-col">
                <div className="text-center mb-3 md:mb-4">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{getEventLabel()}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="regularHoliday"
                      name="eventType"
                      className="mr-1"
                      checked={getEventStatus("regularholiday")}
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
                      checked={getEventStatus("sickleave")}
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
                      checked={getEventStatus("specialholiday")}
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
                      checked={getEventStatus("oncall")}
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
                      checked={getEventStatus("absent")}
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
                      checked={getEventStatus("nightdiff")}
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
                      checked={getEventStatus("vacationleave")}
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
      <div className="container mx-auto px-4 pb-8">
        <button
          className="flex items-center gap-2 bg-[#373A45] text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  )
}

export default AdminEmployeeEditSchedulePage

