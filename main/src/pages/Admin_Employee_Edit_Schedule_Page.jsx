"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import { API_BASE_URL } from "../config/api"

function AdminEmployeeEditSchedulePage() {
  const { employeeId } = useParams()
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

  // Helper function to convert time string (e.g., "8:00 AM") to time format (e.g., "08:00:00")
  const convertTimeStringToTimeFormat = (timeString) => {
    const [time, modifier] = timeString.split(" ")
    let [hours, minutes] = time.split(":")

    if (hours === "12") {
      hours = modifier === "AM" ? "00" : "12"
    } else {
      hours = modifier === "PM" ? String(Number.parseInt(hours, 10) + 12) : hours
    }

    return `${hours.padStart(2, "0")}:${minutes}:00`
  }

  // Helper function to convert time format (e.g., "08:00:00") to time string (e.g., "8:00 AM")
  const convertTimeFormatToTimeString = (timeFormat) => {
    const [hours, minutes, seconds] = timeFormat.split(":")
    let period = "AM"
    let hour = Number.parseInt(hours, 10)

    if (hour >= 12) {
      period = "PM"
    }

    if (hour > 12) {
      hour -= 12
    }

    if (hour === 0) {
      hour = 12
    }

    return `${hour}:${minutes} ${period}`
  }

  // Helper function to debug schedule
  const debugSchedule = () => {
    console.log("Debugging Schedule:")
    console.log("Schedule State:", schedule)
    console.log("Selected Days:", selectedDays)
    console.log("Selected Shift:", selectedShift)
    console.log("Custom Shift Start:", customShiftStart)
    console.log("Custom Shift End:", customShiftEnd)
    console.log("Day Status:", dayStatus)
  }

  // Helper function to update calendar with schedule
  const updateCalendarWithSchedule = (scheduleData, days) => {
    console.log("Updating calendar with schedule data:", scheduleData)
    console.log("Days to update:", days)

    // You can add your logic here to update the calendar based on the schedule data
    // For example, you can update the dayStatus state to reflect the schedule
  }

  // Generate shifts for all instances of a specific day in the current month
  const generateShiftsForDay = async (dayName) => {
    try {
      // If no shift type is selected, select a default one
      if (!selectedShift) {
        setSelectedShift("morning")
        console.log("No shift selected, defaulting to morning shift")
      }

      const accessToken = localStorage.getItem("access_token")
      const year = currentDate.year()
      const month = currentDate.month()
      const daysInMonth = currentDate.daysInMonth()

      console.log(`Generating shifts for ${dayName} with shift type: ${selectedShift}`)

      // Find all dates in the current month that match the day name
      const matchingDates = []
      for (let i = 1; i <= daysInMonth; i++) {
        const date = dayjs(new Date(year, month, i))
        if (date.format("dddd") === dayName) {
          matchingDates.push(date.format("YYYY-MM-DD"))
        }
      }

      console.log(`Found ${matchingDates.length} matching dates for ${dayName}:`, matchingDates)

      console.log(`Selected shift for ${dayName} is "${selectedShift}"`)

      // Get shift times based on selected shift type
      let shiftStart, shiftEnd
      switch (selectedShift) {
        case "morning":
          shiftStart = "10:00:00"
          shiftEnd = "19:00:00"
          break
        case "midday":
          shiftStart = "12:00:00"
          shiftEnd = "21:00:00"
          break
        case "night":
          shiftStart = "19:00:00"
          shiftEnd = "23:00:00"
          break
        case "custom":
          shiftStart = convertTimeStringToTimeFormat(customShiftStart)
          shiftEnd = convertTimeStringToTimeFormat(customShiftEnd)
          break
        default:
          // Default to morning shift if somehow no shift is selected
          shiftStart = "10:00:00"
          shiftEnd = "19:00:00"
          break
      }

      // Create shifts for each matching date
      const newShiftIds = []
      for (const dateStr of matchingDates) {
        // Create a new shift
        const shiftResponse = await fetch(`${API_BASE_URL}/shift/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: dateStr,
            shift_start: shiftStart,
            shift_end: shiftEnd,
          }),
        })

        if (shiftResponse.ok) {
          const shiftData = await shiftResponse.json()
          newShiftIds.push(shiftData.id)
          console.log(`Created shift ${shiftData.id} for ${dateStr}`)
        } else {
          console.error(`Failed to create shift for ${dateStr}:`, await shiftResponse.text())
        }
      }

      console.log(`Created ${newShiftIds.length} new shifts`)

      // Update the schedule with the new shift IDs
      setSchedule((prev) => {
        // Get existing shift IDs that don't conflict with new ones
        const existingShiftIds = prev.shift_ids || []

        // Combine with new shift IDs
        const combinedShiftIds = [...existingShiftIds, ...newShiftIds]

        // Add the day to the days array if it's not already there
        const updatedDays = [...prev.days]
        if (!updatedDays.includes(dayName)) {
          updatedDays.push(dayName)
        }

        console.log(`Updated schedule with ${combinedShiftIds.length} total shifts`)

        return {
          ...prev,
          shift_ids: combinedShiftIds,
          days: updatedDays,
        }
      })

      // Update the day status to show selected days as blue instead of green
      const newDayStatus = { ...dayStatus }
      matchingDates.forEach((dateStr) => {
        // Only update if the date doesn't have a special event status
        const hasSpecialStatus =
          schedule.sickleave === dateStr ||
          (schedule.regularholiday && schedule.regularholiday.includes(dateStr)) ||
          (schedule.specialholiday && schedule.specialholiday.includes(dateStr)) ||
          (schedule.nightdiff && schedule.nightdiff.includes(dateStr)) ||
          (schedule.oncall && schedule.oncall.includes(dateStr)) ||
          (schedule.vacationleave && schedule.vacationleave.includes(dateStr))

        if (!hasSpecialStatus) {
          newDayStatus[dateStr] = "selected"
        }
      })
      setDayStatus(newDayStatus)

      return newShiftIds
    } catch (error) {
      console.error(`Error generating shifts for ${dayName}:`, error)
      return []
    }
  }

  // Create a single shift for a specific date
  const createShiftForDate = async (dateStr) => {
    try {
      // If no shift type is selected, select a default one
      if (!selectedShift) {
        setSelectedShift("morning")
      }

      const accessToken = localStorage.getItem("access_token")

      // Get shift times based on selected shift type
      let shiftStart, shiftEnd
      switch (selectedShift) {
        case "morning":
          shiftStart = "10:00:00"
          shiftEnd = "19:00:00"
          break
        case "midday":
          shiftStart = "12:00:00"
          shiftEnd = "21:00:00"
          break
        case "night":
          shiftStart = "19:00:00"
          shiftEnd = "23:00:00"
          break
        case "custom":
          shiftStart = convertTimeStringToTimeFormat(customShiftStart)
          shiftEnd = convertTimeStringToTimeFormat(customShiftEnd)
          break
        default:
          // Default to morning shift
          shiftStart = "10:00:00"
          shiftEnd = "19:00:00"
          break
      }

      // Create a new shift
      const shiftResponse = await fetch(`${API_BASE_URL}/shift/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: dateStr,
          shift_start: shiftStart,
          shift_end: shiftEnd,
        }),
      })

      if (shiftResponse.ok) {
        const shiftData = await shiftResponse.json()
        console.log(`Created shift ${shiftData.id} for ${dateStr}`)
        return shiftData.id
      } else {
        console.error(`Failed to create shift for ${dateStr}:`, await shiftResponse.text())
        return null
      }
    } catch (error) {
      console.error(`Error creating shift for ${dateStr}:`, error)
      return null
    }
  }

  // Remove shifts for a specific day
  const removeShiftsForDay = async (dayName) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const year = currentDate.year()
      const month = currentDate.month()
      const daysInMonth = currentDate.daysInMonth()

      console.log(`Removing shifts for ${dayName}`)

      // Find all dates in the current month that match the day name
      const matchingDates = []
      for (let i = 1; i <= daysInMonth; i++) {
        const date = dayjs(new Date(year, month, i))
        if (date.format("dddd") === dayName) {
          matchingDates.push(date.format("YYYY-MM-DD"))
        }
      }

      console.log(`Found ${matchingDates.length} dates to remove shifts for`)

      // Collect shift IDs that need to be removed
      const shiftsToRemove = []
      const shiftsToKeep = []

      if (schedule.shift_ids && schedule.shift_ids.length > 0) {
        const shiftRequests = schedule.shift_ids.map((shiftId) =>
          fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }).then((response) => (response.ok ? response.json() : null)),
        )

        const shiftDataArray = await Promise.all(shiftRequests)

        shiftDataArray.forEach((shiftData, index) => {
          if (shiftData && matchingDates.includes(shiftData.date)) {
            shiftsToRemove.push(schedule.shift_ids[index])
            console.log(`Found shift ${schedule.shift_ids[index]} to remove for date ${shiftData.date}`)
          } else {
            shiftsToKeep.push(schedule.shift_ids[index])
          }
        })
      }

      console.log(`Removing ${shiftsToRemove.length} shifts, keeping ${shiftsToKeep.length} shifts`)

      // **Optimistically update UI BEFORE waiting for the API response**
      setSchedule((prev) => ({
        ...prev,
        days: prev.days.filter((d) => d !== dayName),
        shift_ids: shiftsToKeep,
      }))

      // **Batch delete shifts in chunks (e.g., 10 at a time)**
      const chunkSize = 10
      for (let i = 0; i < shiftsToRemove.length; i += chunkSize) {
        const chunk = shiftsToRemove.slice(i, i + chunkSize)
        console.log(`Sending batch delete for ${chunk.length} shifts`)

        fetch(`${API_BASE_URL}/shifts/batch-delete/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ shift_ids: chunk }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Batch deletion failed for ${chunk.length} shifts`)
            }
            console.log(`Successfully deleted ${chunk.length} shifts`)
          })
          .catch((err) => console.error(err))
      }
    } catch (error) {
      console.error(`Error removing shifts for ${dayName}:`, error)
    }
  }

  // Fetch employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true)
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/employment-info/${employeeId}/`, {
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

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        if (!employee?.user?.id) return

        const accessToken = localStorage.getItem("access_token")
        const userId = employee.user.id

        // Get the first and last day of the current month
        const year = currentDate.year()
        const month = currentDate.month()
        const firstDay = dayjs(new Date(year, month, 1)).format("YYYY-MM-DD")
        const lastDay = dayjs(new Date(year, month + 1, 0)).format("YYYY-MM-DD")

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
          console.log("Fetched attendance data:", data)

          // Convert to a map of date -> status
          const attendanceMap = {}
          data.forEach((record) => {
            // Make sure to use lowercase for consistent status comparison
            attendanceMap[record.date] = record.status.toLowerCase()
          })

          setAttendanceData(attendanceMap)
          console.log("Processed attendance data:", attendanceMap)

          // Update day status based on attendance
          updateDayStatusWithAttendance(attendanceMap)
        } else {
          console.log("No attendance data found or error fetching data")
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)
      }
    }

    // Helper function to create mock attendance data for demo purposes
    const createMockAttendanceData = (year, month) => {
      const mockData = {}
      const daysInMonth = dayjs(new Date(year, month, 1)).daysInMonth()

      // Mark Mondays and Wednesdays as absent (for demo)
      for (let i = 1; i <= daysInMonth; i++) {
        const date = dayjs(new Date(year, month, i))
        const dateStr = date.format("YYYY-MM-DD")
        const dayOfWeek = date.day() // 0 = Sunday, 1 = Monday, etc.

        // Past days only
        if (date.isBefore(dayjs(), "day")) {
          if (dayOfWeek === 1 || dayOfWeek === 3) {
            // Monday or Wednesday
            mockData[dateStr] = "absent"
          } else if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Not weekend
            mockData[dateStr] = "present"
          }
        }
      }

      return mockData
    }

    // Helper function to update day status based on attendance
    const updateDayStatusWithAttendance = (attendanceData) => {
      setDayStatus((prevStatus) => {
        const newStatus = { ...prevStatus }

        // Update status for each day based on attendance
        Object.entries(attendanceData).forEach(([dateStr, status]) => {
          // Convert status to lowercase for consistent comparison
          const lowerStatus = status.toLowerCase()

          if (lowerStatus === "present") {
            newStatus[dateStr] = "attended"
          } else if (lowerStatus === "absent") {
            newStatus[dateStr] = "absent"
          } else if (lowerStatus === "late") {
            // Add a special status for late attendance
            newStatus[dateStr] = "late"
          }
        })

        return newStatus
      })
    }

    fetchAttendanceData()
  }, [employee, currentDate])

  // Fetch shifts data
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/shifts/`, {
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
        console.log("Starting fetchScheduleData...")
        setLoading(true)

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
        if (!accessToken) {
          console.error("No access token found")
          setLoading(false)
          return
        }

        // Use the user ID from the employee data if available, otherwise use employeeId
        const userId = employee?.user?.id
        if (!userId) {
          console.warn("No user ID found in employee data, using employeeId as fallback")
        }

        const queryId = userId || employeeId
        console.log(`Fetching schedule for user/employee ID: ${queryId}`)

        // Try to fetch the schedule data
        const response = await fetch(`${API_BASE_URL}/schedule/?user_id=${queryId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        const responseText = await response.text()
        console.log("Raw schedule API response:", responseText)

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error("Failed to parse schedule response:", e)
          setLoading(false)
          return
        }

        console.log(`Fetched schedule data:`, data)

        if (data && data.length > 0) {
          const scheduleData = data[0]
          console.log("Found schedule:", scheduleData)

          // Set the schedule regardless of user_id match - we'll display whatever we find
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

          if (scheduleData.days && Array.isArray(scheduleData.days)) {
            scheduleData.days.forEach((day) => {
              if (daysMap[day]) {
                newSelectedDays[daysMap[day]] = true
              }
            })

            console.log("Setting selected days based on schedule:", newSelectedDays)
            setSelectedDays(newSelectedDays)
          } else {
            console.warn("Schedule days is not an array or is undefined:", scheduleData.days)
          }

          // Determine shift type based on shift_ids
          if (scheduleData.shift_ids && scheduleData.shift_ids.length > 0) {
            // Fetch the first shift to determine the type
            try {
              const shiftResponse = await fetch(`${API_BASE_URL}/shift/${scheduleData.shift_ids[0]}/`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              })

              if (shiftResponse.ok) {
                const shiftData = await shiftResponse.json()
                console.log("First shift data:", shiftData)

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
          console.log(`No schedule found for employee ${employeeId}`)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching schedule:", error)
        setLoading(false)
      }
    }

    if (employeeId && employee) {
      fetchScheduleData()
    }
  }, [employeeId, employee])

  // This useEffect ensures the calendar is updated whenever the schedule data changes
  useEffect(() => {
    if (schedule && schedule.id && schedule.days && schedule.days.length > 0) {
      console.log("Schedule data changed, updating calendar with days:", schedule.days)

      // Run debug logging automatically
      debugSchedule()

      // Small delay to ensure all state is updated
      setTimeout(() => {
        updateCalendarWithSchedule(schedule, schedule.days)
      }, 100)
    }
  }, [schedule, JSON.stringify(schedule.days)])

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

    dayObjects.forEach((day) => {
      if (day.isCurrentMonth) {
        const dateStr = day.date.format("YYYY-MM-DD")
        const dayOfWeek = day.date.format("dddd")
        const isPastDay = day.date.isBefore(today, "day")

        // Priority order for status:
        // 1. Special events (sickleave, holidays, etc.)
        // 2. Attendance data for past days (attended/absent)
        // 3. Selected days from schedule for future days
        // 4. Default status

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
        } else if (isPastDay && attendanceData[dateStr]) {
          // For past days, show actual attendance if available
          newDayStatus[dateStr] = attendanceData[dateStr] === "present" ? "attended" : "absent"
        } else if (schedule.days?.includes(dayOfWeek)) {
          // If it's a scheduled day
          if (isPastDay && !attendanceData[dateStr]) {
            // Past scheduled days without attendance records should be marked as absent
            newDayStatus[dateStr] = "absent"
          } else {
            // Future scheduled days
            newDayStatus[dateStr] = "selected"
          }
        } else if (isPastDay) {
          // Any past day without attendance or schedule should be marked as absent
          newDayStatus[dateStr] = "absent"
        } else {
          // Default status for future days
          newDayStatus[dateStr] = "unselected"
        }
      }
    })

    // This will ensure the calendar shows scheduled days when it first loads
    if (schedule && schedule.days && schedule.days.length > 0) {
      const scheduledDates = []
      for (let i = 1; i <= daysInMonth; i++) {
        const date = dayjs(new Date(year, month, i))
        const dayOfWeek = date.format("dddd")

        if (schedule.days.includes(dayOfWeek)) {
          const dateStr = date.format("YYYY-MM-DD")
          scheduledDates.push(dateStr)

          // Mark this date as scheduled if it's not already marked as something else
          if (!newDayStatus[dateStr] || newDayStatus[dateStr] === "unselected") {
            const isPastDay = date.isBefore(today, "day")
            if (isPastDay && attendanceData[dateStr]) {
              // Keep attendance data for past days
            } else {
              newDayStatus[dateStr] = "selected"
            }
          }
        }
      }
      console.log(`Initialized ${scheduledDates.length} scheduled dates for ${currentDate.format("MMMM")}`)
    }

    setDayStatus(newDayStatus)
    console.log("Calendar days generated:", calendarDays.length)
    console.log("Day status after generation:", dayStatus)
    console.log("Schedule days being used:", schedule.days)
  }, [currentDate, schedule, employeeId, attendanceData])

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

    setIsProcessingShifts(true)

    try {
      const newSelectedDays = {
        ...selectedDays,
        [day]: !selectedDays[day],
      }

      setSelectedDays(newSelectedDays)

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

      // If the day is being selected (not deselected)
      if (!selectedDays[day]) {
        // Generate shifts for all instances of this day in the current month
        await generateShiftsForDay(dayName)
      } else {
        // Remove this day from the schedule
        await removeShiftsForDay(dayName)
      }

      // Update calendar colors for all instances of this day
      const newDayStatus = { ...dayStatus }
      const today = dayjs()

      calendarDays.forEach((calDay) => {
        if (calDay.isCurrentMonth) {
          const dateStr = calDay.date.format("YYYY-MM-DD")
          const dayOfWeek = calDay.date.format("dddd")
          const dayKey = {
            Sunday: "S",
            Monday: "M",
            Tuesday: "T",
            Wednesday: "W",
            Thursday: "T2",
            Friday: "F",
            Saturday: "S2",
          }[dayOfWeek]

          const isPastDay = calDay.date.isBefore(today, "day")
          const hasAttendanceRecord = attendanceData[dateStr] === "present" || attendanceData[dateStr] === "absent"

          // If this day's checkbox was toggled, update its          // If this day's checkbox was toggled, update its status
          if (dayKey === day) {
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
              if (!selectedDays[day]) {
                // Day is being selected - mark as "selected" unless it has attendance data
                if (isPastDay && hasAttendanceRecord) {
                  // Keep the attendance status for past days with records
                  // This preserves the green/red coloring for past days
                } else {
                  // For future days or days without attendance records, mark as selected (blue)
                  newDayStatus[dateStr] = "selected"
                }
              } else {
                // Day is being deselected
                if (isPastDay && hasAttendanceRecord) {
                  // Keep the attendance status for past days with records
                } else {
                  // Reset to unselected for future days or days without attendance
                  newDayStatus[dateStr] = "unselected"
                }
              }
            }
          }
        }
      })

      setDayStatus(newDayStatus)
    } catch (error) {
      console.error("Error handling day selection:", error)
    } finally {
      setIsProcessingShifts(false)
    }
  }

  // Handle shift selection
  const handleShiftSelection = async (shift) => {
    // Prevent multiple operations at once
    if (isProcessingShifts) return

    setIsProcessingShifts(true)

    try {
      setSelectedShift(shift)
      console.log(`Selected shift type set to: "${shift}"`)
      console.log(`Selected shift type: ${shift}`)

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

      // If we have no selected days but have selected a shift type,
      // we should still update the state to remember the shift type
      if (selectedDayNames.length === 0) {
        console.log("No days selected, but shift type has been set for future use")
      }
    } catch (error) {
      console.error("Error handling shift selection:", error)
    } finally {
      setIsProcessingShifts(false)
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
      const isPastDay = selectedDate.isBefore(dayjs(), "day")

      if (isWorkingDay) {
        if (isPastDay && !attendanceData[dateStr]) {
          // Past working day with no attendance
          setDayStatus((prev) => ({
            ...prev,
            [dateStr]: "absent",
          }))
        } else if (isPastDay && attendanceData[dateStr] === "present") {
          // Past working day with attendance
          setDayStatus((prev) => ({
            ...prev,
            [dateStr]: "attended",
          }))
        } else {
          // Future working day
          setDayStatus((prev) => ({
            ...prev,
            [dateStr]: "selected",
          }))
        }
      } else {
        setDayStatus((prev) => ({
          ...prev,
          [dateStr]: "unselected",
        }))
      }
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
          // This is a simplification - in a real app, you'd need to handle this differently
          // as you can't modify the days array for just one date
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

      // Check if we have any selected days
    } catch (error) {
      console.error("Error saving schedule:", error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Schedule for Employee {employeeId}</h1>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      {employee && (
        <div>
          <p>
            Employee Name: {employee.user?.first_name} {employee.user?.last_name}
          </p>
          <p>Employee ID: {employee.employee_id}</p>
        </div>
      )}

      <div className="flex">
        {/* Calendar */}
        <div className="w-2/3">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {currentMonth} {currentYear}
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Weekday Headers */}
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>

            {/* Calendar Days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`p-2 border rounded text-center cursor-pointer ${
                  day.isCurrentMonth ? "" : "text-gray-400"
                } ${
                  dayStatus[day.date?.format("YYYY-MM-DD")] === "sickleave"
                    ? "bg-red-200"
                    : dayStatus[day.date?.format("YYYY-MM-DD")] === "regularholiday"
                      ? "bg-green-200"
                      : dayStatus[day.date?.format("YYYY-MM-DD")] === "specialholiday"
                        ? "bg-yellow-200"
                        : dayStatus[day.date?.format("YYYY-MM-DD")] === "nightdiff"
                          ? "bg-purple-200"
                          : dayStatus[day.date?.format("YYYY-MM-DD")] === "oncall"
                            ? "bg-orange-200"
                            : dayStatus[day.date?.format("YYYY-MM-DD")] === "vacationleave"
                              ? "bg-blue-200"
                              : dayStatus[day.date?.format("YYYY-MM-DD")] === "attended"
                                ? "bg-green-400"
                                : dayStatus[day.date?.format("YYYY-MM-DD")] === "late"
                                  ? "bg-yellow-400"
                                  : dayStatus[day.date?.format("YYYY-MM-DD")] === "absent"
                                    ? "bg-red-400"
                                    : dayStatus[day.date?.format("YYYY-MM-DD")] === "selected"
                                      ? "bg-blue-300"
                                      : ""
                }`}
                onClick={() => handleDayClick(day)}
              >
                {day.dayOfMonth}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Panel */}
        <div className="w-1/3 ml-4">
          <h2 className="text-xl font-semibold mb-4">Edit Schedule</h2>

          {/* Day Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Select Days:</h3>
            <label className="block">
              <input type="checkbox" checked={selectedDays.S} onChange={() => handleDaySelection("S")} />
              Sunday
            </label>
            <label className="block">
              <input type="checkbox" checked={selectedDays.M} onChange={() => handleDaySelection("M")} />
              Monday
            </label>
            <label className="block">
              <input type="checkbox" checked={selectedDays.T} onChange={() => handleDaySelection("T")} />
              Tuesday
            </label>
            <label className="block">
              <input type="checkbox" checked={selectedDays.W} onChange={() => handleDaySelection("W")} />
              Wednesday
            </label>
            <label className="block">
              <input type="checkbox" checked={selectedDays.T2} onChange={() => handleDaySelection("T2")} />
              Thursday
            </label>
            <label className="block">
              <input type="checkbox" checked={selectedDays.F} onChange={() => handleDaySelection("F")} />
              Friday
            </label>
            <label className="block">
              <input type="checkbox" checked={selectedDays.S2} onChange={() => handleDaySelection("S2")} />
              Saturday
            </label>
          </div>

          {/* Shift Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Select Shift:</h3>
            <button onClick={() => handleShiftSelection("morning")}>Morning</button>
            <button onClick={() => handleShiftSelection("midday")}>Midday</button>
            <button onClick={() => handleShiftSelection("night")}>Night</button>
            <div className="mt-2">
              <label className="block">
                Custom Shift Start:
                <input type="time" value={customShiftStart} onChange={(e) => setCustomShiftStart(e.target.value)} />
              </label>
              <label className="block">
                Custom Shift End:
                <input type="time" value={customShiftEnd} onChange={(e) => setCustomShiftEnd(e.target.value)} />
              </label>
            </div>
          </div>

          {/* Event Selection */}
          <div>
            <h3 className="text-lg font-semibold">Select Event for {selectedDate?.format("YYYY-MM-DD")}:</h3>
            <button onClick={() => handleEventSelection("sickleave")}>Sick Leave</button>
            <button onClick={() => handleEventSelection("regularholiday")}>Regular Holiday</button>
            <button onClick={() => handleEventSelection("specialholiday")}>Special Holiday</button>
            <button onClick={() => handleEventSelection("nightdiff")}>Night Differential</button>
            <button onClick={() => handleEventSelection("oncall")}>On Call</button>
            <button onClick={() => handleEventSelection("vacationleave")}>Vacation Leave</button>
          </div>

          {/* Save Button */}
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={handleSaveSchedule}
          >
            Save Schedule
          </button>

          {/* Add this somewhere in the UI */}
          <div className="hidden">Debug: Selected shift is: {selectedShift}</div>

          {/* Add a legend for the calendar colors */}
          <div className="mt-4 p-2 border rounded">
            <h3 className="text-lg font-semibold mb-2">Legend:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-300 mr-2"></div>
                <span>Scheduled</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-400 mr-2"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-400 mr-2"></div>
                <span>Late</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-400 mr-2"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-200 mr-2"></div>
                <span>Sick Leave</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-200 mr-2"></div>
                <span>Vacation Leave</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEmployeeEditSchedulePage

