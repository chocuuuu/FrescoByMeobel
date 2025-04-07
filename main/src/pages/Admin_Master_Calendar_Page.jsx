"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { API_BASE_URL } from "../config/api"
import dayjs from "dayjs"

// Components for the Master Calendar
import MasterCalendarView from "../components/Master_Calendar_View"
import AddHoliday from "../components/Add_Holiday"

function AdminMasterCalendarPage() {
  const navigate = useNavigate()
  const [holidays, setHolidays] = useState([])
  const [payrollPeriods, setPayrollPeriods] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch holidays and payroll periods
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Get the authentication token
        // In this system, the token might be stored differently or not required for some endpoints
        // Let's try to fetch without a token first
        const headers = {}

        try {
          // Try to fetch holidays
          const holidaysResponse = await axios.get(`${API_BASE_URL}/master-calendar/holiday/`, { headers })
          setHolidays(holidaysResponse.data.results || holidaysResponse.data || [])
        } catch (holidayError) {
          console.warn("Could not fetch holidays:", holidayError)
          setHolidays([]) // Set empty array if fetch fails
        }

        try {
          // Try to fetch payroll periods
          const payrollPeriodsResponse = await axios.get(`${API_BASE_URL}/master-calendar/payroll/`, { headers })
          setPayrollPeriods(payrollPeriodsResponse.data.results || payrollPeriodsResponse.data || [])
        } catch (payrollError) {
          console.warn("Could not fetch payroll periods:", payrollError)
          setPayrollPeriods([]) // Set empty array if fetch fails
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching calendar data:", err)
        // Don't set error, just log it - we'll show the calendar anyway
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date)

    // Check if the date already has a holiday
    const existingHoliday = holidays.find(
      (holiday) => dayjs(holiday.date).format("YYYY-MM-DD") === dayjs(date).format("YYYY-MM-DD"),
    )

    if (existingHoliday) {
      setSelectedHoliday(existingHoliday)
    } else {
      setSelectedHoliday(null)
    }

    setIsPanelOpen(true)
  }

  // Handle holiday save
  const handleSaveHoliday = async (holidayData) => {
    try {
      let response

      if (selectedHoliday && selectedHoliday.id) {
        // Update existing holiday
        response = await axios.put(`${API_BASE_URL}/master-calendar/holiday/${selectedHoliday.id}/`, holidayData)

        // Update the holidays state
        setHolidays(holidays.map((holiday) => (holiday.id === selectedHoliday.id ? response.data : holiday)))
      } else {
        // Create new holiday
        response = await axios.post(`${API_BASE_URL}/master-calendar/holiday/`, holidayData)

        // Add the new holiday to the holidays state
        setHolidays([...holidays, response.data])
      }

      // Close the panel
      setIsPanelOpen(false)
      setSelectedHoliday(null)
      setSelectedDate(null)
    } catch (err) {
      console.error("Error saving holiday:", err)
      alert("Failed to save holiday. Please try again.")
    }
  }

  // Handle holiday delete
  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/master-calendar/holiday/${id}/`)

      // Remove the deleted holiday from the holidays state
      setHolidays(holidays.filter((holiday) => holiday.id !== id))

      // Close the panel
      setIsPanelOpen(false)
      setSelectedHoliday(null)
      setSelectedDate(null)
    } catch (err) {
      console.error("Error deleting holiday:", err)
      alert("Failed to delete holiday. Please try again.")
    }
  }

  // Close the side panel
  const handleClosePanel = () => {
    setIsPanelOpen(false)
    setSelectedHoliday(null)
    setSelectedDate(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Master Calendar</h1>
          <p className="text-gray-600">Manage holidays and payroll periods</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl">Loading calendar data...</p>
          </div>
        ) : (
          <div className="flex">
            <div className={`flex-1 transition-all duration-300 ${isPanelOpen ? "pr-80" : ""}`}>
              <MasterCalendarView
                holidays={holidays}
                payrollPeriods={payrollPeriods}
                onDateSelect={handleDateSelect}
              />
            </div>

            {isPanelOpen && (
              <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-10 pt-16 overflow-y-auto">
                <AddHoliday
                  selectedDate={selectedDate}
                  holiday={selectedHoliday}
                  onSave={handleSaveHoliday}
                  onDelete={handleDeleteHoliday}
                  onClose={handleClosePanel}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminMasterCalendarPage

