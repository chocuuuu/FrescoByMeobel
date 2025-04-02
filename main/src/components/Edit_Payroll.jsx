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

      // Fetch overtime hours data - add user filter parameter
      const overtimeResponse = await fetch(`${API_BASE_URL}/overtimehours/?user=${userId}`, { headers })
      if (!overtimeResponse.ok) throw new Error("Failed to fetch overtime data")
      const overtimeData = await overtimeResponse.json()

      console.log("Earnings data:", earningsData)
      console.log("Deductions data:", deductionsData)
      console.log("Total overtime data:", totalOvertimeData)
      console.log("Overtime hours data:", overtimeData)

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

      // Calculate SSS contribution
      const sssResponse = await fetch(`${API_BASE_URL}/benefits/sss/?salary=${basicRate}`, { headers })
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
      const benefits = await calculateBenefits(value)
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

  // Replace the handleSubmit function with this updated version that properly handles creating or updating records
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

      // Calculate totals to ensure they're up-to-date
      const totals = calculateTotals(formData)
      const updatedFormData = { ...formData, ...totals }

      // Use the updated totals for all calculations
      const totalGross = Number.parseFloat(updatedFormData.totalGross)
      const totalDeductions = Number.parseFloat(updatedFormData.totalDeductions)
      const totalSalaryCompensation = Number.parseFloat(updatedFormData.totalSalaryCompensation)

      // Step 1: Create or update earnings, deductions, and overtime records
      let earningsId = null
      let deductionsId = null
      let overtimeId = null

      // Prepare earnings data
      const earningsData = {
        user: userId,
        basic_rate: Number.parseFloat(updatedFormData.basicRate).toFixed(2),
        basic: Number.parseFloat(updatedFormData.basic).toFixed(2),
        allowance: Number.parseFloat(updatedFormData.allowance).toFixed(2),
        ntax: Number.parseFloat(updatedFormData.ntax).toFixed(2),
        vacationleave: Number.parseFloat(updatedFormData.vacationleave).toFixed(2),
        sickleave: Number.parseFloat(updatedFormData.sickleave).toFixed(2),
      }

      // Create or update earnings record
      if (earningsId) {
        // Update existing record
        console.log(`Updating earnings record with ID ${earningsId}`)
        const earningsResponse = await fetch(`${API_BASE_URL}/earnings/${earningsId}/`, {
          method: "PATCH", // Use PATCH instead of PUT
          headers,
          body: JSON.stringify(earningsData),
        })

        if (!earningsResponse.ok) {
          const errorData = await earningsResponse.json()
          console.error("Earnings update error:", errorData)
          throw new Error(`Failed to update earnings data: ${JSON.stringify(errorData)}`)
        }

        const earningsResult = await earningsResponse.json()
        console.log("Earnings update result:", earningsResult)
        earningsId = earningsResult.id
      } else {
        // Create new record
        console.log("Creating new earnings record")
        const earningsResponse = await fetch(`${API_BASE_URL}/earnings/`, {
          method: "POST",
          headers,
          body: JSON.stringify(earningsData),
        })

        if (!earningsResponse.ok) {
          const errorData = await earningsResponse.json()
          console.error("Earnings creation error:", errorData)
          throw new Error(`Failed to create earnings data: ${JSON.stringify(errorData)}`)
        }

        const earningsResult = await earningsResponse.json()
        console.log("Earnings creation result:", earningsResult)
        earningsId = earningsResult.id
      }

      // Prepare deductions data
      const deductionsData = {
        user: userId,
        sss: Number.parseFloat(updatedFormData.sss.amount).toFixed(2),
        philhealth: Number.parseFloat(updatedFormData.philhealth.amount).toFixed(2),
        pagibig: Number.parseFloat(updatedFormData.pagibig.amount).toFixed(2),
        late: Number.parseFloat(updatedFormData.late.amount).toFixed(2),
        wtax: Number.parseFloat(updatedFormData.wtax.amount).toFixed(2),
        nowork: Number.parseFloat(updatedFormData.nowork.amount).toFixed(2),
        loan: Number.parseFloat(updatedFormData.loan.amount).toFixed(2),
        charges: Number.parseFloat(updatedFormData.charges.amount).toFixed(2),
        undertime: Number.parseFloat(updatedFormData.undertime.amount).toFixed(2),
        msfcloan: Number.parseFloat(updatedFormData.msfcloan.amount).toFixed(2),
      }

      // Create or update deductions record
      if (deductionsId) {
        // Update existing record
        console.log(`Updating deductions record with ID ${deductionsId}`)
        const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/${deductionsId}/`, {
          method: "PATCH", // Use PATCH instead of PUT
          headers,
          body: JSON.stringify(deductionsData),
        })

        if (!deductionsResponse.ok) {
          const errorData = await deductionsResponse.json()
          console.error("Deductions update error:", errorData)
          throw new Error(`Failed to update deductions data: ${JSON.stringify(errorData)}`)
        }

        const deductionsResult = await deductionsResponse.json()
        console.log("Deductions update result:", deductionsResult)
        deductionsId = deductionsResult.id
      } else {
        // Create new record
        console.log("Creating new deductions record")
        const deductionsResponse = await fetch(`${API_BASE_URL}/deductions/`, {
          method: "POST",
          headers,
          body: JSON.stringify(deductionsData),
        })

        if (!deductionsResponse.ok) {
          const errorData = await deductionsResponse.json()
          console.error("Deductions creation error:", errorData)
          throw new Error(`Failed to create deductions data: ${JSON.stringify(errorData)}`)
        }

        const deductionsResult = await deductionsResponse.json()
        console.log("Deductions creation result:", deductionsResult)
        deductionsId = deductionsResult.id
      }

      // Prepare total overtime data
      const totalOvertimeData = {
        user: userId,
        total_regularot: Number.parseFloat(updatedFormData.regularOT.rate).toFixed(2),
        total_regularholiday: Number.parseFloat(updatedFormData.regularHoliday.rate).toFixed(2),
        total_specialholiday: Number.parseFloat(updatedFormData.specialHoliday.rate).toFixed(2),
        total_restday: Number.parseFloat(updatedFormData.restDay.rate).toFixed(2),
        total_nightdiff: Number.parseFloat(updatedFormData.nightDiff.rate).toFixed(2),
        total_backwage: Number.parseFloat(updatedFormData.backwage.rate).toFixed(2),
        total_overtime: (
          Number.parseFloat(updatedFormData.regularOT.rate) +
          Number.parseFloat(updatedFormData.regularHoliday.rate) +
          Number.parseFloat(updatedFormData.specialHoliday.rate) +
          Number.parseFloat(updatedFormData.restDay.rate) +
          Number.parseFloat(updatedFormData.nightDiff.rate)
        ).toFixed(2),
        total_late: Number.parseFloat(updatedFormData.late.amount).toFixed(2),
        total_undertime: Number.parseFloat(updatedFormData.undertime.amount).toFixed(2),
        biweek_start: new Date().toISOString().split("T")[0],
      }

      // Create or update total overtime record
      if (totalOvertimeId) {
        // Update existing record
        console.log(`Updating total overtime record with ID ${totalOvertimeId}`)
        const totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/${totalOvertimeId}/`, {
          method: "PATCH", // Use PATCH instead of PUT
          headers,
          body: JSON.stringify(totalOvertimeData),
        })

        if (!totalOvertimeResponse.ok) {
          const errorData = await totalOvertimeResponse.json()
          console.error("Total overtime update error:", errorData)
          throw new Error(`Failed to update total overtime data: ${JSON.stringify(errorData)}`)
        }

        const totalOvertimeResult = await totalOvertimeResponse.json()
        console.log("Total overtime update result:", totalOvertimeResult)
        overtimeId = totalOvertimeResult.id
      } else {
        // Create new record
        console.log("Creating new total overtime record")
        const totalOvertimeResponse = await fetch(`${API_BASE_URL}/totalovertime/`, {
          method: "POST",
          headers,
          body: JSON.stringify(totalOvertimeData),
        })

        if (!totalOvertimeResponse.ok) {
          const errorData = await totalOvertimeResponse.json()
          console.error("Total overtime creation error:", errorData)
          throw new Error(`Failed to create total overtime data: ${JSON.stringify(errorData)}`)
        }

        const totalOvertimeResult = await totalOvertimeResponse.json()
        console.log("Total overtime creation result:", totalOvertimeResult)
        overtimeId = totalOvertimeResult.id
      }

      // Find the section where we create or update the salary record (around line 950)
      // Replace the salaryData object with this updated version:

      // Step 2: Create or update salary record
      let salaryRecordId = null

      // First, fetch the SSS, PhilHealth, and Pag-IBIG records for this user
      console.log(`Fetching benefit records for user ID: ${userId}`)
      const [sssRecords, philhealthRecords, pagibigRecords] = await Promise.all([
        fetch(`${API_BASE_URL}/benefits/sss/?user=${userId}`, { headers }).then((res) => (res.ok ? res.json() : [])),
        fetch(`${API_BASE_URL}/benefits/philhealth/?user=${userId}`, { headers }).then((res) =>
          res.ok ? res.json() : [],
        ),
        fetch(`${API_BASE_URL}/benefits/pagibig/?user=${userId}`, { headers }).then((res) =>
          res.ok ? res.json() : [],
        ),
      ])

      // Get the complete objects if records exist - make sure we're getting the correct records for this user
      let sssRecord =
        sssRecords && sssRecords.length > 0
          ? sssRecords.find((record) => record.user === Number.parseInt(userId))
          : null
      let philhealthRecord =
        philhealthRecords && philhealthRecords.length > 0
          ? philhealthRecords.find((record) => record.user === Number.parseInt(userId))
          : null
      let pagibigRecord =
        pagibigRecords && pagibigRecords.length > 0
          ? pagibigRecords.find((record) => record.user === Number.parseInt(userId))
          : null

      console.log("Benefit records:", { sssRecord, philhealthRecord, pagibigRecord })

      // If any of the required records are missing, we need to create them
      if (!sssRecord || !philhealthRecord || !pagibigRecord) {
        console.log("Creating missing benefit records")

        // Create SSS record if missing
        if (!sssRecord) {
          const sssData = {
            user: userId,
            basic_salary: Number.parseFloat(updatedFormData.basicRate).toFixed(2),
            msc: "5000.00",
            employee_share: Number.parseFloat(updatedFormData.sss.amount).toFixed(2),
            employer_share: "500.00",
            ec_contribution: "10.00",
            employer_mpf_contribution: "0.00",
            employee_mpf_contribution: "0.00",
            total_employer: "510.00",
            total_employee: Number.parseFloat(updatedFormData.sss.amount).toFixed(2),
            total_contribution: (Number.parseFloat(updatedFormData.sss.amount) + 510).toFixed(2),
          }

          const sssResponse = await fetch(`${API_BASE_URL}/benefits/sss/`, {
            method: "POST",
            headers,
            body: JSON.stringify(sssData),
          })

          if (sssResponse.ok) {
            sssRecord = await sssResponse.json()
            console.log("Created new SSS record:", sssRecord)
          } else {
            console.error("Failed to create SSS record:", await sssResponse.text())
            throw new Error("Failed to create SSS record")
          }
        }

        // Create PhilHealth record if missing
        if (!philhealthRecord) {
          const philhealthData = {
            user: userId,
            basic_salary: Number.parseFloat(updatedFormData.basicRate).toFixed(2),
            total_contribution: Number.parseFloat(updatedFormData.philhealth.amount).toFixed(2),
          }

          const philhealthResponse = await fetch(`${API_BASE_URL}/benefits/philhealth/`, {
            method: "POST",
            headers,
            body: JSON.stringify(philhealthData),
          })

          if (philhealthResponse.ok) {
            philhealthRecord = await philhealthResponse.json()
            console.log("Created new PhilHealth record:", philhealthRecord)
          } else {
            console.error("Failed to create PhilHealth record:", await philhealthResponse.text())
            throw new Error("Failed to create PhilHealth record")
          }
        }

        // Create Pag-IBIG record if missing
        if (!pagibigRecord) {
          const pagibigData = {
            user: userId,
            basic_salary: Number.parseFloat(updatedFormData.basicRate).toFixed(2),
            employee_share: Number.parseFloat(updatedFormData.pagibig.amount).toFixed(2),
            employer_share: "200.00",
            total_contribution: (Number.parseFloat(updatedFormData.pagibig.amount) + 200).toFixed(2),
          }

          const pagibigResponse = await fetch(`${API_BASE_URL}/benefits/pagibig/`, {
            method: "POST",
            headers,
            body: JSON.stringify(pagibigData),
          })

          if (pagibigResponse.ok) {
            pagibigRecord = await pagibigResponse.json()
            console.log("Created new Pag-IBIG record:", pagibigRecord)
          } else {
            console.error("Failed to create Pag-IBIG record:", await pagibigResponse.text())
            throw new Error("Failed to create Pag-IBIG record")
          }
        }
      }

      const salaryData = {
        user: userId,
        user_id: userId, // Explicitly set user_id to prevent null values
        earnings_id: earningsId,
        deductions_id: deductionsId,
        overtime_id: overtimeId,
        // Include the benefit IDs - these must not be null
        sss_id: sssRecord.id,
        philhealth_id: philhealthRecord.id,
        pagibig_id: pagibigRecord.id,
        rate_per_month: Number.parseFloat(updatedFormData.basicRate).toFixed(2),
        rate_per_hour: (Number.parseFloat(updatedFormData.basicRate) / 160).toFixed(2), // Assuming 160 hours per month
        pay_date: new Date().toISOString().split("T")[0],
      }

      console.log("Salary data to be sent:", salaryData)

      if (salaryId) {
        // Update existing record
        console.log(`Updating salary record with ID ${salaryId}`)
        const salaryResponse = await fetch(`${API_BASE_URL}/salary/${salaryId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(salaryData),
        })

        if (!salaryResponse.ok) {
          console.error("Failed to update salary record:", await salaryResponse.text())
          throw new Error("Failed to update salary record")
        }

        const salaryResult = await salaryResponse.json()
        console.log("Salary update result:", salaryResult)
        salaryRecordId = salaryResult.id
      } else {
        // Create new record
        console.log("Creating new salary record")
        const salaryResponse = await fetch(`${API_BASE_URL}/salary/`, {
          method: "POST",
          headers,
          body: JSON.stringify(salaryData),
        })

        if (!salaryResponse.ok) {
          console.error("Failed to create salary record:", await salaryResponse.text())
          throw new Error("Failed to create salary record")
        }

        const salaryResult = await salaryResponse.json()
        console.log("Salary creation result:", salaryResult)
        salaryRecordId = salaryResult.id
      }

      // Step 3: Fetch the complete salary object
      const completeSalaryResponse = await fetch(`${API_BASE_URL}/salary/${salaryRecordId}/`, {
        headers,
      })

      if (!completeSalaryResponse.ok) {
        throw new Error("Failed to fetch complete salary data")
      }

      const completeSalary = await completeSalaryResponse.json()

      // Step 4: Create or update payroll record
      // First, fetch the complete objects for benefits
      const [sssObj, philhealthObj, pagibigObj] = await Promise.all([
        fetch(`${API_BASE_URL}/benefits/sss/${sssRecord.id}/`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/benefits/philhealth/${philhealthRecord.id}/`, { headers }).then((res) => res.json()),
        fetch(`${API_BASE_URL}/benefits/pagibig/${pagibigRecord.id}/`, { headers }).then((res) => res.json()),
      ])

      // Create a complete salary object with nested objects
      const earningsObj = await fetch(`${API_BASE_URL}/earnings/${earningsId}/`, { headers }).then((res) => res.json())
      const deductionsObj = await fetch(`${API_BASE_URL}/deductions/${deductionsId}/`, { headers }).then((res) =>
        res.json(),
      )
      const overtimeObj = await fetch(`${API_BASE_URL}/totalovertime/${overtimeId}/`, { headers }).then((res) =>
        res.json(),
      )

      const salaryObj = {
        id: salaryRecordId,
        user: userId,
        earnings_id: earningsObj,
        deductions_id: deductionsObj,
        overtime_id: overtimeObj,
        sss_id: sssObj,
        philhealth_id: philhealthObj,
        pagibig_id: pagibigObj,
        rate_per_month: Number.parseFloat(updatedFormData.basicRate).toFixed(2),
        rate_per_hour: (Number.parseFloat(updatedFormData.basicRate) / 160).toFixed(2),
        pay_date: new Date().toISOString().split("T")[0],
      }

      // Find the section where we create the payrollData object (around line 1000)
      // Replace the payrollData object with this updated version:

      const payrollData = {
        user_id: userId,
        salary_id: payrollId ? completeSalary : salaryRecordId, // Send full object when updating, ID when creating
        gross_pay: totalGross.toFixed(2),
        total_deductions: totalDeductions.toFixed(2),
        net_pay: totalSalaryCompensation.toFixed(2),
        pay_date: new Date().toISOString().split("T")[0],
        status: "Processing",
      }

      console.log("SSS ID", sssRecord.id)
      console.log("Philhealth ID", philhealthRecord.id)
      console.log("Pag-ibig ID", pagibigRecord.id)
      console.log("User ID", userId)

      // Also update the section where we update an existing payroll record (around line 1010)
      // Replace it with this:

      if (payrollId) {
        // Update existing record
        console.log(`Updating payroll record with ID ${payrollId}`)

        // For updates, we need to send the complete salary object
        const updatePayrollData = {
          ...payrollData,
          salary_id: completeSalary, // Use the complete salary object for updates
        }

        const payrollResponse = await fetch(`${API_BASE_URL}/payroll/${payrollId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(updatePayrollData),
        })

        if (!payrollResponse.ok) {
          const errorText = await payrollResponse.text()
          console.error("Failed to update payroll record:", errorText)
          throw new Error(`Failed to update payroll record: ${errorText}`)
        }

        console.log("Successfully updated payroll record")
      } else {
        // Check if a payroll record already exists for this user
        // ... (keep the existing code here)
      }

      // Also, update the code that checks for existing payroll records to prevent duplicates
      // Find the section where we check for existing payroll records (around line 1030)
      // Replace it with this:

      // Check if a payroll record already exists for this user
      const existingPayrollResponse = await fetch(`${API_BASE_URL}/payroll/?user_id=${userId}`, {
        headers,
      })

      if (existingPayrollResponse.ok) {
        const existingPayrolls = await existingPayrollResponse.json()

        // Find a record with matching user_id
        const userPayroll = existingPayrolls.find((p) => p.user_id === userId)

        if (userPayroll) {
          // Update existing payroll record
          console.log("Updating existing payroll record:", userPayroll.id)
          setPayrollId(userPayroll.id)

          // For updates, we need to send the complete salary object
          const updatePayrollData = {
            ...payrollData,
            salary_id: completeSalary, // Use the complete salary object for updates
          }

          const updateResponse = await fetch(`${API_BASE_URL}/payroll/${userPayroll.id}/`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(updatePayrollData),
          })

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text()
            console.error("Failed to update payroll record:", errorText)
            throw new Error(`Failed to update payroll record: ${errorText}`)
          }

          console.log("Successfully updated payroll record")
        } else {
          // Create new payroll record
          console.log("Creating new payroll record")
          const payrollResponse = await fetch(`${API_BASE_URL}/payroll/`, {
            method: "POST",
            headers,
            body: JSON.stringify(payrollData), // For creation, we can use just the ID
          })

          if (!payrollResponse.ok) {
            const errorText = await payrollResponse.text()
            console.error("Failed to create payroll record:", errorText)
            throw new Error(`Failed to create payroll record: ${errorText}`)
          }

          const newPayroll = await payrollResponse.json()
          setPayrollId(newPayroll.id)
          console.log("Created new payroll record:", newPayroll.id)
        }
      }

      // Set hasPayrollData to true since we've now saved data
      setHasPayrollData(true)

      // Call the onUpdate callback with the updated data
      onUpdate({
        ...updatedFormData,
        id: employeeData.id,
        baseSalary: totalGross,
        totalDeductions: totalDeductions,
        totalSalaryCompensation: totalSalaryCompensation,
      })
    } catch (error) {
      console.error("Error updating payroll data:", error)
      setError(`Failed to update payroll data: ${error.message}`)
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
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.basicRate}
                        onChange={(e) => handleInputChange(e, "basicRate")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Basic (Bi-weekly)</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.basic}
                        onChange={(e) => handleInputChange(e, "basic")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Allowance</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.allowance}
                        onChange={(e) => handleInputChange(e, "allowance")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Non-Taxable</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.ntax}
                        onChange={(e) => handleInputChange(e, "ntax")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Vacation Leave</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.vacationleave}
                        onChange={(e) => handleInputChange(e, "vacationleave")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1 uppercase">Sick Leave</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.sickleave}
                        onChange={(e) => handleInputChange(e, "sickleave")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
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
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.regularOT.rate}
                        onChange={(e) => handleInputChange(e, "regularOT", "rate")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Regular Holiday</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.regularHoliday.rate}
                      onChange={(e) => handleInputChange(e, "regularHoliday", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Special Holiday</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.specialHoliday.rate}
                      onChange={(e) => handleInputChange(e, "specialHoliday", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
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
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.restDay.rate}
                        onChange={(e) => handleInputChange(e, "restDay", "rate")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
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
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                      <input
                        type="text"
                        value={formData.nightDiff.rate}
                        onChange={(e) => handleInputChange(e, "nightDiff", "rate")}
                        className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Backwage</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.backwage.rate}
                      onChange={(e) => handleInputChange(e, "backwage", "rate")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Deductions */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">SSS</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.sss.amount}
                      onChange={(e) => handleInputChange(e, "sss", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">PhilHealth</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.philhealth.amount}
                      onChange={(e) => handleInputChange(e, "philhealth", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Pag IBIG</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.pagibig.amount}
                      onChange={(e) => handleInputChange(e, "pagibig", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Late</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.late.amount}
                      onChange={(e) => handleInputChange(e, "late", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">WTAX</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.wtax.amount}
                      onChange={(e) => handleInputChange(e, "wtax", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Additional Deductions */}
            <div>
              <h3 className="font-medium text-base mb-2 uppercase">Additional Deductions</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">No Work Day</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.nowork.amount}
                      onChange={(e) => handleInputChange(e, "nowork", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Loan</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.loan.amount}
                      onChange={(e) => handleInputChange(e, "loan", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Charges</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.charges.amount}
                      onChange={(e) => handleInputChange(e, "charges", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">Undertime</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.undertime.amount}
                      onChange={(e) => handleInputChange(e, "undertime", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 uppercase">MSFC Loan</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                    <input
                      type="text"
                      value={formData.msfcloan.amount}
                      onChange={(e) => handleInputChange(e, "msfcloan", "amount")}
                      className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                    />
                  </div>
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
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.totalGross)}
                    readOnly
                    className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Deductions</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.totalDeductions)}
                    readOnly
                    className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1 uppercase">Total Salary</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                  <input
                    type="text"
                    value={formatCurrency(formData.totalSalaryCompensation)}
                    readOnly
                    className="w-full px-8 py-1.5 text-sm border rounded bg-gray-100"
                  />
                </div>
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