"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config/api"

function EditPayroll({ isOpen, onClose, employeeData, onUpdate }) {
  const [formData, setFormData] = useState({
    // Payroll Dates
    payrollPeriodStart: "10/26/24",
    payrollPeriodEnd: "11/10/24",
    payDate: "11/15/2024",

    // Earnings
    basicRate: 0,
    basic: 0,
    allowance: 0,
    ntax: 0,
    vacationleave: 0,
    sickleave: 0,
    bereavementLeave: 0,

    // Overtime
    regularOT: { hours: "0", rate: 0 },
    regularHoliday: { rate: 0 },
    specialHoliday: { rate: 0 },
    restDay: { hours: "0", rate: 0 },
    nightDiff: { hours: "0", rate: 0 },
    backwage: { rate: "0" },

    // Deductions
    sss: { amount: 0 },
    philhealth: { amount: 0 },
    pagibig: { amount: 0 },
    late: { amount: 0 },
    wtax: { amount: 0 },

    // Additional Deductions
    nowork: { amount: 0 },
    loan: { amount: 0 },
    charges: { amount: 0 },
    undertime: { amount: 0 },
    msfcloan: { amount: 0 },

    // Totals (calculated)
    totalGross: 0,
    totalDeductionsBreakdown: 0,
    totalDeductions: 0,
    totalSalaryCompensation: 0,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasPayrollData, setHasPayrollData] = useState(false)

  // Fetch employee data from APIs when the modal opens
  useEffect(() => {
    if (employeeData && isOpen) {
      fetchEmployeePayrollData(employeeData.id)
    }
  }, [employeeData, isOpen])

  const fetchEmployeePayrollData = async (employeeId) => {
    if (!employeeId) return

    setLoading(true)
    setError(null)
    setHasPayrollData(false)

    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Check if employee has salary data
      const salaryResponse = await fetch(`${API_BASE_URL}/salary/?user=${employeeId}`, { headers })
      if (!salaryResponse.ok) throw new Error("Failed to fetch salary data")
      const salaryData = await salaryResponse.json()

      // Check if employee has total overtime data
      const totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/?user=${employeeId}`, { headers })
      if (!totalOvertimeResponse.ok) throw new Error("Failed to fetch total overtime data")
      const totalOvertimeData = await totalOvertimeResponse.json()

      // Fetch earnings data
      const earningsResponse = await fetch(`${API_BASE_URL}/earnings/?user=${employeeId}`, { headers })
      if (!earningsResponse.ok) throw new Error("Failed to fetch earnings data")
      const earningsData = await earningsResponse.json()

      // Fetch deductions data
      const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/?user=${employeeId}`, { headers })
      if (!deductionsResponse.ok) throw new Error("Failed to fetch deductions data")
      const deductionsData = await deductionsResponse.json()

      // Fetch overtime hours data
      const overtimeResponse = await fetch(`${API_BASE_URL}/overtimehours/?user=${employeeId}`, { headers })
      if (!overtimeResponse.ok) throw new Error("Failed to fetch overtime data")
      const overtimeData = await overtimeResponse.json()

      console.log("Earnings data:", earningsData)
      console.log("Deductions data:", deductionsData)
      console.log("Total overtime data:", totalOvertimeData)

      // Check if employee has any payroll data
      const hasData =
        salaryData.length > 0 ||
        totalOvertimeData.length > 0 ||
        earningsData.length > 0 ||
        deductionsData.length > 0 ||
        overtimeData.length > 0

      setHasPayrollData(hasData)

      // If employee has data, update form with it
      if (hasData) {
        const updatedFormData = createFormDataFromApi(
          earningsData[0],
          deductionsData[0],
          overtimeData,
          totalOvertimeData[0],
          salaryData[0],
          employeeData,
        )
        setFormData(updatedFormData)
      } else {
        // If no data, reset to default values with employee's base salary if available
        const defaultFormData = { ...formData }
        if (employeeData?.rate_per_month) {
          defaultFormData.basicRate = employeeData.rate_per_month
          defaultFormData.basic = employeeData.rate_per_month / 2 // Assuming bi-weekly pay
        }
        setFormData(defaultFormData)
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error)
      setError("Failed to load payroll data. Using default values.")

      // Set default values from employeeData
      if (employeeData?.rate_per_month) {
        setFormData((prevData) => ({
          ...prevData,
          basicRate: employeeData.rate_per_month,
          basic: employeeData.rate_per_month / 2, // Assuming bi-weekly pay
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const createFormDataFromApi = (earnings, deductions, overtime, totalOvertime, salary, employeeData) => {
    // Start with default form data
    const newFormData = { ...formData }

    // Update earnings data if available
    if (earnings) {
      newFormData.basicRate = earnings.basic_rate?.toString() || newFormData.basicRate
      newFormData.basic = earnings.basic?.toString() || newFormData.basic
      newFormData.allowance = earnings.allowance?.toString() || newFormData.allowance
      newFormData.ntax = earnings.ntax?.toString() || newFormData.ntax
      newFormData.vacationleave = earnings.vacationleave?.toString() || newFormData.vacationleave
      newFormData.sickleave = earnings.sickleave?.toString() || newFormData.sickleave
    } else if (employeeData?.rate_per_month) {
      // If no earnings data but we have rate_per_month, use that for basic rate
      newFormData.basicRate = employeeData.rate_per_month.toString()
      newFormData.basic = (employeeData.rate_per_month / 2).toString() // Assuming bi-weekly pay
    }

    // Update deductions data if available
    if (deductions) {
      newFormData.sss.amount = deductions.sss?.toString() || newFormData.sss.amount
      newFormData.philhealth.amount = deductions.philhealth?.toString() || newFormData.philhealth.amount
      newFormData.pagibig.amount = deductions.pagibig?.toString() || newFormData.pagibig.amount
      newFormData.late.amount = deductions.late?.toString() || newFormData.late.amount
      newFormData.wtax.amount = deductions.wtax?.toString() || newFormData.wtax.amount
      newFormData.nowork.amount = deductions.nowork?.toString() || newFormData.nowork.amount
      newFormData.loan.amount = deductions.loan?.toString() || newFormData.loan.amount
      newFormData.charges.amount = deductions.charges?.toString() || newFormData.charges.amount
      newFormData.undertime.amount = deductions.undertime?.toString() || newFormData.undertime.amount
      newFormData.msfcloan.amount = deductions.msfcloan?.toString() || newFormData.msfcloan.amount
    }

    // Update overtime data if available
    if (overtime && overtime.length > 0) {
      // Sum up regular overtime hours
      const regularOTHours = overtime
        .filter((ot) => ot.type === "regular")
        .reduce((sum, ot) => sum + (Number.parseFloat(ot.hours) || 0), 0)

      // Sum up rest day hours
      const restDayHours = overtime
        .filter((ot) => ot.type === "rest_day")
        .reduce((sum, ot) => sum + (Number.parseFloat(ot.hours) || 0), 0)

      // Sum up night differential hours
      const nightDiffHours = overtime
        .filter((ot) => ot.type === "night_diff")
        .reduce((sum, ot) => sum + (Number.parseFloat(ot.hours) || 0), 0)

      newFormData.regularOT.hours = regularOTHours.toString() || newFormData.regularOT.hours
      newFormData.restDay.hours = restDayHours.toString() || newFormData.restDay.hours
      newFormData.nightDiff.hours = nightDiffHours.toString() || newFormData.nightDiff.hours
    }

    // Update overtime rates if available
    if (totalOvertime) {
      newFormData.regularOT.rate = totalOvertime.total_regularot?.toString() || newFormData.regularOT.rate
      newFormData.regularHoliday.rate =
        totalOvertime.total_regularholiday?.toString() || newFormData.regularHoliday.rate
      newFormData.specialHoliday.rate =
        totalOvertime.total_specialholiday?.toString() || newFormData.specialHoliday.rate
      newFormData.restDay.rate = totalOvertime.total_restday?.toString() || newFormData.restDay.rate
      newFormData.nightDiff.rate = totalOvertime.total_nightdiff?.toString() || newFormData.nightDiff.rate
      newFormData.backwage.rate = totalOvertime.total_backwage?.toString() || newFormData.backwage.rate
    }

    // Calculate totals
    const totals = calculateTotals(newFormData)

    // Return the complete form data
    return { ...newFormData, ...totals }
  }

  const calculateTotals = (data) => {
    // Calculate total gross
    const totalGross =
      Number.parseFloat(data.basic) +
      Number.parseFloat(data.allowance) +
      Number.parseFloat(data.ntax) +
      Number.parseFloat(data.vacationleave) +
      Number.parseFloat(data.sickleave) +
      Number.parseFloat(data.bereavementLeave) +
      Number.parseFloat(data.regularOT.rate) +
      Number.parseFloat(data.regularHoliday.rate) +
      Number.parseFloat(data.specialHoliday.rate) +
      Number.parseFloat(data.restDay.rate) +
      Number.parseFloat(data.nightDiff.rate) +
      Number.parseFloat(data.backwage.rate)

    // Calculate total deductions
    const totalDeductions =
      Number.parseFloat(data.sss.amount) +
      Number.parseFloat(data.philhealth.amount) +
      Number.parseFloat(data.pagibig.amount) +
      Number.parseFloat(data.late.amount) +
      Number.parseFloat(data.wtax.amount) +
      Number.parseFloat(data.nowork.amount) +
      Number.parseFloat(data.loan.amount) +
      Number.parseFloat(data.charges.amount) +
      Number.parseFloat(data.undertime.amount) +
      Number.parseFloat(data.msfcloan.amount)

    // Calculate total salary compensation
    const totalSalaryCompensation = totalGross - totalDeductions

    return {
      totalGross: totalGross.toFixed(2),
      totalDeductionsBreakdown: totalDeductions.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      totalSalaryCompensation: totalSalaryCompensation.toFixed(2),
    }
  }

  // Calculate SSS, PhilHealth, and Pag-IBIG contributions based on salary
  const calculateBenefits = async (basicRate) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Calculate SSS contribution
      const sssResponse = await fetch(`${API_BASE_URL}/sss/?salary=${basicRate}`, { headers })
      if (!sssResponse.ok) throw new Error("Failed to calculate SSS contribution")
      const sssData = await sssResponse.json()

      // Calculate PhilHealth contribution
      const philhealthResponse = await fetch(`${API_BASE_URL}/benefits/philhealth/?salary=${basicRate}`, { headers })
      if (!philhealthResponse.ok) throw new Error("Failed to calculate PhilHealth contribution")
      const philhealthData = await philhealthResponse.json()

      // Calculate Pag-IBIG contribution
      const pagibigResponse = await fetch(`${API_BASE_URL}/benefits/pagibig/?salary=${basicRate}`, { headers })
      if (!pagibigResponse.ok) throw new Error("Failed to calculate Pag-IBIG contribution")
      const pagibigData = await pagibigResponse.json()

      return {
        sss: sssData.contribution || 0,
        philhealth: philhealthData.contribution || 0,
        pagibig: pagibigData.contribution || 0,
      }
    } catch (error) {
      console.error("Error calculating benefits:", error)
      return {
        sss: 0,
        philhealth: 0,
        pagibig: 0,
      }
    }
  }

  const handleInputChange = async (e, section, field, subfield = null) => {
    const value = e.target.value.replace(/[^\d.]/g, "") // Only allow numbers and decimal point
    const newFormData = { ...formData }

    if (subfield) {
      newFormData[section][field][subfield] = value
    } else if (field) {
      newFormData[section][field] = value
    } else {
      newFormData[section] = value
    }

    // If basic rate is changed, recalculate SSS, PhilHealth, and Pag-IBIG
    if (section === "basicRate") {
      const benefits = await calculateBenefits(value)
      newFormData.sss.amount = benefits.sss.toString()
      newFormData.philhealth.amount = benefits.philhealth.toString()
      newFormData.pagibig.amount = benefits.pagibig.toString()
    }

    const totals = calculateTotals(newFormData)
    setFormData({ ...newFormData, ...totals })
  }

  const formatValue = (value) => {
    return value
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!employeeData?.id) {
      console.error("No employee ID available")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Prepare earnings data
      const earningsData = {
        user: employeeData.id,
        basic_rate: Number.parseFloat(formData.basicRate),
        basic: Number.parseFloat(formData.basic),
        allowance: Number.parseFloat(formData.allowance),
        ntax: Number.parseFloat(formData.ntax),
        vacationleave: Number.parseFloat(formData.vacationleave),
        sickleave: Number.parseFloat(formData.sickleave),
      }

      // Prepare deductions data
      const deductionsData = {
        user: employeeData.id,
        sss: Number.parseFloat(formData.sss.amount),
        philhealth: Number.parseFloat(formData.philhealth.amount),
        pagibig: Number.parseFloat(formData.pagibig.amount),
        late: Number.parseFloat(formData.late.amount),
        wtax: Number.parseFloat(formData.wtax.amount),
        nowork: Number.parseFloat(formData.nowork.amount),
        loan: Number.parseFloat(formData.loan.amount),
        charges: Number.parseFloat(formData.charges.amount),
        undertime: Number.parseFloat(formData.undertime.amount),
        msfcloan: Number.parseFloat(formData.msfcloan.amount),
      }

      // Prepare total overtime data
      const totalOvertimeData = {
        user: employeeData.id,
        total_regularot: Number.parseFloat(formData.regularOT.rate),
        total_regularholiday: Number.parseFloat(formData.regularHoliday.rate),
        total_specialholiday: Number.parseFloat(formData.specialHoliday.rate),
        total_restday: Number.parseFloat(formData.restDay.rate),
        total_nightdiff: Number.parseFloat(formData.nightDiff.rate),
        total_backwage: Number.parseFloat(formData.backwage.rate),
        total_overtime:
          Number.parseFloat(formData.regularOT.rate) +
          Number.parseFloat(formData.regularHoliday.rate) +
          Number.parseFloat(formData.specialHoliday.rate) +
          Number.parseFloat(formData.restDay.rate) +
          Number.parseFloat(formData.nightDiff.rate),
        total_late: Number.parseFloat(formData.late.amount),
        total_undertime: Number.parseFloat(formData.undertime.amount),
        biweek_start: new Date().toISOString().split("T")[0],
      }

      // Check if earnings record exists for this employee
      const earningsCheckResponse = await fetch(`${API_BASE_URL}/earnings/?user=${employeeData.id}`, { headers })
      const earningsCheckData = await earningsCheckResponse.json()

      // Check if deductions record exists for this employee
      const deductionsCheckResponse = await fetch(`${API_BASE_URL}/deductions/?user=${employeeData.id}`, {
        headers,
      })
      const deductionsCheckData = await deductionsCheckResponse.json()

      // Check if total overtime record exists for this employee
      const totalOvertimeCheckResponse = await fetch(`${API_BASE_URL}/totalovertime/?user=${employeeData.id}`, {
        headers,
      })
      const totalOvertimeCheckData = await totalOvertimeCheckResponse.json()

      // Update or create earnings record
      let earningsResponse
      if (earningsCheckData.length > 0) {
        // Update existing record
        earningsResponse = await fetch(`${API_BASE_URL}/earnings/${earningsCheckData[0].id}/`, {
          method: "PUT",
          headers,
          body: JSON.stringify(earningsData),
        })
      } else {
        // Create new record
        earningsResponse = await fetch(`${API_BASE_URL}/earnings/`, {
          method: "POST",
          headers,
          body: JSON.stringify(earningsData),
        })
      }

      if (!earningsResponse.ok) throw new Error("Failed to update earnings data")

      // Update or create deductions record
      let deductionsResponse
      if (deductionsCheckData.length > 0) {
        // Update existing record
        deductionsResponse = await fetch(`${API_BASE_URL}/deductions/${deductionsCheckData[0].id}/`, {
          method: "PUT",
          headers,
          body: JSON.stringify(deductionsData),
        })
      } else {
        // Create new record
        deductionsResponse = await fetch(`${API_BASE_URL}/deductions/`, {
          method: "POST",
          headers,
          body: JSON.stringify(deductionsData),
        })
      }

      if (!deductionsResponse.ok) throw new Error("Failed to update deductions data")

      // Update or create total overtime record
      let totalOvertimeResponse
      if (totalOvertimeCheckData.length > 0) {
        // Update existing record
        totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/${totalOvertimeCheckData[0].id}/`, {
          method: "PUT",
          headers,
          body: JSON.stringify(totalOvertimeData),
        })
      } else {
        // Create new record
        totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/`, {
          method: "POST",
          headers,
          body: JSON.stringify(totalOvertimeData),
        })
      }

      if (!totalOvertimeResponse.ok) throw new Error("Failed to update total overtime data")

      // Set hasPayrollData to true since we've now saved data
      setHasPayrollData(true)

      // Call the onUpdate callback with the updated data
      onUpdate({
        ...formData,
        id: employeeData.id,
        baseSalary: formData.basic,
        totalDeductions: formData.totalDeductions,
        totalSalaryCompensation: formData.totalSalaryCompensation,
      })
    } catch (error) {
      console.error("Error updating payroll data:", error)
      setError("Failed to update payroll data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl p-4 relative max-h-[90vh] overflow-y-auto">
        {/* Employee Info */}
        <div className="mb-3">
          <h2 className="text-xl font-bold uppercase">{employeeData?.employee_name || "EMPLOYEE NAME"}</h2>
          <p className="text-sm text-gray-600">{employeeData?.employee_id || "ID"}</p>
          {!hasPayrollData && (
            <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded text-sm">
              This employee doesn't have payroll information yet. Enter the details below to create their payroll
              record.
            </div>
          )}
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="text-lg font-medium">Loading payroll data...</div>
          </div>
        )}

        {error && <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Column 1: Payroll Dates & Earnings */}
            <div>
              {/* Payroll Dates */}
              <div className="mb-4">
                <h3 className="font-medium text-base mb-2 uppercase">Payroll Dates</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Payroll Period</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={formData.payrollPeriodStart}
                        onChange={(e) => handleInputChange(e, "payrollPeriodStart")}
                        className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                      />
                      <input
                        type="text"
                        value={formData.payrollPeriodEnd}
                        onChange={(e) => handleInputChange(e, "payrollPeriodEnd")}
                        className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Pay Date</label>
                    <input
                      type="text"
                      value={formData.payDate}
                      onChange={(e) => handleInputChange(e, "payDate")}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h3 className="font-medium text-base mb-2 uppercase">Earnings</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Basic Rate (Monthly)</label>
                    <input
                      type="text"
                      value={formatValue(formData.basicRate)}
                      onChange={(e) => handleInputChange(e, "basicRate")}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Basic (Bi-weekly)</label>
                    <input
                      type="text"
                      value={formatValue(formData.basic)}
                      onChange={(e) => handleInputChange(e, "basic")}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Allowance</label>
                    <input
                      type="text"
                      value={formatValue(formData.allowance)}
                      onChange={(e) => handleInputChange(e, "allowance")}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Non-Taxable</label>
                    <input
                      type="text"
                      value={formatValue(formData.ntax)}
                      onChange={(e) => handleInputChange(e, "ntax")}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Vacation Leave</label>
                    <input
                      type="text"
                      value={formatValue(formData.vacationleave)}
                      onChange={(e) => handleInputChange(e, "vacationleave")}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Sick Leave</label>
                    <input
                      type="text"
                      value={formatValue(formData.sickleave)}
                      onChange={(e) => handleInputChange(e, "sickleave")}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Overtime Breakdown */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Overtime Breakdown</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Regular Overtime</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Hrs"
                      value={formData.regularOT.hours}
                      onChange={(e) => handleInputChange(e, "regularOT", "hours")}
                      className="w-12 px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.regularOT.rate)}
                      onChange={(e) => handleInputChange(e, "regularOT", "rate")}
                      className="flex-1 px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Regular Holiday</label>
                  <input
                    type="text"
                    value={formatValue(formData.regularHoliday.rate)}
                    onChange={(e) => handleInputChange(e, "regularHoliday", "rate")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Special Holiday</label>
                  <input
                    type="text"
                    value={formatValue(formData.specialHoliday.rate)}
                    onChange={(e) => handleInputChange(e, "specialHoliday", "rate")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Rest Day</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Hrs"
                      value={formData.restDay.hours}
                      onChange={(e) => handleInputChange(e, "restDay", "hours")}
                      className="w-12 px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.restDay.rate)}
                      onChange={(e) => handleInputChange(e, "restDay", "rate")}
                      className="flex-1 px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Night Diff</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Hrs"
                      value={formData.nightDiff.hours}
                      onChange={(e) => handleInputChange(e, "nightDiff", "hours")}
                      className="w-12 px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.nightDiff.rate)}
                      onChange={(e) => handleInputChange(e, "nightDiff", "rate")}
                      className="flex-1 px-2 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Backwage</label>
                  <input
                    type="text"
                    value={formatValue(formData.backwage.rate)}
                    onChange={(e) => handleInputChange(e, "backwage", "rate")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Deductions */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">SSS</label>
                  <input
                    type="text"
                    value={formatValue(formData.sss.amount)}
                    onChange={(e) => handleInputChange(e, "sss", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">PhilHealth</label>
                  <input
                    type="text"
                    value={formatValue(formData.philhealth.amount)}
                    onChange={(e) => handleInputChange(e, "philhealth", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Pag IBIG</label>
                  <input
                    type="text"
                    value={formatValue(formData.pagibig.amount)}
                    onChange={(e) => handleInputChange(e, "pagibig", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Late</label>
                  <input
                    type="text"
                    value={formatValue(formData.late.amount)}
                    onChange={(e) => handleInputChange(e, "late", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">WTAX</label>
                  <input
                    type="text"
                    value={formatValue(formData.wtax.amount)}
                    onChange={(e) => handleInputChange(e, "wtax", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Column 4: Additional Deductions */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Additional Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">No Work Day</label>
                  <input
                    type="text"
                    value={formatValue(formData.nowork.amount)}
                    onChange={(e) => handleInputChange(e, "nowork", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Loan</label>
                  <input
                    type="text"
                    value={formatValue(formData.loan.amount)}
                    onChange={(e) => handleInputChange(e, "loan", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Charges</label>
                  <input
                    type="text"
                    value={formatValue(formData.charges.amount)}
                    onChange={(e) => handleInputChange(e, "charges", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Undertime</label>
                  <input
                    type="text"
                    value={formatValue(formData.undertime.amount)}
                    onChange={(e) => handleInputChange(e, "undertime", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">MSFC Loan</label>
                  <input
                    type="text"
                    value={formatValue(formData.msfcloan.amount)}
                    onChange={(e) => handleInputChange(e, "msfcloan", "amount")}
                    className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Overall Section */}
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-medium text-base mb-2 uppercase">Overall</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Gross</label>
                <input
                  type="text"
                  value={formatValue(formData.totalGross)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Deductions</label>
                <input
                  type="text"
                  value={formatValue(formData.totalDeductions)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Salary</label>
                <input
                  type="text"
                  value={formatValue(formData.totalSalaryCompensation)}
                  readOnly
                  className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex justify-center space-x-4 sticky bottom-0 pt-2 pb-1 bg-white">
            <button
              type="submit"
              className="px-6 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPayroll

