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
    baseSalary: 0,
    allowance: 0,
    otherEarningsNTax: 0,
    vacationLeave: 0,
    sickLeave: 0,
    bereavementLeave: 0,

    // Overtime
    regularOT: { hours: "3", rate: 0 },
    regularHoliday: { rate: 0 },
    specialHoliday: { rate: 0 },
    restDay: { hours: "3", rate: 0 },
    nightDiff: { hours: "3", rate: 0 },
    backwage: { rate: "0" },

    // Deductions
    sss: { percentage: "10", amount: 0 },
    philhealth: { percentage: "10", amount: 0 },
    pagibig: { percentage: "10", amount: 0 },
    late: { amount: 0 },
    wtax: { amount: 0 },

    // Additional Deductions
    noWorkDay: { amount: 0 },
    loan: { amount: 0 },
    charges: { amount: 0 },
    undertime: { amount: 0 },
    msfcLoan: { amount: 0 },

    // Totals (calculated)
    totalGross: 0,
    totalDeductionsBreakdown: 0,
    totalDeductions: 0,
    totalSalaryCompensation: 0,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Fetch earnings data
      const earningsResponse = await fetch(`${API_BASE_URL}/earnings/?employee=${employeeId}`, { headers })
      if (!earningsResponse.ok) throw new Error("Failed to fetch earnings data")
      const earningsData = await earningsResponse.json()

      // Fetch deductions data
      const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/?employee=${employeeId}`, { headers })
      if (!deductionsResponse.ok) throw new Error("Failed to fetch deductions data")
      const deductionsData = await deductionsResponse.json()

      // Fetch overtime hours data
      const overtimeResponse = await fetch(`${API_BASE_URL}/overtimehours/?employee=${employeeId}`, { headers })
      if (!overtimeResponse.ok) throw new Error("Failed to fetch overtime data")
      const overtimeData = await overtimeResponse.json()

      // Update form data with fetched values
      const updatedFormData = createFormDataFromApi(earningsData[0], deductionsData[0], overtimeData, employeeData)
      setFormData(updatedFormData)
    } catch (error) {
      console.error("Error fetching payroll data:", error)
      setError("Failed to load payroll data. Using default values.")

      // Set default values from employeeData
      setFormData((prevData) => ({
        ...prevData,
        baseSalary: employeeData.rate_per_month || prevData.baseSalary,
        totalDeductions: employeeData.deductions?.toString() || prevData.totalDeductions,
      }))
    } finally {
      setLoading(false)
    }
  }

  const createFormDataFromApi = (earnings, deductions, overtime, employeeData) => {
    // Start with default form data
    const newFormData = { ...formData }

    // Update earnings data if available
    if (earnings) {
      newFormData.baseSalary = earnings.base_salary?.toString() || newFormData.baseSalary
      newFormData.allowance = earnings.allowance?.toString() || newFormData.allowance
      newFormData.otherEarningsNTax = earnings.other_earnings?.toString() || newFormData.otherEarningsNTax
      newFormData.vacationLeave = earnings.vacation_leave?.toString() || newFormData.vacationLeave
      newFormData.sickLeave = earnings.sick_leave?.toString() || newFormData.sickLeave
      newFormData.bereavementLeave = earnings.bereavement_leave?.toString() || newFormData.bereavementLeave
    } else if (employeeData?.rate_per_month) {
      // If no earnings data but we have rate_per_month, use that for base salary
      newFormData.baseSalary = employeeData.rate_per_month.toString()
    }

    // Update deductions data if available
    if (deductions) {
      newFormData.sss.percentage = deductions.sss_percentage?.toString() || newFormData.sss.percentage
      newFormData.sss.amount = deductions.sss?.toString() || newFormData.sss.amount

      newFormData.philhealth.percentage =
        deductions.philhealth_percentage?.toString() || newFormData.philhealth.percentage
      newFormData.philhealth.amount = deductions.philhealth?.toString() || newFormData.philhealth.amount

      newFormData.pagibig.percentage = deductions.pagibig_percentage?.toString() || newFormData.pagibig.percentage
      newFormData.pagibig.amount = deductions.pagibig?.toString() || newFormData.pagibig.amount

      newFormData.late.amount = deductions.late?.toString() || newFormData.late.amount
      newFormData.wtax.amount = deductions.wtax?.toString() || newFormData.wtax.amount
      newFormData.noWorkDay.amount = deductions.no_work_day?.toString() || newFormData.noWorkDay.amount
      newFormData.loan.amount = deductions.loan?.toString() || newFormData.loan.amount
      newFormData.charges.amount = deductions.charges?.toString() || newFormData.charges.amount
      newFormData.undertime.amount = deductions.undertime?.toString() || newFormData.undertime.amount
      newFormData.msfcLoan.amount = deductions.msfc_loan?.toString() || newFormData.msfcLoan.amount
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

    // Calculate totals
    const totals = calculateTotals(newFormData)

    // Return the complete form data
    return { ...newFormData, ...totals }
  }

  const calculateTotals = (data) => {
    // Calculate total gross
    const totalGross =
      Number.parseFloat(data.baseSalary) +
      Number.parseFloat(data.allowance) +
      Number.parseFloat(data.otherEarningsNTax) +
      Number.parseFloat(data.vacationLeave) +
      Number.parseFloat(data.sickLeave) +
      Number.parseFloat(data.bereavementLeave)

    // Calculate total deductions
    const totalDeductions =
      Number.parseFloat(data.sss.amount) +
      Number.parseFloat(data.philhealth.amount) +
      Number.parseFloat(data.pagibig.amount) +
      Number.parseFloat(data.late.amount) +
      Number.parseFloat(data.wtax.amount) +
      Number.parseFloat(data.noWorkDay.amount) +
      Number.parseFloat(data.loan.amount) +
      Number.parseFloat(data.charges.amount) +
      Number.parseFloat(data.undertime.amount) +
      Number.parseFloat(data.msfcLoan.amount)

    // Calculate total salary compensation
    const totalSalaryCompensation = totalGross - totalDeductions

    return {
      totalGross: totalGross.toFixed(2),
      totalDeductionsBreakdown: totalDeductions.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      totalSalaryCompensation: totalSalaryCompensation.toFixed(2),
    }
  }

  const handleInputChange = (e, section, field, subfield = null) => {
    const value = e.target.value.replace(/[^\d.]/g, "") // Only allow numbers and decimal point
    const newFormData = { ...formData }

    if (subfield) {
      newFormData[section][field][subfield] = value
    } else if (field) {
      newFormData[section][field] = value
    } else {
      newFormData[section] = value
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
        employee: employeeData.id,
        base_salary: Number.parseFloat(formData.baseSalary),
        allowance: Number.parseFloat(formData.allowance),
        other_earnings: Number.parseFloat(formData.otherEarningsNTax),
        vacation_leave: Number.parseFloat(formData.vacationLeave),
        sick_leave: Number.parseFloat(formData.sickLeave),
        bereavement_leave: Number.parseFloat(formData.bereavementLeave),
      }

      // Prepare deductions data
      const deductionsData = {
        employee: employeeData.id,
        sss: Number.parseFloat(formData.sss.amount),
        sss_percentage: Number.parseFloat(formData.sss.percentage),
        philhealth: Number.parseFloat(formData.philhealth.amount),
        philhealth_percentage: Number.parseFloat(formData.philhealth.percentage),
        pagibig: Number.parseFloat(formData.pagibig.amount),
        pagibig_percentage: Number.parseFloat(formData.pagibig.percentage),
        late: Number.parseFloat(formData.late.amount),
        wtax: Number.parseFloat(formData.wtax.amount),
        no_work_day: Number.parseFloat(formData.noWorkDay.amount),
        loan: Number.parseFloat(formData.loan.amount),
        charges: Number.parseFloat(formData.charges.amount),
        undertime: Number.parseFloat(formData.undertime.amount),
        msfc_loan: Number.parseFloat(formData.msfcLoan.amount),
      }

      // Check if earnings record exists for this employee
      const earningsCheckResponse = await fetch(`${API_BASE_URL}/earnings/?employee=${employeeData.id}`, { headers })
      const earningsCheckData = await earningsCheckResponse.json()

      // Check if deductions record exists for this employee
      const deductionsCheckResponse = await fetch(`${API_BASE_URL}/deductions/?employee=${employeeData.id}`, {
        headers,
      })
      const deductionsCheckData = await deductionsCheckResponse.json()

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

      // Call the onUpdate callback with the updated data
      onUpdate({
        ...formData,
        id: employeeData.id,
        baseSalary: formData.baseSalary,
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
          <h2 className="text-lg font-bold uppercase">{employeeData?.employee_name || "EMPLOYEE NAME"}</h2>
          <p className="text-xs text-gray-600">{employeeData?.employee_id || "ID"}</p>
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
                <h3 className="font-medium text-sm mb-2 uppercase">Payroll Dates</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Payroll Period</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={formData.payrollPeriodStart}
                        onChange={(e) => handleInputChange(e, "payrollPeriodStart")}
                        className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                      />
                      <input
                        type="text"
                        value={formData.payrollPeriodEnd}
                        onChange={(e) => handleInputChange(e, "payrollPeriodEnd")}
                        className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Pay Date</label>
                    <input
                      type="text"
                      value={formData.payDate}
                      onChange={(e) => handleInputChange(e, "payDate")}
                      className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h3 className="font-medium text-sm mb-2 uppercase">Earnings</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Base Salary</label>
                    <input
                      type="text"
                      value={formatValue(formData.baseSalary)}
                      onChange={(e) => handleInputChange(e, "baseSalary")}
                      className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Allowance</label>
                    <input
                      type="text"
                      value={formatValue(formData.allowance)}
                      onChange={(e) => handleInputChange(e, "allowance")}
                      className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Other Earnings N-TAX</label>
                    <input
                      type="text"
                      value={formatValue(formData.otherEarningsNTax)}
                      onChange={(e) => handleInputChange(e, "otherEarningsNTax")}
                      className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Vacation Leave</label>
                    <input
                      type="text"
                      value={formatValue(formData.vacationLeave)}
                      onChange={(e) => handleInputChange(e, "vacationLeave")}
                      className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Sick Leave</label>
                    <input
                      type="text"
                      value={formatValue(formData.sickLeave)}
                      onChange={(e) => handleInputChange(e, "sickLeave")}
                      className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 uppercase">Bereavement Leave</label>
                    <input
                      type="text"
                      value={formatValue(formData.bereavementLeave)}
                      onChange={(e) => handleInputChange(e, "bereavementLeave")}
                      className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Overtime Breakdown */}
            <div>
              <h3 className="font-medium text-sm mb-2 uppercase">Overtime Breakdown</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Regular Overtime</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Hrs"
                      value={formData.regularOT.hours}
                      onChange={(e) => handleInputChange(e, "regularOT", "hours")}
                      className="w-10 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.regularOT.rate)}
                      onChange={(e) => handleInputChange(e, "regularOT", "rate")}
                      className="flex-1 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Regular Holiday</label>
                  <input
                    type="text"
                    value={formatValue(formData.regularHoliday.rate)}
                    onChange={(e) => handleInputChange(e, "regularHoliday", "rate")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Special Holiday</label>
                  <input
                    type="text"
                    value={formatValue(formData.specialHoliday.rate)}
                    onChange={(e) => handleInputChange(e, "specialHoliday", "rate")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Rest Day</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Hrs"
                      value={formData.restDay.hours}
                      onChange={(e) => handleInputChange(e, "restDay", "hours")}
                      className="w-10 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.restDay.rate)}
                      onChange={(e) => handleInputChange(e, "restDay", "rate")}
                      className="flex-1 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Night Diff</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Hrs"
                      value={formData.nightDiff.hours}
                      onChange={(e) => handleInputChange(e, "nightDiff", "hours")}
                      className="w-10 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.nightDiff.rate)}
                      onChange={(e) => handleInputChange(e, "nightDiff", "rate")}
                      className="flex-1 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Backwage</label>
                  <input
                    type="text"
                    value={formatValue(formData.backwage.rate)}
                    onChange={(e) => handleInputChange(e, "backwage", "rate")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Column 3: Deductions */}
            <div>
              <h3 className="font-medium text-sm mb-2 uppercase">Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">SSS</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={`${formData.sss.percentage}%`}
                      onChange={(e) => handleInputChange(e, "sss", "percentage")}
                      className="w-12 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.sss.amount)}
                      onChange={(e) => handleInputChange(e, "sss", "amount")}
                      className="flex-1 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">PhilHealth</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={`${formData.philhealth.percentage}%`}
                      onChange={(e) => handleInputChange(e, "philhealth", "percentage")}
                      className="w-12 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.philhealth.amount)}
                      onChange={(e) => handleInputChange(e, "philhealth", "amount")}
                      className="flex-1 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Pag IBIG</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={`${formData.pagibig.percentage}%`}
                      onChange={(e) => handleInputChange(e, "pagibig", "percentage")}
                      className="w-12 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                    <input
                      type="text"
                      value={formatValue(formData.pagibig.amount)}
                      onChange={(e) => handleInputChange(e, "pagibig", "amount")}
                      className="flex-1 px-1 py-1 text-xs border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Late</label>
                  <input
                    type="text"
                    value={formatValue(formData.late.amount)}
                    onChange={(e) => handleInputChange(e, "late", "amount")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">WTAX (S)</label>
                  <input
                    type="text"
                    value={formatValue(formData.wtax.amount)}
                    onChange={(e) => handleInputChange(e, "wtax", "amount")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Column 4: Additional Deductions */}
            <div>
              <h3 className="font-medium text-sm mb-2 uppercase">Additional Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">No Work Day</label>
                  <input
                    type="text"
                    value={formatValue(formData.noWorkDay.amount)}
                    onChange={(e) => handleInputChange(e, "noWorkDay", "amount")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Loan</label>
                  <input
                    type="text"
                    value={formatValue(formData.loan.amount)}
                    onChange={(e) => handleInputChange(e, "loan", "amount")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Charges</label>
                  <input
                    type="text"
                    value={formatValue(formData.charges.amount)}
                    onChange={(e) => handleInputChange(e, "charges", "amount")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">Undertime</label>
                  <input
                    type="text"
                    value={formatValue(formData.undertime.amount)}
                    onChange={(e) => handleInputChange(e, "undertime", "amount")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 uppercase">MSFC Loan</label>
                  <input
                    type="text"
                    value={formatValue(formData.msfcLoan.amount)}
                    onChange={(e) => handleInputChange(e, "msfcLoan", "amount")}
                    className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Overall Section */}
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-medium text-sm mb-2 uppercase">Overall</h3>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1 uppercase">Total Gross</label>
                <input
                  type="text"
                  value={formatValue(formData.totalGross)}
                  readOnly
                  className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 uppercase">Total Deductions</label>
                <input
                  type="text"
                  value={formatValue(formData.totalDeductions)}
                  readOnly
                  className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 uppercase">Total Salary</label>
                <input
                  type="text"
                  value={formatValue(formData.totalSalaryCompensation)}
                  readOnly
                  className="w-full px-1 py-1 text-xs border rounded bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex justify-center space-x-4 sticky bottom-0 pt-2 pb-1 bg-white">
            <button
              type="submit"
              className="px-6 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
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

