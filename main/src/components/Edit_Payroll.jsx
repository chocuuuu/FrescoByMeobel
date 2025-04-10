"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config/api"

// Add this function at the top of the component, before the useState declarations
const formatToTwoDecimals = (value) => {
  if (value === undefined || value === null || value === "") return "0.00"

  // Convert to number and ensure it has exactly 2 decimal places
  const numValue = Number.parseFloat(value)
  if (isNaN(numValue)) return "0.00"

  return numValue.toFixed(2)
}

// Add this function to handle token refresh or redirect to login
const handleTokenError = () => {
  // Clear the expired token
  localStorage.removeItem("access_token")

  // Show an alert to the user
  alert("Your session has expired. Please log in again.")

  // Redirect to login page
  window.location.href = "/"
}

function EditPayroll({ isOpen, onClose, employeeData, onUpdate }) {
  const [formData, setFormData] = useState({
    // Payroll Dates
    payrollPeriodStart: "",
    payrollPeriodEnd: "",
    payDate: "",

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
  const [earningsId, setEarningsId] = useState(null)
  const [deductionsId, setDeductionsId] = useState(null)
  const [totalOvertimeId, setTotalOvertimeId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [payrollId, setPayrollId] = useState(null)
  const [salaryId, setSalaryId] = useState(null)
  const [overtimeRecords, setOvertimeRecords] = useState({
    regularOT: null,
    restDay: null,
    nightDiff: null,
  })

  let actualUserId = ""
  // Fetch employee data from APIs when the modal opens
  useEffect(() => {
    if (employeeData && isOpen) {
      // Extract the actual user ID from the employeeData
      actualUserId = employeeData.user?.id || null

      console.log("Employee data:", employeeData)
      console.log("User ID extracted:", actualUserId)

      setUserId(actualUserId)

      if (actualUserId) {
        fetchEmployeePayrollData(actualUserId)
      } else {
        console.error("No user ID found in employee data:", employeeData)
        setError("Could not determine user ID. Please try again.")
      }
    }
  }, [employeeData, isOpen])

  // Function to check if a user has a salary record
  const checkUserSalary = async (userId) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Check if this user has a salary record
      const salaryResponse = await fetch(`${API_BASE_URL}/salary/?user=${userId}`, { headers })
      if (!salaryResponse.ok) throw new Error("Failed to fetch salary data")
      const salaryData = await salaryResponse.json()

      if (salaryData.length > 0) {
        // First try to find a record with a non-null user_id that matches our userId
        let userSalary = salaryData.find((record) => record.user === userId && record.user_id === userId)

        // If not found, fall back to any record that matches the user
        if (!userSalary) {
          userSalary = salaryData.find((record) => record.user === userId)
        }

        if (userSalary) {
          setSalaryId(userSalary.id)
          setEarningsId(userSalary.earnings_id)
          setDeductionsId(userSalary.deductions_id)
          setTotalOvertimeId(userSalary.overtime_id)
          console.log("Found salary record:", userSalary)

          // Format and set pay date from salary record
          if (userSalary.pay_date) {
            const formattedDate = formatDate(userSalary.pay_date)
            setFormData((prevData) => ({
              ...prevData,
              payDate: formattedDate,
            }))
          }

          return userSalary
        }
      }

      console.log("No salary record found for user", userId)
      return null
    } catch (error) {
      console.error("Error checking user salary:", error)
      return null
    }
  }

  // Function to format date from YYYY-MM-DD to MM/DD/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const year = date.getFullYear().toString()
    return `${month}/${day}/${year}`
  }

  // Function to check if a user has a payroll record
  const checkUserPayroll = async (userId) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      // Check if this user has a payroll record
      const payrollResponse = await fetch(`${API_BASE_URL}/payroll/?user_id=${userId}`, { headers })
      if (!payrollResponse.ok) throw new Error("Failed to fetch payroll data")
      const payrollData = await payrollResponse.json()

      if (payrollData.length > 0) {
        // First try to find a record with a non-null user_id that matches our userId
        const userPayroll = payrollData.find((record) => record.user_id === userId)

        if (userPayroll) {
          setPayrollId(userPayroll.id)
          console.log("Found payroll record:", userPayroll)

          // If payroll record contains period information, set it
          if (
            userPayroll.schedule_id &&
            userPayroll.schedule_id.payroll_period_start &&
            userPayroll.schedule_id.payroll_period_end
          ) {
            setFormData((prevData) => ({
              ...prevData,
              payrollPeriodStart: formatDate(userPayroll.schedule_id.payroll_period_start),
              payrollPeriodEnd: formatDate(userPayroll.schedule_id.payroll_period_end),
            }))
          }

          // Set pay date from payroll record
          if (userPayroll.pay_date) {
            setFormData((prevData) => ({
              ...prevData,
              payDate: formatDate(userPayroll.pay_date),
            }))
          }

          return userPayroll
        }
      }

      console.log("No payroll record found for user", userId)
      return null
    } catch (error) {
      console.error("Error checking user payroll:", error)
      return null
    }
  }

  // Replace the fetchEmployeePayrollData function with this updated version that doesn't automatically create records
  const fetchEmployeePayrollData = async (userId) => {
    if (!userId) return

    setLoading(true)
    setError(null)
    setHasPayrollData(false)

    try {
      const accessToken = localStorage.getItem("access_token")
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }

      console.log(`Fetching payroll data for user ID: ${userId}`)

      // First, check if user has a salary record
      const userSalary = await checkUserSalary(userId)

      // Then check if user has a payroll record
      const userPayroll = await checkUserPayroll(userId)

      // Check if employee has any data - DON'T automatically create records
      const hasData = userSalary !== null || userPayroll !== null

      // Fetch earnings data - add user filter parameter
      const earningsResponse = await fetch(`${API_BASE_URL}/earnings/?user=${userId}`, { headers })
      if (!earningsResponse.ok) throw new Error("Failed to fetch earnings data")
      const earningsData = await earningsResponse.json()

      // Fetch deductions data - add user filter parameter
      const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/?user=${userId}`, { headers })
      if (!deductionsResponse.ok) throw new Error("Failed to fetch deductions data")
      const deductionsData = await deductionsResponse.json()

      // Check if employee has total overtime data - add user filter parameter
      const totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/?user=${userId}`, { headers })
      if (!totalOvertimeResponse.ok) throw new Error("Failed to fetch total overtime data")
      const totalOvertimeData = await totalOvertimeResponse.json()

      // Fetch schedule data to get current payroll period
      const scheduleResponse = await fetch(`${API_BASE_URL}/schedule/?user_id=${userId}`, { headers })
      if (!scheduleResponse.ok) throw new Error("Failed to fetch schedule data")
      const scheduleData = await scheduleResponse.json()

      // Find the current payroll period
      const today = new Date()
      let currentSchedule = null

      if (scheduleData.length > 0) {
        // First try to find a schedule where today is between start and end dates
        currentSchedule = scheduleData.find((schedule) => {
          const startDate = new Date(schedule.payroll_period_start)
          const endDate = new Date(schedule.payroll_period_end)
          return today >= startDate && today <= endDate
        })

        // If not found, use the most recent schedule
        if (!currentSchedule) {
          // Sort schedules by end date in descending order
          const sortedSchedules = [...scheduleData].sort((a, b) => {
            return new Date(b.payroll_period_end) - new Date(a.payroll_period_end)
          })
          currentSchedule = sortedSchedules[0]
        }

        if (currentSchedule) {
          console.log("Found current schedule:", currentSchedule)

          // Update form data with payroll periods
          setFormData((prevData) => ({
            ...prevData,
            payrollPeriodStart: formatDate(currentSchedule.payroll_period_start),
            payrollPeriodEnd: formatDate(currentSchedule.payroll_period_end),
            // Calculate pay date (typically 5 days after period end)
            payDate: (() => {
              const endDate = new Date(currentSchedule.payroll_period_end)
              endDate.setDate(endDate.getDate() + 5) // Pay date is typically 5 days after period end
              return formatDate(endDate.toISOString().split("T")[0])
            })(),
          }))
        }
      }

      // Fetch overtime hours data - add user filter parameter
      const overtimeResponse = await fetch(`${API_BASE_URL}/overtimehours/?user=${userId}`, { headers })
      if (!overtimeResponse.ok) throw new Error("Failed to fetch overtime data")
      const overtimeData = await overtimeResponse.json()

      console.log("Earnings data:", earningsData)
      console.log("Deductions data:", deductionsData)
      console.log("Total overtime data:", totalOvertimeData)
      console.log("Overtime hours data:", overtimeData)

      // Fetch SSS data
      console.log("Fetching SSS data for user ID:", userId)
      const sssResponse = await fetch(`${API_BASE_URL}/sss/?user=${userId}`, { headers })
      if (!sssResponse.ok) {
        console.warn("Failed to fetch SSS data, will use default values")
      }

      let sssData = []
      try {
        sssData = await sssResponse.json()
        console.log("SSS data:", sssData)
      } catch (e) {
        console.error("Error parsing SSS data:", e)
      }

      // Fetch PhilHealth data
      console.log("Fetching PhilHealth data for user ID:", userId)
      const philhealthResponse = await fetch(`${API_BASE_URL}/philhealth/?user=${userId}`, { headers })
      if (!philhealthResponse.ok) {
        console.warn("Failed to fetch PhilHealth data, will use default values")
      }

      let philhealthData = []
      try {
        philhealthData = await philhealthResponse.json()
        console.log("PhilHealth data:", philhealthData)
      } catch (e) {
        console.error("Error parsing PhilHealth data:", e)
      }

      // Fetch Pag-IBIG data
      console.log("Fetching Pag-IBIG data for user ID:", userId)
      const pagibigResponse = await fetch(`${API_BASE_URL}/pagibig/?user=${userId}`, { headers })
      if (!pagibigResponse.ok) {
        console.warn("Failed to fetch Pag-IBIG data, will use default values")
      }

      let pagibigData = []
      try {
        pagibigData = await pagibigResponse.json()
        console.log("Pag-IBIG data:", pagibigData)
      } catch (e) {
        console.error("Error parsing Pag-IBIG data:", e)
      }

      // Extract SSS, PhilHealth, and Pag-IBIG data
      const sssRecord = sssData.find((record) => record.user === Number(userId))
      const philhealthRecord = philhealthData.find((record) => record.user === Number(userId))
      const pagibigRecord = pagibigData.find((record) => record.user === Number(userId))

      // Store record IDs for updates - only if they belong to this user
      if (earningsData.length > 0) {
        // Find the earnings record that belongs to this user
        const userEarnings = earningsData.find((record) => record.user === userId)
        if (userEarnings) {
          setEarningsId(userEarnings.id)
          console.log(`Found earnings ID ${userEarnings.id} for user ${userId}`)
        } else {
          console.log(`No earnings record found for user ${userId}`)
        }
      }

      if (deductionsData.length > 0) {
        // Find the deductions record that belongs to this user
        const userDeductions = deductionsData.find((record) => record.user === userId)
        if (userDeductions) {
          setDeductionsId(userDeductions.id)
          console.log(`Found deductions ID ${userDeductions.id} for user ${userId}`)
        } else {
          console.log(`No deductions record found for user ${userId}`)
        }
      }

      if (totalOvertimeData.length > 0) {
        // Find the total overtime record that belongs to this user
        const userTotalOvertime = totalOvertimeData.find((record) => record.user === userId)
        if (userTotalOvertime) {
          setTotalOvertimeId(userTotalOvertime.id)
          console.log(`Found total overtime ID ${userTotalOvertime.id} for user ${userId}`)
        } else {
          console.log(`No total overtime record found for user ${userId}`)
        }
      }

      // Store overtime record IDs for updates
      const newOvertimeRecords = { regularOT: null, restDay: null, nightDiff: null }

      if (overtimeData.length > 0) {
        // Find and store the IDs for each overtime type that belongs to this user
        overtimeData.forEach((record) => {
          if (record.user === userId) {
            if (record.type === "regular") {
              newOvertimeRecords.regularOT = record.id
            } else if (record.type === "rest_day") {
              newOvertimeRecords.restDay = record.id
            } else if (record.type === "night_diff") {
              newOvertimeRecords.nightDiff = record.id
            }
          }
        })
      }

      setOvertimeRecords(newOvertimeRecords)
      console.log("Overtime record IDs:", newOvertimeRecords)

      // Update hasPayrollData based on whether we found any data
      const foundData =
        (earningsData.length > 0 && earningsData.some((record) => record.user === userId)) ||
        (deductionsData.length > 0 && deductionsData.some((record) => record.user === userId)) ||
        (totalOvertimeData.length > 0 && totalOvertimeData.some((record) => record.user === userId)) ||
        (overtimeData.length > 0 && overtimeData.some((record) => record.user === userId)) ||
        hasData

      setHasPayrollData(foundData)

      // If employee has data, update form with it
      if (foundData) {
        // Find the records that belong to this user
        const userEarnings = earningsData.find((record) => record.user === userId) || null
        const userDeductions = deductionsData.find((record) => record.user === userId) || null
        const userTotalOvertime = totalOvertimeData.find((record) => record.user === userId) || null
        const userOvertimeData = overtimeData.filter((record) => record.user === userId) || []

        const updatedFormData = createFormDataFromApi(
          userEarnings,
          userDeductions,
          userOvertimeData,
          userTotalOvertime,
          userSalary,
          employeeData,
          sssRecord,
          philhealthRecord,
          pagibigRecord,
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

  const createFormDataFromApi = (
    earnings,
    deductions,
    overtime,
    totalOvertime,
    salary,
    employeeData,
    sssRecord,
    philhealthRecord,
    pagibigRecord,
  ) => {
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
      newFormData.wtax.amount = deductions.wtax?.toString() || newFormData.wtax.amount
      newFormData.nowork.amount = deductions.nowork?.toString() || newFormData.nowork.amount
      newFormData.loan.amount = deductions.loan?.toString() || newFormData.loan.amount
      newFormData.charges.amount = deductions.charges?.toString() || newFormData.charges.amount
      newFormData.undertime.amount = deductions.undertime?.toString() || newFormData.undertime.amount
      newFormData.msfcloan.amount = deductions.msfcloan?.toString() || newFormData.msfcloan.amount
    }

    // Update overtime data if available
    if (overtime && overtime.length > 0) {
      // Find regular overtime hours
      const regularOT = overtime.find((ot) => ot.type === "regular")
      if (regularOT) {
        newFormData.regularOT.hours = regularOT.hours?.toString() || newFormData.regularOT.hours
      }

      // Find rest day hours
      const restDay = overtime.find((ot) => ot.type === "rest_day")
      if (restDay) {
        newFormData.restDay.hours = restDay.hours?.toString() || newFormData.restDay.hours
      }

      // Find night differential hours
      const nightDiff = overtime.find((ot) => ot.type === "night_diff")
      if (nightDiff) {
        newFormData.nightDiff.hours = nightDiff.hours?.toString() || newFormData.nightDiff.hours
      }
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

    // Update SSS data if available
    if (sssRecord) {
      newFormData.sss.amount = sssRecord.employee_share?.toString() || newFormData.sss.amount
    }

    // Update PhilHealth data if available
    if (philhealthRecord) {
      newFormData.philhealth.amount = philhealthRecord.total_contribution?.toString() || newFormData.philhealth.amount
    }

    // Update Pag-IBIG data if available
    if (pagibigRecord) {
      newFormData.pagibig.amount = pagibigRecord.employee_share?.toString() || newFormData.pagibig.amount
    }

    // Calculate totals
    const totals = calculateTotals(newFormData)

    // Return the complete form data
    return { ...newFormData, ...totals }
  }

  // Replace the calculateTotals function with this improved version
  const calculateTotals = (data) => {
    // Parse all values to ensure they're numbers
    const basic = Number.parseFloat(data.basic) || 0
    const allowance = Number.parseFloat(data.allowance) || 0
    const ntax = Number.parseFloat(data.ntax) || 0
    const vacationleave = Number.parseFloat(data.vacationleave) || 0
    const sickleave = Number.parseFloat(data.sickleave) || 0
    const bereavementLeave = Number.parseFloat(data.bereavementLeave) || 0

    const regularOT = Number.parseFloat(data.regularOT.rate) || 0
    const regularHoliday = Number.parseFloat(data.regularHoliday.rate) || 0
    const specialHoliday = Number.parseFloat(data.specialHoliday.rate) || 0
    const restDay = Number.parseFloat(data.restDay.rate) || 0
    const nightDiff = Number.parseFloat(data.nightDiff.rate) || 0
    const backwage = Number.parseFloat(data.backwage.rate) || 0

    const sss = Number.parseFloat(data.sss.amount) || 0
    const philhealth = Number.parseFloat(data.philhealth.amount) || 0
    const pagibig = Number.parseFloat(data.pagibig.amount) || 0
    const late = Number.parseFloat(data.late.amount) || 0
    const wtax = Number.parseFloat(data.wtax.amount) || 0
    const nowork = Number.parseFloat(data.nowork.amount) || 0
    const loan = Number.parseFloat(data.loan.amount) || 0
    const charges = Number.parseFloat(data.charges.amount) || 0
    const undertime = Number.parseFloat(data.undertime.amount) || 0
    const msfcloan = Number.parseFloat(data.msfcloan.amount) || 0

    // Calculate total gross
    const totalGross =
      basic +
      allowance +
      ntax +
      vacationleave +
      sickleave +
      bereavementLeave +
      regularOT +
      regularHoliday +
      specialHoliday +
      restDay +
      nightDiff +
      backwage

    // Calculate total deductions
    const totalDeductions = sss + philhealth + pagibig + late + wtax + nowork + loan + charges + undertime + msfcloan

    // Calculate total salary compensation
    const totalSalaryCompensation = totalGross - totalDeductions

    console.log("Calculated totals:", {
      totalGross,
      totalDeductions,
      totalSalaryCompensation,
    })

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

      // Fetch SSS contribution
      const sssResponse = await fetch(`${API_BASE_URL}/sss/calculate/?salary=${basicRate}`, { headers })
      let sssData = { employee_share: 0 }
      if (sssResponse.ok) {
        sssData = await sssResponse.json()
      }

      // Fetch PhilHealth contribution
      const philhealthResponse = await fetch(`${API_BASE_URL}/philhealth/calculate/?salary=${basicRate}`, { headers })
      let philhealthData = { total_contribution: 0 }
      if (philhealthResponse.ok) {
        philhealthData = await philhealthResponse.json()
      }

      // Fetch Pag-IBIG contribution
      const pagibigResponse = await fetch(`${API_BASE_URL}/pagibig/calculate/?salary=${basicRate}`, { headers })
      let pagibigData = { employee_share: 0 }
      if (pagibigResponse.ok) {
        pagibigData = await pagibigResponse.json()
      }

      console.log("Calculated benefits:", {
        sss: sssData,
        philhealth: philhealthData,
        pagibig: pagibigData,
      })

      return {
        sss: sssData.employee_share || 0,
        philhealth: philhealthData.total_contribution || 0,
        pagibig: pagibigData.employee_share || 0,
      }
    } catch (error) {
      console.error("Error calculating benefits:", error)

      // Fallback to default calculations if API fails
      const basicRateNum = Number.parseFloat(basicRate) || 0

      // Simple default calculations
      const sss = basicRateNum * 0.045 // 4.5% of basic rate
      const philhealth = basicRateNum * 0.035 // 3.5% of basic rate
      const pagibig = 100 // Fixed amount

      return {
        sss,
        philhealth,
        pagibig,
      }
    }
  }

  // Replace the handleInputChange function with this improved version
  const handleInputChange = async (e, section, field, subfield = null) => {
    // Get the raw input value
    let value = e.target.value

    // Remove peso sign if present
    value = value.replace(/^₱/, "")

    // Allow typing decimal points and numbers
    if (e.nativeEvent) {
      // Remove any non-numeric characters except decimal point
      value = value.replace(/[^\d.]/g, "")

      // Ensure only one decimal point
      const parts = value.split(".")
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("")
      }

      // Limit to 2 decimal places only if there's a decimal point and user has typed past it
      if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + "." + parts[1].substring(0, 2)
      }
    }

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
      console.log("Basic rate changed, calculating benefits for:", value)
      const benefits = await calculateBenefits(value)
      console.log("Calculated benefits:", benefits)

      newFormData.sss.amount = benefits.sss.toString()
      newFormData.philhealth.amount = benefits.philhealth.toString()
      newFormData.pagibig.amount = benefits.pagibig.toString()
    }

    const totals = calculateTotals(newFormData)
    setFormData({ ...newFormData, ...totals })
  }

  // Format for display with Peso sign and 2 decimal places
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "0.00"

    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) return "0.00"

    return numValue.toFixed(2)
  }

  // Updated handleSubmit function to use PATCH for existing records
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!userId) {
      console.error("No user ID available")
      setError("User ID is missing. Cannot save payroll data.")
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

      // Recalculate benefits based on the current basic rate
      const benefits = await calculateBenefits(formData.basicRate)

      // Update the form data with the calculated benefits
      const updatedFormData = {
        ...formData,
        sss: { amount: benefits.sss.toString() },
        philhealth: { amount: benefits.philhealth.toString() },
        pagibig: { amount: benefits.pagibig.toString() },
      }

      // Calculate totals with the updated benefits
      const totals = calculateTotals(updatedFormData)
      const finalFormData = { ...updatedFormData, ...totals }

      // Update the state with the new values
      setFormData(finalFormData)

      // Use the updated totals for all calculations
      const totalGross = Number.parseFloat(finalFormData.totalGross)
      const totalDeductions = Number.parseFloat(finalFormData.totalDeductions)
      const totalSalaryCompensation = Number.parseFloat(finalFormData.totalSalaryCompensation)

      // STEP 1: Update or create the base components only
      // ------------------------------------------------

      // 1.1 Update or create Earnings record
      console.log("Updating earnings record...")
      const earningsData = {
        user: userId,
        basic_rate: Number.parseFloat(finalFormData.basicRate).toFixed(2),
        basic: Number.parseFloat(finalFormData.basic).toFixed(2),
        allowance: Number.parseFloat(finalFormData.allowance).toFixed(2),
        ntax: Number.parseFloat(finalFormData.ntax).toFixed(2),
        vacationleave: Number.parseFloat(finalFormData.vacationleave).toFixed(2),
        sickleave: Number.parseFloat(finalFormData.sickleave).toFixed(2),
      }

      let earningsResponse
      if (earningsId) {
        // Update existing record
        earningsResponse = await fetch(`${API_BASE_URL}/earnings/${earningsId}/`, {
          method: "PATCH",
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

      if (!earningsResponse.ok) {
        throw new Error(`Failed to update earnings: ${earningsResponse.status} ${earningsResponse.statusText}`)
      }

      const earningsResult = await earningsResponse.json()
      console.log("Earnings updated:", earningsResult)
      setEarningsId(earningsResult.id)

      // 1.2 Update or create Deductions record
      console.log("Updating deductions record...")
      const deductionsData = {
        user: userId,
        wtax: Number.parseFloat(finalFormData.wtax.amount).toFixed(2),
        nowork: Number.parseFloat(finalFormData.nowork.amount).toFixed(2),
        loan: Number.parseFloat(finalFormData.loan.amount).toFixed(2),
        charges: Number.parseFloat(finalFormData.charges.amount).toFixed(2),
        msfcloan: Number.parseFloat(finalFormData.msfcloan.amount).toFixed(2),
      }

      let deductionsResponse
      if (deductionsId) {
        // Update existing record
        deductionsResponse = await fetch(`${API_BASE_URL}/deductions/${deductionsId}/`, {
          method: "PATCH",
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

      if (!deductionsResponse.ok) {
        throw new Error(`Failed to update deductions: ${deductionsResponse.status} ${deductionsResponse.statusText}`)
      }

      const deductionsResult = await deductionsResponse.json()
      console.log("Deductions updated:", deductionsResult)
      setDeductionsId(deductionsResult.id)

      // 1.3 Update or create Total Overtime record
      console.log("Updating total overtime record...")
      const totalOvertimeData = {
        user: userId,
        total_regularot: Number.parseFloat(finalFormData.regularOT.rate).toFixed(2),
        total_regularholiday: Number.parseFloat(finalFormData.regularHoliday.rate).toFixed(2),
        total_specialholiday: Number.parseFloat(finalFormData.specialHoliday.rate).toFixed(2),
        total_restday: Number.parseFloat(finalFormData.restDay.rate).toFixed(2),
        total_nightdiff: Number.parseFloat(finalFormData.nightDiff.rate).toFixed(2),
        total_backwage: Number.parseFloat(finalFormData.backwage.rate).toFixed(2),
        total_late: Number.parseFloat(finalFormData.late.amount).toFixed(2),
        total_undertime: Number.parseFloat(finalFormData.undertime.amount).toFixed(2),
      }

      let totalOvertimeResponse
      if (totalOvertimeId) {
        // Update existing record
        totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/${totalOvertimeId}/`, {
          method: "PATCH",
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

      if (!totalOvertimeResponse.ok) {
        throw new Error(
          `Failed to update total overtime: ${totalOvertimeResponse.status} ${totalOvertimeResponse.statusText}`,
        )
      }

      const totalOvertimeResult = await totalOvertimeResponse.json()
      console.log("Total overtime updated:", totalOvertimeResult)
      setTotalOvertimeId(totalOvertimeResult.id)

      // 1.4 Update or create SSS record
      console.log("Updating SSS record...")
      const sssData = {
        user: userId,
        basic_salary: Number.parseFloat(finalFormData.basicRate).toFixed(2),
        employee_share: Number.parseFloat(finalFormData.sss.amount).toFixed(2),
      }

      // Check if SSS record exists
      const sssCheckResponse = await fetch(`${API_BASE_URL}/sss/?user=${userId}`, { headers })
      const sssRecords = await sssCheckResponse.json()
      const existingSssRecord = sssRecords.find((record) => record.user === Number(userId))

      let sssResponse
      if (existingSssRecord) {
        // Update existing record
        sssResponse = await fetch(`${API_BASE_URL}/sss/${existingSssRecord.id}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(sssData),
        })
      } else {
        // Create new record
        sssResponse = await fetch(`${API_BASE_URL}/sss/`, {
          method: "POST",
          headers,
          body: JSON.stringify(sssData),
        })
      }

      if (!sssResponse.ok) {
        throw new Error(`Failed to update SSS: ${sssResponse.status} ${sssResponse.statusText}`)
      }

      const sssResult = await sssResponse.json()
      console.log("SSS updated:", sssResult)

      // 1.5 Update or create PhilHealth record
      console.log("Updating PhilHealth record...")
      const philhealthData = {
        user: userId,
        basic_salary: Number.parseFloat(finalFormData.basicRate).toFixed(2),
        total_contribution: Number.parseFloat(finalFormData.philhealth.amount).toFixed(2),
      }

      // Check if PhilHealth record exists
      const philhealthCheckResponse = await fetch(`${API_BASE_URL}/philhealth/?user=${userId}`, { headers })
      const philhealthRecords = await philhealthCheckResponse.json()
      const existingPhilhealthRecord = philhealthRecords.find((record) => record.user === Number(userId))

      let philhealthResponse
      if (existingPhilhealthRecord) {
        // Update existing record
        philhealthResponse = await fetch(`${API_BASE_URL}/philhealth/${existingPhilhealthRecord.id}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(philhealthData),
        })
      } else {
        // Create new record
        philhealthResponse = await fetch(`${API_BASE_URL}/philhealth/`, {
          method: "POST",
          headers,
          body: JSON.stringify(philhealthData),
        })
      }

      if (!philhealthResponse.ok) {
        throw new Error(`Failed to update PhilHealth: ${philhealthResponse.status} ${philhealthResponse.statusText}`)
      }

      const philhealthResult = await philhealthResponse.json()
      console.log("PhilHealth updated:", philhealthResult)

      // 1.6 Update or create Pag-IBIG record
      console.log("Updating Pag-IBIG record...")
      const pagibigData = {
        user: userId,
        basic_salary: Number.parseFloat(finalFormData.basicRate).toFixed(2),
        employee_share: Number.parseFloat(finalFormData.pagibig.amount).toFixed(2),
      }

      // Check if Pag-IBIG record exists
      const pagibigCheckResponse = await fetch(`${API_BASE_URL}/pagibig/?user=${userId}`, { headers })
      const pagibigRecords = await pagibigCheckResponse.json()
      const existingPagibigRecord = pagibigRecords.find((record) => record.user === Number(userId))

      let pagibigResponse
      if (existingPagibigRecord) {
        // Update existing record
        pagibigResponse = await fetch(`${API_BASE_URL}/pagibig/${existingPagibigRecord.id}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(pagibigData),
        })
      } else {
        // Create new record
        pagibigResponse = await fetch(`${API_BASE_URL}/pagibig/`, {
          method: "POST",
          headers,
          body: JSON.stringify(pagibigData),
        })
      }

      if (!pagibigResponse.ok) {
        throw new Error(`Failed to update Pag-IBIG: ${pagibigResponse.status} ${pagibigResponse.statusText}`)
      }

      const pagibigResult = await pagibigResponse.json()
      console.log("Pag-IBIG updated:", pagibigResult)

      // STEP 2: Create or update the Salary record
      // -----------------------------------------
      console.log("Updating salary record...")

      // Parse the pay date
      const payDateParts = finalFormData.payDate.split("/")
      const formattedPayDate = `${payDateParts[2]}-${payDateParts[0]}-${payDateParts[1]}`

      const salaryData = {
        user_id: userId,
        earnings_id: earningsResult.id,
        deductions_id: deductionsResult.id,
        overtime_id: totalOvertimeResult.id,
        sss_id: sssResult.id,
        philhealth_id: philhealthResult.id,
        pagibig_id: pagibigResult.id,
        pay_date: formattedPayDate,
      }

      let salaryResponse
      if (salaryId) {
        // Update existing record
        salaryResponse = await fetch(`${API_BASE_URL}/salary/${salaryId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(salaryData),
        })
      } else {
        // Create new record
        salaryResponse = await fetch(`${API_BASE_URL}/salary/`, {
          method: "POST",
          headers,
          body: JSON.stringify(salaryData),
        })
      }

      if (!salaryResponse.ok) {
        throw new Error(`Failed to update salary: ${salaryResponse.status} ${salaryResponse.statusText}`)
      }

      const salaryResult = await salaryResponse.json()
      console.log("Salary updated:", salaryResult)
      setSalaryId(salaryResult.id)

      // STEP 3: Create or update the Payroll record
      // ------------------------------------------
      console.log("Updating payroll record...")
      const payrollData = {
        user_id: userId,
        salary_id: salaryResult.id,
        gross_pay: totalGross.toFixed(2),
        total_deductions: totalDeductions.toFixed(2),
        net_pay: totalSalaryCompensation.toFixed(2),
        pay_date: formattedPayDate,
        status: "Processing", // Set status to Processing after update
      }

      let payrollResponse
      if (payrollId) {
        // Update existing record
        payrollResponse = await fetch(`${API_BASE_URL}/payroll/${payrollId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payrollData),
        })
      } else {
        // Create new record
        payrollResponse = await fetch(`${API_BASE_URL}/payroll/`, {
          method: "POST",
          headers,
          body: JSON.stringify(payrollData),
        })
      }

      if (!payrollResponse.ok) {
        throw new Error(`Failed to update payroll: ${payrollResponse.status} ${payrollResponse.statusText}`)
      }

      const payrollResult = await payrollResponse.json()
      console.log("Payroll updated:", payrollResult)
      setPayrollId(payrollResult.id)

      // Update the parent component with the new data
      onUpdate({
        totalGross: totalGross.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        totalSalaryCompensation: totalSalaryCompensation.toFixed(2),
      })

      alert("Payroll information saved successfully!")
    } catch (error) {
      console.error("Error saving payroll data:", error)
      setError(`Failed to save payroll data: ${error.message}`)
      alert(`Failed to save payroll data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#A7BC8F] text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Edit Payroll: {employeeData?.employee_name} ({employeeData?.position})
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none text-xl font-bold">
            ×
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">Loading payroll data...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Payroll Period Information */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Payroll Period Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                  <input
                    type="text"
                    value={formData.payrollPeriodStart}
                    onChange={(e) => setFormData({ ...formData, payrollPeriodStart: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="MM/DD/YYYY"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                  <input
                    type="text"
                    value={formData.payrollPeriodEnd}
                    onChange={(e) => setFormData({ ...formData, payrollPeriodEnd: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="MM/DD/YYYY"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay Date</label>
                  <input
                    type="text"
                    value={formData.payDate}
                    onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="MM/DD/YYYY"
                  />
                </div>
              </div>
            </div>

            {/* Earnings Section */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Earnings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Monthly Rate</label>
                  <input
                    type="text"
                    value={formData.basicRate}
                    onChange={(e) => handleInputChange(e, "basicRate")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic (This Period)</label>
                  <input
                    type="text"
                    value={formData.basic}
                    onChange={(e) => handleInputChange(e, "basic")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowance</label>
                  <input
                    type="text"
                    value={formData.allowance}
                    onChange={(e) => handleInputChange(e, "allowance")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Non-Taxable</label>
                  <input
                    type="text"
                    value={formData.ntax}
                    onChange={(e) => handleInputChange(e, "ntax")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vacation Leave</label>
                  <input
                    type="text"
                    value={formData.vacationleave}
                    onChange={(e) => handleInputChange(e, "vacationleave")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sick Leave</label>
                  <input
                    type="text"
                    value={formData.sickleave}
                    onChange={(e) => handleInputChange(e, "sickleave")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Overtime Section */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Overtime</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular OT</label>
                  <input
                    type="text"
                    value={formData.regularOT.rate}
                    onChange={(e) => handleInputChange(e, "regularOT", "rate")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regular Holiday</label>
                  <input
                    type="text"
                    value={formData.regularHoliday.rate}
                    onChange={(e) => handleInputChange(e, "regularHoliday", "rate")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Holiday</label>
                  <input
                    type="text"
                    value={formData.specialHoliday.rate}
                    onChange={(e) => handleInputChange(e, "specialHoliday", "rate")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rest Day</label>
                  <input
                    type="text"
                    value={formData.restDay.rate}
                    onChange={(e) => handleInputChange(e, "restDay", "rate")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Night Differential</label>
                  <input
                    type="text"
                    value={formData.nightDiff.rate}
                    onChange={(e) => handleInputChange(e, "nightDiff", "rate")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backwage</label>
                  <input
                    type="text"
                    value={formData.backwage.rate}
                    onChange={(e) => handleInputChange(e, "backwage", "rate")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Benefits (Automatically Calculated)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SSS</label>
                  <input
                    type="text"
                    value={formData.sss.amount}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="0.00"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PhilHealth</label>
                  <input
                    type="text"
                    value={formData.philhealth.amount}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="0.00"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pag-IBIG</label>
                  <input
                    type="text"
                    value={formData.pagibig.amount}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="0.00"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Additional Deductions Section */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Additional Deductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Withholding Tax</label>
                  <input
                    type="text"
                    value={formData.wtax.amount}
                    onChange={(e) => handleInputChange(e, "wtax", "amount")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No Work</label>
                  <input
                    type="text"
                    value={formData.nowork.amount}
                    onChange={(e) => handleInputChange(e, "nowork", "amount")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan</label>
                  <input
                    type="text"
                    value={formData.loan.amount}
                    onChange={(e) => handleInputChange(e, "loan", "amount")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Charges</label>
                  <input
                    type="text"
                    value={formData.charges.amount}
                    onChange={(e) => handleInputChange(e, "charges", "amount")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Undertime</label>
                  <input
                    type="text"
                    value={formData.undertime.amount}
                    onChange={(e) => handleInputChange(e, "undertime", "amount")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MSFC Loan</label>
                  <input
                    type="text"
                    value={formData.msfcloan.amount}
                    onChange={(e) => handleInputChange(e, "msfcloan", "amount")}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Gross</label>
                  <input
                    type="text"
                    value={`₱${formatCurrency(formData.totalGross)}`}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Deductions</label>
                  <input
                    type="text"
                    value={`₱${formatCurrency(formData.totalDeductions)}`}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary</label>
                  <input
                    type="text"
                    value={`₱${formatCurrency(formData.totalSalaryCompensation)}`}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 font-bold"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#5C7346] text-white rounded-md hover:bg-[#4a5c38] transition-colors"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default EditPayroll
