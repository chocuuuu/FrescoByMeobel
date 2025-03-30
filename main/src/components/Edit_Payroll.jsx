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
        baseSalary: employeeData.rate_per_month || prevData.baseSalary,
        totalDeductions: employeeData.deductions?.toString() || prevData.totalDeductions,
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-auto">
      <div className="bg-white rounded-lg w-full max-w-3xl p-4 relative max-h-[90vh] overflow-y-auto">
        {/* Employee Info */}
        <div className="mb-3">
          <h2 className="text-lg font-bold uppercase">{employeeData?.employee_name || "RACELL SINCIOCO"}</h2>
          <p className="text-xs text-gray-600">{employeeData?.employee_id || "2022174599"}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onUpdate(formData)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Payroll Dates & Earnings */}
            <div className="space-y-4">
              {/* Payroll Dates */}
              <div>
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
            <div className="space-y-4">
              {/* Main Deductions */}
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

              {/* Additional Deductions */}
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
            <button type="submit" className="px-6 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
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

