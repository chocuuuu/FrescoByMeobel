import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  UserCircle,
  ChevronDown,
  ArrowLeft,
  CalendarDays,
  EyeOff,
  SquareCheck
} from 'lucide-react'
import NavBar from '../components/Nav_Bar'
import companyLogo from '../assets/newlogo.png'
import dayjs from 'dayjs'

function AdminPayslipPage() {
  const navigate = useNavigate()
  const { userId } = useParams()

  // --------- States for Blur/Password & Payslip Generation ---------
  const [isBlurred, setIsBlurred] = useState(true)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isPayslipGenerated, setIsPayslipGenerated] = useState(false)

  // --------- States for Data Fetching ---------
  const [adminData, setAdminData] = useState(null)
  const [adminLoading, setAdminLoading] = useState(true)
  const [adminError, setAdminError] = useState('')

  const [employeeData, setEmployeeData] = useState(null)
  const [employeeLoading, setEmployeeLoading] = useState(true)
  const [employeeError, setEmployeeError] = useState('')

  const [allUserPayslips, setAllUserPayslips] = useState([])
  const [payslipLoading, setPayslipLoading] = useState(true)
  const [payslipError, setPayslipError] = useState('')

  // --------- Currently Selected Payslip & Payroll Period ---------
  const [displayedPayslip, setDisplayedPayslip] = useState(null)
  // Use payrollPeriods state to store the unique period objects
  const [payrollPeriods, setPayrollPeriods] = useState([])
  const [selectedPayrollPeriodId, setSelectedPayrollPeriodId] = useState('')

  // ========================================================================
  // Disable right-click and common devtools keyboard shortcuts
  // ========================================================================
    useEffect(() => {
      const handleContextMenu = (e) => e.preventDefault();
  
      const handleKeyDown = (e) => {
        // Block F12, or ctrl+shift+I, ctrl+shift+C, ctrl+shift+J
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I', 'C', 'J'].includes(e.key))
        ) {
          e.preventDefault();
        }
      };
  
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
  
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

  // ========================================================================
  // 1) FETCH ADMIN INFO
  // ========================================================================
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const adminId = localStorage.getItem('user_id')
        if (!token || !adminId) throw new Error('Missing token/admin ID')
        const res = await fetch(`http://localhost:8000/api/v1/employment-info/employee-number/${adminId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) throw new Error(`Failed to fetch admin info: ${res.statusText}`)
        const data = await res.json()
        setAdminData(data)
      } catch (err) {
        setAdminError(err.message)
      } finally {
        setAdminLoading(false)
      }
    }
    fetchAdmin()
  }, [])

  // ========================================================================
  // 2) FETCH EMPLOYEE INFO
  // ========================================================================
  useEffect(() => {
    if (!userId) {
      setEmployeeError('No user ID param')
      setEmployeeLoading(false)
      return
    }
    const fetchEmployee = async () => {
      try {
        setEmployeeLoading(true)
        const token = localStorage.getItem('access_token')
        if (!token) throw new Error('No token')
        const res = await fetch(`http://localhost:8000/api/v1/employment-info/employee-number/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) throw new Error(`Employee fetch failed: ${res.statusText}`)
        const data = await res.json()
        setEmployeeData(data)
      } catch (err) {
        setEmployeeError(err.message)
      } finally {
        setEmployeeLoading(false)
      }
    }
    fetchEmployee()
  }, [userId])

  // ========================================================================
  // 3) FETCH ALL PAYSLIPS FOR THIS USER
  // ========================================================================
  useEffect(() => {
    if (!userId) {
      setPayslipError('No user ID param')
      setPayslipLoading(false)
      return
    }
    const fetchUserPayslips = async () => {
      try {
        setPayslipLoading(true)
        const token = localStorage.getItem('access_token')
        if (!token) throw new Error('No token')
        const res = await fetch(`http://localhost:8000/api/v1/payslip/user-all/${userId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) throw new Error(`Payslip fetch failed: ${res.statusText}`)
        const data = await res.json() // array of payslip objects
        setAllUserPayslips(data)
      } catch (err) {
        setPayslipError(err.message)
      } finally {
        setPayslipLoading(false)
      }
    }
    fetchUserPayslips()
  }, [userId])

  // ========================================================================
  // 4) Build Unique List of Payroll Periods from Payslips
  // ========================================================================
  useEffect(() => {
    if (!allUserPayslips || allUserPayslips.length === 0) {
      setPayrollPeriods([])
      return
    }
    const periodMap = new Map()
    allUserPayslips.forEach((p) => {
      const start = p?.payroll_id?.schedule_id?.payroll_period_start
      const end = p?.payroll_id?.schedule_id?.payroll_period_end
      if (start && end) {
        const key = `${start}|${end}`
        if (!periodMap.has(key)) {
          periodMap.set(key, {
            id: key,
            payroll_period_start: start,
            payroll_period_end: end
          })
        }
      }
    })
    setPayrollPeriods(Array.from(periodMap.values()))
  }, [allUserPayslips])

  // ---------- Helper to parse numeric values ----------
  const parseValue = (val) => {
    const num = parseFloat(val)
    return isNaN(num) ? 0 : num
  }

  // ---------- Handle Payroll Period Selection using the new dropdown code ----------
  const handlePayrollPeriodChange = (e) => {
    const value = e.target.value
    setSelectedPayrollPeriodId(value)
    if (!value) {
      setDisplayedPayslip(null)
      setIsBlurred(true)
      return
    }
    // our payrollPeriods were created with id as "start|end"
    const [start, end] = value.split('|')
    const matched = allUserPayslips.find((p) => {
      const ps = p?.payroll_id?.schedule_id?.payroll_period_start
      const pe = p?.payroll_id?.schedule_id?.payroll_period_end
      return ps === start && pe === end
    })
    if (matched) {
      setDisplayedPayslip(matched)
      setIsBlurred(true)
    } else {
      setDisplayedPayslip(null)
    }
  }

  // ---------- Handle Generate Slip ----------
  const handleGenerate = () => {
    if (!displayedPayslip) return
    setShowPasswordDialog(true)
  }
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      const adminId = localStorage.getItem('user_id')
      if (!adminId) throw new Error('No admin ID found.')
      const loginPayload = { id: adminId, password }
      const res = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload)
      })
      if (!res.ok) throw new Error('Invalid credentials or server error.')

      // Unblur the payslip and mark as generated
      setIsBlurred(false)
      setShowPasswordDialog(false)
      setPassword('')
      setLoginError('')
      setIsPayslipGenerated(true)

      // Update generated_at both locally and in backend
      const currentDateTime = new Date().toISOString()
      setDisplayedPayslip(prev => ({
        ...prev,
        generated_at: currentDateTime
      }))
      await fetch(`http://localhost:8000/api/v1/payslip/${displayedPayslip.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ generated_at: currentDateTime })
      })
    } catch (err) {
      setLoginError(err.message)
    }
  }

  // ---------- Handle Approve Payslip ----------
  const handleApprove = async () => {
    if (!displayedPayslip) {
      alert('Please select a payroll period first and generate the payslip.')
      return
    }
    if (!isPayslipGenerated) {
      alert('Please generate the payslip first (enter your password) before approving.')
      return
    }
    if (window.confirm('Are you sure you want to approve this payslip?')) {
      const currentDateTime = new Date().toISOString()
      setDisplayedPayslip(prev => ({
        ...prev,
        approved_at: currentDateTime
      }))
      try {
        await fetch(`http://localhost:8000/api/v1/payslip/${displayedPayslip.id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({ approved_at: currentDateTime })
        })
        alert(`Payslip approved successfully on ${currentDateTime}`)
      } catch (error) {
        alert('Error updating approved_at on backend: ' + error.message)
      }
    }
  }

  // ---------- Loading & Error States ----------
  if (adminLoading || payslipLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading data...</p>
      </div>
    )
  }
  if (adminError || payslipError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        <p>
          {adminError && <>Admin Error: {adminError}<br /></>}
          {payslipError && <>Payslip Error: {payslipError}<br /></>}
        </p>
      </div>
    )
  }

  // ---------- Extract Fields from Displayed Payslip ----------
  let payPeriodStart = '-'
  let payPeriodEnd = '-'
  let payDate = '-'
  let netPay = '-'
  let approvedAt = '-'
  let generatedAt = '-'
  let empFirstName = '-'
  let empLastName = '-'
  let empNumber = '-'
  let position = '-'
  // Extended fields for Income, Deductions, and Overtime
  let monthly = '-'
  let basicRate = '-'
  let allowance = '-'
  let otherNTax = '-'
  let backpayRetro = '-'
  let totalEarnings = '-'
  let wTax = '-'
  let sss = '-'
  let philhealth = '-'
  let pagibig = '-'
  let noWork = '-'
  let undertime = '-'
  let tardiness = '-'
  let msfcLoan = '-'
  let meobelLoan = '-'
  let meobelCharges = '-'
  let totalDeductions = '-'
  let nightDiff = '-'
  let totalOT = '-'

  if (displayedPayslip) {
    payPeriodStart = displayedPayslip?.payroll_id?.schedule_id?.payroll_period_start || '-'
    payPeriodEnd = displayedPayslip?.payroll_id?.schedule_id?.payroll_period_end || '-'
    payDate = displayedPayslip?.payroll_id?.pay_date || '-'
    netPay = displayedPayslip?.payroll_id?.net_pay || '-'
    approvedAt = displayedPayslip?.approved_at || '-'
    generatedAt = displayedPayslip?.generated_at || '-'

    empFirstName = displayedPayslip?.payroll_id?.employment_info_id?.first_name || '-'
    empLastName = displayedPayslip?.payroll_id?.employment_info_id?.last_name || '-'
    empNumber = displayedPayslip?.payroll_id?.employment_info_id?.employee_number || '-'
    position = displayedPayslip?.payroll_id?.employment_info_id?.position || '-'

    monthly = displayedPayslip?.payroll_id?.salary_id?.earnings_id?.basic_rate || '-'
    basicRate = displayedPayslip?.payroll_id?.salary_id?.earnings_id?.basic || '-'
    allowance = displayedPayslip?.payroll_id?.salary_id?.earnings_id?.allowance || '-'
    otherNTax = displayedPayslip?.payroll_id?.salary_id?.earnings_id?.ntax || '-'
    backpayRetro = displayedPayslip?.payroll_id?.salary_id?.overtime_id?.total_backwage || '-'
    totalEarnings = displayedPayslip?.total_earnings || '-'

    wTax = displayedPayslip?.payroll_id?.salary_id?.deductions_id?.wtax || '-'
    sss = displayedPayslip?.payroll_id?.salary_id?.sss_id?.total_employee || '-'
    philhealth = displayedPayslip?.payroll_id?.salary_id?.philhealth_id?.total_contribution || '-'
    pagibig = displayedPayslip?.payroll_id?.salary_id?.pagibig_id?.total_contribution || '-'
    noWork = displayedPayslip?.payroll_id?.salary_id?.deductions_id?.nowork || '-'
    undertime = displayedPayslip?.payroll_id?.salary_id?.overtime_id?.total_undertime || '-'
    tardiness = displayedPayslip?.payroll_id?.salary_id?.overtime_id?.total_late || '-'
    msfcLoan = displayedPayslip?.payroll_id?.salary_id?.deductions_id?.msfcloan || '-'
    meobelLoan = displayedPayslip?.payroll_id?.salary_id?.deductions_id?.loan || '-'
    meobelCharges = displayedPayslip?.payroll_id?.salary_id?.deductions_id?.charges || '-'
    totalDeductions = displayedPayslip?.payroll_id?.total_deductions || '-'

    nightDiff = displayedPayslip?.payroll_id?.salary_id?.overtime_id?.total_nightdiff || '-'
    totalOT = displayedPayslip?.payroll_id?.salary_id?.overtime_id?.total_overtime || '-'
  }

  // Compute Total Earnings based on the formula
  const computedTotalEarningsVal =
    parseValue(basicRate) + parseValue(allowance) + parseValue(backpayRetro) + parseValue(totalOT)

  // Fallback: Use employeeData if no payslip is selected
  const displayName = displayedPayslip
    ? `${empFirstName} ${empLastName}`
    : employeeData
    ? `${employeeData.first_name} ${employeeData.last_name}`
    : 'Employee'
  const displayNumber = displayedPayslip
    ? empNumber
    : employeeData
    ? employeeData.employee_number
    : '-----'
  const displayPosition = displayedPayslip
    ? position
    : employeeData
    ? employeeData.position
    : '------'

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="container mx-auto p-6">
        {/* Parent Green Container – relative so that the back button is pinned */}
        <div className="w-full max-w-5xl bg-[#42573C] p-6 rounded-lg flex flex-col md:flex-row items-stretch mx-auto relative min-h-[600px]">
          {/* LEFT: Payslip Panel */}
          <div className={`w-full md:w-2/3 md:pr-6 mb-6 md:mb-0 relative ${displayedPayslip && isBlurred ? 'blur-sm pointer-events-none select-none' : ''}`}>
            <div className="bg-white rounded-md p-6 h-full relative">
              {displayedPayslip && isBlurred && (
                <div className="absolute inset-0 bg-gray-900 opacity-30 rounded-md"></div>
              )}
              {!displayedPayslip ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#3A4D2B] text-md sm:text-lg font-medium text-center px-6">
                    Please select a payroll period first then click View Payslip.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <img src={companyLogo} alt="Company Logo" className="w-40 object-contain" />
                    <h2 className="font-bold text-lg flex-1 text-center">PAYSLIP</h2>
                    <span className="text-sm font-semibold text-gray-500">CONFIDENTIAL</span>
                  </div>
                  {/* Employee + Payslip Info */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <p><strong>Employee Name:</strong> {`${empFirstName} ${empLastName}`}</p>
                      <p><strong>Employee No.:</strong> {empNumber}</p>
                      <p><strong>Position:</strong> {position}</p>
                    </div>
                    <div>
                      <p><strong>Payroll Cut-Off:</strong> {payPeriodStart} - {payPeriodEnd}</p>
                      <p><strong>Pay Date:</strong> {payDate}</p>
                      <p><strong>Work Hour:</strong> {displayedPayslip?.payroll_id?.schedule_id?.hours || '-'}</p>
                    </div>
                  </div>
                  <hr className="mb-4" />
                  {/* Income Details */}
                  <div className="text-sm mb-4">
                    <h3 className="font-bold text-blue-700 uppercase mb-1 text-center">INCOME DETAILS</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td>Monthly:</td>
                          <td className="text-right">{monthly}</td>
                        </tr>
                        <tr>
                          <td>Basic Rate:</td>
                          <td className="text-right">{basicRate}</td>
                        </tr>
                        <tr>
                          <td>Allowance:</td>
                          <td className="text-right">{allowance}</td>
                        </tr>
                        <tr>
                          <td>Other Earning N-Tax:</td>
                          <td className="text-right">{otherNTax}</td>
                        </tr>
                        <tr>
                          <td>Backwage / Retro:</td>
                          <td className="text-right">{backpayRetro}</td>
                        </tr>
                        <tr>
                          <td>SIL Conversion:</td>
                          <td className="text-right">-</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="font-semibold mt-2 text-right">Total Earnings: {computedTotalEarningsVal}</div>
                  </div>
                  <hr className="mb-4" />
                  {/* Deductions */}
                  <div className="text-sm mb-4">
                    <h3 className="font-bold text-blue-700 uppercase mb-1 text-center">DEDUCTION DETAILS</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td>Withholding Tax:</td>
                          <td className="text-right">{wTax}</td>
                        </tr>
                        <tr>
                          <td>SSS:</td>
                          <td className="text-right">{sss}</td>
                        </tr>
                        <tr>
                          <td>Philhealth:</td>
                          <td className="text-right">{philhealth}</td>
                        </tr>
                        <tr>
                          <td>Pag-ibig:</td>
                          <td className="text-right">{pagibig}</td>
                        </tr>
                        <tr>
                          <td>No Work:</td>
                          <td className="text-right">{noWork}</td>
                        </tr>
                        <tr>
                          <td>Undertime:</td>
                          <td className="text-right">{undertime}</td>
                        </tr>
                        <tr>
                          <td>Tardiness:</td>
                          <td className="text-right">{tardiness}</td>
                        </tr>
                        <tr>
                          <td>MSFC Loan:</td>
                          <td className="text-right">{msfcLoan}</td>
                        </tr>
                        <tr>
                          <td>Meobel Loan:</td>
                          <td className="text-right">{meobelLoan}</td>
                        </tr>
                        <tr>
                          <td>Meobel Charges:</td>
                          <td className="text-right">{meobelCharges}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="font-semibold mt-2 text-right">Total Deductions: {totalDeductions}</div>
                  </div>
                  <hr className="mb-4" />
                  {/* Net Pay */}
                  <div className="font-bold text-right text-lg mb-4">
                    NET PAY: <span className="text-red-600">{netPay}</span>
                  </div>
                  <hr className="mb-4" />
                  {/* Overtime Breakdown */}
                  <div className="text-sm mb-6">
                    <h3 className="font-bold text-blue-700 uppercase mb-1 text-center">Overtime Breakdown</h3>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td>Night Differential:</td>
                          <td className="text-right">{nightDiff}</td>
                        </tr>
                        <tr>
                          <td>Total Overtime:</td>
                          <td className="text-right">{totalOT}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Approved/Generated Timestamps */}
                  <div className="text-sm mb-4">
                    <p>
                      Approved At: {approvedAt ? dayjs(approvedAt).format("YYYY-MM-DD HH:mm") : ""}
                    </p>
                    <p>
                      Generated At: {generatedAt ? dayjs(generatedAt).format("YYYY-MM-DD HH:mm") : ""}
                    </p>
                  </div>
                  {/* Verified by HR Manager */}
                  <div className="font-bold text-sm mt-16">
                    <p>Verified by: HR Manager</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* RIGHT: Info & Period Dropdown Panel */}
          <div className={`w-full md:w-1/3 rounded-md p-6 flex flex-col ${displayedPayslip ? "h-full" : "h-auto"}`}>
            {/* Employee Info Block */}
            <div className="flex items-center bg-[#5C7346] p-4 rounded-lg mb-10">
              <div className="h-24 w-24 bg-white rounded-full overflow-hidden flex-shrink-0">
                {employeeData?.profile_picture ? (
                  <img
                    src={employeeData.profile_picture}
                    alt="EmployeeProfile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-10 w-10 m-auto" style={{ color: "#42573C" }} />
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-white">
                  {employeeData?.first_name && employeeData?.last_name ? `${employeeData.first_name} ${employeeData.last_name}` : "Employee"}
                </h3>
                <p className="text-md text-white">{employeeData?.employee_number || userId || ""}</p>
                <p className="text-md text-white">{employeeData?.position || ""}</p>
              </div>
            </div>
            {/* Payroll Period Dropdown – Using the provided design */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-white mr-2" />
                  <span className="text-white font-bold">Payroll Period</span>
                </div>
              </div>
              <div className="w-full bg-[#A3BC84] rounded-md p-3">
                <select
                  value={selectedPayrollPeriodId || ""}
                  onChange={handlePayrollPeriodChange}
                  className="w-full px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2 rounded border border-gray-300 bg-white text-[#3A4D2B] font-medium text-sm sm:text-base md:text-lg"
                >
                  <option value="">Select a payroll period</option>
                  {[...payrollPeriods]
                    .sort((a, b) =>
                      new Date(b.payroll_period_start) - new Date(a.payroll_period_start)
                    )
                    .map((period) => (
                      <option className="font-medium" key={period.id} value={period.id}>
                        {dayjs(period.payroll_period_start).format("MMMM DD")} -{" "}
                        {dayjs(period.payroll_period_end).format("MMMM DD")}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            {/* Generate Slip Box */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-lg font-bold text-white mb-2">
                <EyeOff className="h-5 w-5" />
                <span>Generate Slip</span>
              </div>
              <div className="bg-[#A3BC84] rounded-md p-5 shadow-sm mb-6">
                <p className="text-sm text-white mb-3">
                  Last Generated: {generatedAt ? dayjs(generatedAt).format("YYYY-MM-DD HH:mm") : "Not yet generated"}
                </p>
                <button
                  className="w-full rounded-md py-3 font-semibold text-white text-md"
                  style={{ backgroundColor: "#373A45" }}
                  onClick={handleGenerate}
                  disabled={!displayedPayslip}
                >
                  {displayedPayslip ? "Generate Slip" : "No Payroll Period Selected"}
                </button>
              </div>
            </div>
            {/* Approve Slip Box */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-lg font-bold mb-2 text-white">
                <SquareCheck className="w-5 h-5" />
                <span>Approve Slip</span>
              </div>
              <div className="bg-[#A3BC84] rounded-md p-5 shadow-sm mb-12">
                <p className="text-sm mb-2 text-white">
                  Approved: {approvedAt ? dayjs(approvedAt).format("YYYY-MM-DD HH:mm") : ""}
                </p>
                <button
                  className="w-full rounded-md py-3 font-semibold text-white text-md mt-2"
                  style={{ backgroundColor: "#373A45" }}
                  onClick={handleApprove}
                >
                  Approve
                </button>
              </div>
            </div>
            {/* Mobile: Back Button in Normal Flow */}
            <div className="block md:hidden mt-auto">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-md flex items-center gap-2 font-semibold text-white text-md"
                style={{ backgroundColor: "#373A45" }}
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          </div>
          {/* DESKTOP: Back Button pinned at BOTTOM-RIGHT */}
          <div className="hidden md:block absolute bottom-4 right-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-md flex items-center gap-2 font-semibold text-white text-md"
              style={{ backgroundColor: '#373A45' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        </div>
      </div>
      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Enter Password to Generate Slip</h2>
            {loginError && (
              <p className="text-red-600 text-sm mb-2">{loginError}</p>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <button
                type="submit"
                className="w-full text-white py-2 rounded"
                style={{ backgroundColor: "#42573C" }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPayslipPage
