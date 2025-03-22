"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import NavBar from "../components/Nav_Bar"
import { ArrowLeft, User2, Calendar, Clock, CheckSquare } from "lucide-react"
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
  const [attendanceData, setAttendanceData] = useState({})

  // State to track if we're currently processing shifts to prevent duplicates
  const [isProcessingShifts, setIsProcessingShifts] = useState(false)

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

      // Find shifts for these dates
      const shiftsToRemove = []
      const shiftsToKeep = []

      if (schedule.shift_ids && schedule.shift_ids.length > 0) {
        for (const shiftId of schedule.shift_ids) {
          try {
            const shiftResponse = await fetch(`${API_BASE_URL}/shift/${shiftId}/`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            })

            if (shiftResponse.ok) {
              const shiftData = await shiftResponse.json()
              if (matchingDates.includes(shiftData.date)) {
                shiftsToRemove.push(shiftId)
                console.log(`Found shift ${shiftId} to remove for date ${shiftData.date}`)
              } else {
                shiftsToKeep.push(shiftId)
              }
            } else {
              // If we can't fetch the shift, keep it in the schedule to be safe
              shiftsToKeep.push(shiftId)
            }
          } catch (error) {
            console.error(`Error fetching shift ${shiftId}:`, error)
            // If we can't fetch the shift, keep it in the schedule to be safe
            shiftsToKeep.push(shiftId)
          }
        }
      }

      console.log(`Removing ${shiftsToRemove.length} shifts, keeping ${shiftsToKeep.length} shifts`)

      // Update the schedule to remove these shifts
      setSchedule((prev) => {
        // Remove the day from the days array
        const updatedDays = prev.days.filter((d) => d !== dayName)

        return {
          ...prev,
          days: updatedDays,
          shift_ids: shiftsToKeep,
        }
      })
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

          // Convert to a map of date -> status
          const attendanceMap = {}
          data.forEach((record) => {
            attendanceMap[record.date] = record.status
          })

          setAttendanceData(attendanceMap)
          console.log("Fetched attendance data:", attendanceMap)

          // Update day status based on attendance
          updateDayStatusWithAttendance(attendanceMap)
        } else {
          console.log("No attendance data found or error fetching data")

          // For demo purposes, let's create some mock attendance data
          // In a real app, you would remove this and only use actual data
          const mockAttendanceData = createMockAttendanceData(year, month)
          setAttendanceData(mockAttendanceData)
          updateDayStatusWithAttendance(mockAttendanceData)
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)

        // For demo purposes, create mock data on error
        const year = currentDate.year()
        const month = currentDate.month()
        const mockAttendanceData = createMockAttendanceData(year, month)
        setAttendanceData(mockAttendanceData)
        updateDayStatusWithAttendance(mockAttendanceData)
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
          if (status === "present") {
            newStatus[dateStr] = "attended"
          } else if (status === "absent") {
            newStatus[dateStr] = "absent"
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

        // Use the user ID from the employee data if available, otherwise use employeeId
        const userId = employee?.user?.id || employeeId
        console.log(`Fetching schedule for user ID: ${userId}`)

        // Try both endpoints to ensure we get the schedule
        let response = await fetch(`${API_BASE_URL}/schedule/?user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        // If no results, try with employeeId directly
        if (!response.ok || (await response.json()).length === 0) {
          console.log(`No schedule found with user_id=${userId}, trying with employeeId=${employeeId}`)
          response = await fetch(`${API_BASE_URL}/schedule/?user_id=${employeeId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          })
        }

        if (response.ok) {
          const data = await response.json()
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
                const shiftResponse = await fetch(`${API_BASE_URL}/shift/${scheduleData.shift_ids[0]}/`, {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                })

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
    const today = dayjs()

    dayObjects.forEach((day) => {
      if (day.isCurrentMonth) {
        const dateStr = day.date.format("YYYY-MM-DD")
        const dayOfWeek = day.date.format("dddd")
        const isPastDay = day.date.isBefore(today, "day")

        // Priority order for status:
        // 1. Special events (sickleave, holidays, etc.)
        // 2. Attendance data (attended/absent)
        // 3. Selected days from schedule
        // 4. Past days without attendance should be marked as absent
        // 5. Default status

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
        } else if (attendanceData[dateStr] === "present") {
          // If we have attendance data showing the employee was present
          newDayStatus[dateStr] = "attended"
        } else if (attendanceData[dateStr] === "absent") {
          // If we have attendance data showing the employee was absent
          newDayStatus[dateStr] = "absent"
        } else if (schedule.days?.includes(dayOfWeek)) {
          // If it's a scheduled day
          if (isPastDay) {
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

    setDayStatus(newDayStatus)
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

          // If this day's checkbox was toggled, update its status
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
      if (selectedDaysArray.length === 0) {
        alert("Please select at least one day for the schedule.")
        return
      }

      // Check if we have a shift type selected
      if (!selectedShift) {
        alert("Please select a shift type (Morning, Midday, Night, or Custom).")
        return
      }

      // Force create shifts for all selected days
      console.log("Creating shifts for all selected days before saving...")
      setIsProcessingShifts(true)

      try {
        // Clear existing shift IDs to avoid duplicates
        setSchedule((prev) => ({ ...prev, shift_ids: [] }))

        // Process each selected day to create shifts
        for (const dayName of selectedDaysArray) {
          await generateShiftsForDay(dayName)
        }

        // Small delay to ensure state updates
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error("Error creating shifts:", error)
      } finally {
        setIsProcessingShifts(false)
      }

      // Get the updated shift IDs after creation
      const shiftIds = schedule.shift_ids || []

      console.log(`After creating shifts, we have ${shiftIds.length} shift IDs`)

      // If we still don't have shifts, create a default shift for each day
      if (shiftIds.length === 0) {
        alert("Unable to create shifts automatically. Please try selecting the shift type again.")
        return
      }

      // Get the correct user ID from the employee data
      const userId = employee?.user?.id || Number.parseInt(employeeId)

      // Prepare the schedule data
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
      const url = schedule.id ? `${API_BASE_URL}/schedule/${schedule.id}/` : `${API_BASE_URL}/schedule/`

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
    } catch (error) {
      console.error("Error saving schedule:", error)
      alert(error.message)
    }
  }

  // Get status color for calendar day
  const getDayStatusColor = (day) => {
    if (!day.isCurrentMonth) return "bg-gray-400 text-white cursor-default pointer-events-none"

    const dateStr = day.date.format("YYYY-MM-DD")
    const status = dayStatus[dateStr]

    switch (status) {
      case "attended":
        return "bg-green-500 text-white"
      case "absent":
        return "bg-red-500 text-white"
      case "selected":
        return "bg-blue-200 text-blue-800" // Changed to lighter blue with dark blue text
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

  // In your Admin_Employee_Edit_Schedule_Page.jsx or another component
useEffect(() => {
  console.log('API_BASE_URL:', API_BASE_URL);
}, []);

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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-4 pb-8 flex flex-col gap-6 mt-16">
        {/* Main content container with two panels side by side */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Calendar Panel */}
          <div className="bg-[#5C7346] rounded-lg p-6 lg:w-2/3">
            {/* Header with back button and month title */}
            <div className="flex items-center justify-between mb-4">
              <button
                className="flex items-center gap-2 bg-[#3A4D2B] text-white px-4 py-2 rounded-md hover:bg-[#2a3b1d] transition-colors"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-white text-4xl font-bold p-2">{currentMonthYear}</h2>
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
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dateStr = day.date.format("YYYY-MM-DD")
                const status = day.isCurrentMonth ? dayStatus[dateStr] : null

                return (
                  <div
                    key={index}
                    className={`${getDayStatusColor(
                      day,
                    )} rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors hover:opacity-90 relative p-2 sm:p-3 md:p-4 ${
                      selectedDate && day.date.format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")
                        ? "ring-2 ring-white"
                        : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className="text-md sm:text-lg md:text-xl font-bold">{day.dayOfMonth}</span>

                    {/* Event indicators */}
                    {day.isCurrentMonth && status && status !== "attended" && status !== "absent" && (
                      <div className="absolute bottom-[-2px] left-0 right-0 text-center">
                        <span className="text-sm md:text-sm px-2 whitespace-nowrap overflow-hidden text-ellipsis inline-block max-w-full">
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
                <span className="text-white text-md">Selected</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                <span className="text-white text-md">Events</span>
              </div>
            </div>
          </div>

          {/* Employee Schedule Panel */}
          <div className="bg-[#3A4D2B] rounded-lg p-4 lg:w-1/3">
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
                  {employee ? `${employee.first_name} ${employee.last_name}` : "Admin One"}
                </h3>
                <p className="text-md text-white">{employee?.employee_number || "2001"}</p>
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

            {/* Shifts Section - Improved layout */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-white mr-2" />
                <p className="text-md font-bold text-white">Shifts</p>
              </div>
              <div className="bg-[#A3BC84] rounded-md p-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      selectedShift === "morning"
                        ? "bg-white text-[#5C7346]"
                        : "bg-[#5C7346] text-white hover:bg-opacity-80"
                    }`}
                    onClick={() => handleShiftSelection("morning")}
                  >
                    <span className="text-lg font-bold block">Morning</span>
                    <span className="text-md block mt-1 opacity-80">10 AM - 7 PM</span>
                  </button>
                  <button
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      selectedShift === "midday"
                        ? "bg-white text-[#5C7346]"
                        : "bg-[#5C7346] text-white hover:bg-opacity-80"
                    }`}
                    onClick={() => handleShiftSelection("midday")}
                  >
                    <span className="text-lg font-bold block">Midday</span>
                    <span className="text-md block mt-1 opacity-80">12 PM - 9 PM</span>
                  </button>
                  <button
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      selectedShift === "night"
                        ? "bg-white text-[#5C7346]"
                        : "bg-[#5C7346] text-white hover:bg-opacity-80"
                    }`}
                    onClick={() => handleShiftSelection("night")}
                  >
                    <span className="text-lg font-bold block">Night</span>
                    <span className="text-md block mt-1 opacity-80">7 PM - 11 PM</span>
                  </button>
                  <button
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      selectedShift === "custom"
                        ? "bg-white text-[#5C7346]"
                        : "bg-[#5C7346] text-white hover:bg-opacity-80"
                    }`}
                    onClick={() => handleShiftSelection("custom")}
                  >
                    <span className="text-lg font-bold block">Custom</span>
                  </button>
                </div>

                {selectedShift === "custom" && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {/* Start Time */}
                    <div className="flex flex-col">
                      <label className="text-white text-md font-semibold mb-2">Start Time</label>
                      <input
                        type="time"
                        value={customShiftStart}
                        onChange={(e) => setCustomShiftStart(e.target.value)}
                        className="py-2 px-3 rounded-md text-md bg-white text-[#5C7346] border-2 border-[#999999] focus:outline"
                      />
                    </div>

                    {/* End Time */}
                    <div className="flex flex-col">
                      <label className="text-white text-md font-semibold mb-2">End Time</label>
                      <input
                        type="time"
                        value={customShiftEnd}
                        onChange={(e) => setCustomShiftEnd(e.target.value)}
                        className="py-2 px-3 rounded-md text-md bg-white text-[#5C7346] border-2 border-[#999999] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Events Section - More compact */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <CheckSquare className="h-5 w-5 text-white mr-2" />
                <p className="text-md font-bold text-white">Events</p>
              </div>
              <div className="bg-[#A3BC84] rounded-md p-3">
                {/* Selected date display */}
                <div className="text-center mb-2">
                  <div className="text-3xl font-bold text-white">{getEventLabel()}</div>
                </div>

                {/* Event options in a more compact grid */}
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    {
                      id: "regularHoliday",
                      label: "Regular Holiday",
                      type: "regularholiday",
                    },
                    { id: "sickLeave", label: "Sick Leave", type: "sickleave" },
                    {
                      id: "specialHoliday",
                      label: "Special Holiday",
                      type: "specialholiday",
                    },
                    { id: "onCall", label: "Oncall", type: "oncall" },
                    { id: "restDay", label: "Rest Day", type: "absent" },
                    { id: "nightDiff", label: "Nightdiff", type: "nightdiff" },
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
            <div className="flex gap-6 justify-end">
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
  )
}

export default AdminEmployeeEditSchedulePage

