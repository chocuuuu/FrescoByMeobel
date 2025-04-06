"use client"

import { useState } from "react"
import { API_BASE_URL } from "../config/api"
import Calendar from "./Calendar"

function SetPayrollPeriods({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    payrollPeriodStart: "",
    payrollPeriodEnd: "",
    payDate: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showCalendar, setShowCalendar] = useState(null) // 'start', 'end', or 'pay'

  const handleDateSelect = (date) => {
    // Format date as MM/DD/YY
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear().toString().slice(2)}`

    // Format full date for pay date as MM/DD/YYYY
    const formattedFullDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`

    if (showCalendar === "start") {
      setFormData((prev) => ({ ...prev, payrollPeriodStart: formattedDate }))
    } else if (showCalendar === "end") {
      setFormData((prev) => ({ ...prev, payrollPeriodEnd: formattedDate }))
    } else if (showCalendar === "pay") {
      setFormData((prev) => ({ ...prev, payDate: formattedFullDate }))
    }

    setShowCalendar(null) // Close calendar after selection
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const accessToken = localStorage.getItem("access_token")

      // Validate dates
      if (!formData.payrollPeriodStart || !formData.payrollPeriodEnd || !formData.payDate) {
        throw new Error("All date fields are required")
      }

      // Format dates to YYYY-MM-DD for API
      const formatDate = (dateStr) => {
        const parts = dateStr.split("/")
        if (parts.length !== 3) return dateStr

        let year = parts[2]
        // Handle 2-digit years
        if (year.length === 2) year = "20" + year

        return `${year}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`
      }

      const payload = {
        payroll_period_start: formatDate(formData.payrollPeriodStart),
        payroll_period_end: formatDate(formData.payrollPeriodEnd),
        pay_date: formatDate(formData.payDate),
      }

      // Send request to update all schedules with the new payroll periods
      // Fix the API endpoint to use the correct path
      const response = await fetch(`${API_BASE_URL}/schedule/update-payroll-periods/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update payroll periods")
      }

      const result = await response.json()
      console.log("Payroll periods updated successfully:", result)

      setSuccess(true)

      // Call the success callback with the updated data
      if (onSuccess) {
        onSuccess({
          payrollPeriodStart: formData.payrollPeriodStart,
          payrollPeriodEnd: formData.payrollPeriodEnd,
          payDate: formData.payDate,
        })
      }

      // Close the modal after a short delay
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error updating payroll periods:", error)
      setError(error.message || "An error occurred while updating payroll periods")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-bold mb-4">Set Payroll Periods</h2>
        <p className="text-gray-600 mb-4">
          Set the payroll period start and end dates, along with the pay date. These dates will be applied to all
          employees.
        </p>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">Payroll periods updated successfully!</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Period Start (MM/DD/YY)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.payrollPeriodStart}
                onClick={() => setShowCalendar("start")}
                readOnly
                placeholder="Click to select date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] cursor-pointer"
                required
              />
              {showCalendar === "start" && (
                <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md">
                  <Calendar onSelectDate={handleDateSelect} />
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payroll Period End (MM/DD/YY)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.payrollPeriodEnd}
                onClick={() => setShowCalendar("end")}
                readOnly
                placeholder="Click to select date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] cursor-pointer"
                required
              />
              {showCalendar === "end" && (
                <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md">
                  <Calendar onSelectDate={handleDateSelect} />
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date (MM/DD/YYYY)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.payDate}
                onClick={() => setShowCalendar("pay")}
                readOnly
                placeholder="Click to select date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346] cursor-pointer"
                required
              />
              {showCalendar === "pay" && (
                <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md">
                  <Calendar onSelectDate={handleDateSelect} />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#5C7346] text-white rounded-md hover:bg-[#4a5c38]"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update All Employees"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SetPayrollPeriods

