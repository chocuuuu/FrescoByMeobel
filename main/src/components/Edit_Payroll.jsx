"use client"

import { useState, useEffect } from "react"

function EditPayroll({ isOpen, onClose, employeeData, onUpdate }) {
  const [formData, setFormData] = useState({
    // Payroll Dates
    payrollPeriodStart: "10/26/24",
    payrollPeriodEnd: "11/10/24",
    payDate: "11/15/2024",

    // Earnings
    baseSalary: "19000",
    allowance: "19000",
    otherEarningsNTax: "19000",
    vacationLeave: "19000",
    sickLeave: "19000",
    bereavementLeave: "19000",

    // Overtime
    regularOT: { hours: "3", rate: "19000" },
    regularHoliday: { rate: "19000" },
    specialHoliday: { rate: "19000" },
    restDay: { hours: "3", rate: "19000" },
    nightDiff: { hours: "3", rate: "19000" },
    backwage: { rate: "0" },

    // Deductions
    sss: { percentage: "10", amount: "1900" },
    philhealth: { percentage: "10", amount: "1900" },
    pagibig: { percentage: "10", amount: "1900" },
    late: { amount: "19000" },
    wtax: { amount: "19000" },

    // Additional Deductions
    noWorkDay: { amount: "19000" },
    loan: { amount: "19000" },
    charges: { amount: "19000" },
    undertime: { amount: "19000" },
    msfcLoan: { amount: "19000" },

    // Totals (calculated)
    totalGross: "19000",
    totalDeductionsBreakdown: "19000",
    totalDeductions: "19000",
    totalSalaryCompensation: "15073",
  })

  useEffect(() => {
    if (employeeData) {
      setFormData((prevData) => ({
        ...prevData,
        baseSalary: employeeData.rate_per_month,
        totalDeductions: employeeData.deductions,
      }))
    }
  }, [employeeData])

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
    return `₱ ${value}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl p-6 relative">
        {/* Employee Info */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">{employeeData?.name || "RACELL SINCIOCO"}</h2>
          <p className="text-sm text-gray-600">{employeeData?.id || "2022174599"}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onUpdate(formData)
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-3 gap-6">
            {/* Payroll Dates */}
            <div>
              <h3 className="font-medium mb-4">PAYROLL DATES</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">PAYROLL PERIOD</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.payrollPeriodStart}
                      onChange={(e) => handleInputChange(e, "payrollPeriodStart")}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50"
                    />
                    <input
                      type="text"
                      value={formData.payrollPeriodEnd}
                      onChange={(e) => handleInputChange(e, "payrollPeriodEnd")}
                      className="w-full px-2 py-1 text-sm border rounded bg-gray-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">PAY DATE</label>
                  <input
                    type="text"
                    value={formData.payDate}
                    onChange={(e) => handleInputChange(e, "payDate")}
                    className="w-full px-2 py-1 text-sm border rounded bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Overtime Breakdown */}
            <div>
              <h3 className="font-medium mb-4">OVERTIME BREAKDOWN</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Hours"
                    value={formData.regularOT.hours}
                    onChange={(e) => handleInputChange(e, "regularOT", "hours")}
                    className="w-16 px-2 py-1 text-sm border rounded"
                  />
                  <input
                    type="text"
                    value={formatValue(formData.regularOT.rate)}
                    onChange={(e) => handleInputChange(e, "regularOT", "rate")}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                  />
                </div>
                {["regularHoliday", "specialHoliday", "restDay", "nightDiff", "backwage"].map((type) => (
                  <div key={type} className="flex gap-2">
                    {(type === "restDay" || type === "nightDiff") && (
                      <input
                        type="text"
                        placeholder="Hours"
                        value={formData[type].hours}
                        onChange={(e) => handleInputChange(e, type, "hours")}
                        className="w-16 px-2 py-1 text-sm border rounded"
                      />
                    )}
                    <input
                      type="text"
                      value={formatValue(formData[type].rate)}
                      onChange={(e) => handleInputChange(e, type, "rate")}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="font-medium mb-4">DEDUCTIONS</h3>
              <div className="space-y-2">
                {["sss", "philhealth", "pagibig"].map((type) => (
                  <div key={type} className="flex gap-2">
                    <input
                      type="text"
                      value={`${formData[type].percentage}%`}
                      onChange={(e) => handleInputChange(e, type, "percentage")}
                      className="w-16 px-2 py-1 text-sm border rounded"
                    />
                    <input
                      type="text"
                      value={formatValue(formData[type].amount)}
                      onChange={(e) => handleInputChange(e, type, "amount")}
                      className="flex-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                ))}
                {["late", "wtax"].map((type) => (
                  <div key={type}>
                    <input
                      type="text"
                      value={formatValue(formData[type].amount)}
                      onChange={(e) => handleInputChange(e, type, "amount")}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Earnings */}
            <div>
              <h3 className="font-medium mb-4">EARNINGS</h3>
              <div className="space-y-2">
                {[
                  { key: "baseSalary", label: "BASE SALARY" },
                  { key: "allowance", label: "ALLOWANCE" },
                  { key: "otherEarningsNTax", label: "OTHER EARNINGS N-TAX" },
                  { key: "vacationLeave", label: "VACATION LEAVE" },
                  { key: "sickLeave", label: "SICK LEAVE" },
                  { key: "bereavementLeave", label: "BEREAVEMENT LEAVE" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1">{label}</label>
                    <input
                      type="text"
                      value={formatValue(formData[key])}
                      onChange={(e) => handleInputChange(e, key)}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Deductions */}
            <div>
              <h3 className="font-medium mb-4">ADDITIONAL DEDUCTIONS</h3>
              <div className="space-y-2">
                {[
                  { key: "noWorkDay", label: "NO WORK DAY" },
                  { key: "loan", label: "LOAN" },
                  { key: "charges", label: "CHARGES" },
                  { key: "undertime", label: "UNDERTIME" },
                  { key: "msfcLoan", label: "MSFC LOAN" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-600 mb-1">{label}</label>
                    <input
                      type="text"
                      value={formatValue(formData[key].amount)}
                      onChange={(e) => handleInputChange(e, key, "amount")}
                      className="w-full px-2 py-1 text-sm border rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Overall Section */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-medium mb-4">OVERALL</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">TOTAL GROSS</label>
                <input
                  type="text"
                  value={formatValue(formData.totalGross)}
                  readOnly
                  className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">TOTAL DEDUCTIONS</label>
                <input
                  type="text"
                  value={formatValue(formData.totalDeductions)}
                  readOnly
                  className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">TOTAL SALARY COMPENSATION</label>
                <input
                  type="text"
                  value={formatValue(formData.totalSalaryCompensation)}
                  readOnly
                  className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button type="submit" className="px-6 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
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