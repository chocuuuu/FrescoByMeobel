import NavBar from '../components/Nav_Bar'
import { UserCircle, ChevronDown, ArrowLeft } from 'lucide-react'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PayslipPage() {
  const navigate = useNavigate()
  const [isBlurred, setIsBlurred] = useState(true)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')

  useEffect(() => {
    // Disable right-click
    const disableRightClick = (event) => event.preventDefault();
    document.addEventListener('contextmenu', disableRightClick);

    // Disable DevTools key combinations
    const handleKeyDown = (event) => {
      if (
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'C' || event.key === 'J')) ||
        event.key === 'F12'
      ) {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const payrollPeriods = [
    'Oct 26 - Nov 10',
    'Sept 9 - Sept 24',
    'Sept 25 - Oct 11',
    'View Previous Payroll Periods'
  ]

  const handleGenerate = () => {
    setShowPasswordDialog(true)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    setIsBlurred(false)
    setShowPasswordDialog(false)
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div className="container mx-auto p-6 flex justify-center">
        {/* Outer Container (Green) */}
        <div
          className="w-full max-w-5xl rounded-lg p-6 flex flex-col md:flex-row items-stretch"
          style={{ backgroundColor: '#42573C' }}
        >
          {/* LEFT: Payslip */}
          <div className="w-full md:w-2/3 md:pr-6 mb-6 md:mb-0">
          <div className={`bg-white rounded-md p-6 h-full ${isBlurred ? 'blur-sm pointer-events-none select-none' : ''}`}>
            {isBlurred && (
              <div className="absolute top-0 left-0 w-full h-full bg-gray-900 opacity-30 rounded-md"></div>
            )}

              <div className="space-y-6">
                {/* Employee Info */}
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">EMP NO. - EMP. NAME</p>
                      <p className="text-sm">POSITION</p>
                    </div>
                  </div>
                </div>

                {/* Payroll Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold">Payroll Period</p>
                    <p>Oct 26 - November 10, 2024</p>
                    <p className="text-sm">Pay Date</p>
                    <p>Friday, November 15, 2024</p>
                    <p className="text-sm">No. of Working Hrs.</p>
                    <p>112</p>
                  </div>
                </div>

                {/* Earnings Section */}
                <div>
                  <h3 className="font-bold border-b">EARNINGS</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm">BASIC RATE</p>
                      <p className="text-sm">BASIC</p>
                      <p className="text-sm">ALLOWANCE</p>
                      <p className="text-sm">OTH. EARNINGS N-TAX</p>
                      <p className="text-sm">13/14/OTHERS</p>
                    </div>
                    <div className="text-right">
                      <p>Monthly</p>
                      <p>₱13,000.00</p>
                      <p>₱9,500.00</p>
                      <p>₱750.00</p>
                      <p>-</p>
                    </div>
                  </div>
                </div>

                {/* Overtime Section */}
                <div>
                  <h3 className="font-bold border-b">OVERTIME BREAKDOWN</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm">OVERTIME</p>
                      <p className="text-sm">REG OT</p>
                      <p className="text-sm">REG. HOL</p>
                      <p className="text-sm">SPL HOL</p>
                      <p className="text-sm">REST DAY</p>
                      <p className="text-sm">NIGHT DIFF</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm">NO. HOURS</p>
                      <p>1</p>
                      <p>1</p>
                      <p>1</p>
                      <p>1</p>
                      <p>1</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">AMOUNT</p>
                      <p>114.18</p>
                      <p>1461.54</p>
                      <p>118.75</p>
                      <p>118.75</p>
                      <p>9.11</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">TOTAL</p>
                      <p>114.18</p>
                      <p>1461.54</p>
                      <p>118.75</p>
                      <p>118.75</p>
                      <p>9.11</p>
                    </div>
                  </div>
                  <p className="text-right font-bold">1822.33</p>
                </div>

                {/* Deductions Section */}
                <div>
                  <h3 className="font-bold border-b">DEDUCTIONS</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">SSS</p>
                      <p className="text-sm">PHILHEALTH</p>
                      <p className="text-sm">PAG-IBIG</p>
                      <p className="text-sm">W/TAX (S)</p>
                    </div>
                    <div className="text-right">
                      <p>427.50</p>
                      <p>227.50</p>
                      <p>200.00</p>
                      <p>-</p>
                    </div>
                  </div>
                </div>

                {/* Net Pay Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <p className="font-bold">NETPAY</p>
                    <p className="font-bold text-red-600">₱ 8,144.83</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: #576D2C, bigger accent boxes */}
          <div
            className="w-full md:w-1/3 rounded-md p-6 flex flex-col justify-between"
            style={{ backgroundColor: '#576D2C' }}
          >
            {/* Profile Section */}
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-white rounded-full mx-auto mb-2 flex items-center justify-center">
                <UserCircle className="h-10 w-10" style={{ color: '#42573C' }} />
              </div>
              <h3 className="text-lg font-bold text-white">Racell Gabriel Sincioco</h3>
              <p className="text-sm text-white">2022174599</p>
            </div>

            {/* Payroll Period */}
            <p className="text-sm font-bold mb-2 text-white">Payroll Period</p>
            <div
              className="rounded-md p-5 mb-6 shadow-sm w-full"
              style={{ backgroundColor: '#A3BC84' }}
            >
              <div className="relative">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full rounded-md py-2 px-3 appearance-none focus:outline-none"
                  style={{ backgroundColor: '#FFFFFF', color: '#373A45' }}
                >
                  <option value="">Select Payroll Period</option>
                  {payrollPeriods.map((period, idx) => (
                    <option key={idx} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none"
                  style={{ color: '#373A45' }}
                />
              </div>
            </div>

            {/* Pay Slip */}
            <p className="text-sm font-bold mb-2 text-white">Pay Slip</p>
            <div
              className="rounded-md p-6 mb-6 shadow-sm w-full"
              style={{ backgroundColor: '#A3BC84' }}
            >
              <p className="text-xs text-white">Approved: -</p>
              <button
                className="mt-3 w-full rounded-md py-2 font-medium text-white"
                style={{ backgroundColor: '#373A45' }}
              >
                Approve
              </button>
            </div>

            {/* Generate Slip */}
            <p className="text-sm font-bold mb-2 text-white">Generate Slip</p>
            <div
              className="rounded-md p-6 shadow-sm w-full"
              style={{ backgroundColor: '#A3BC84' }}
            >
              <p className="text-xs text-white">Approved: -</p>
              <p className="text-xs text-white">Last Generated: -</p>
              <button
                className="mt-3 w-full rounded-md py-2 font-medium text-white"
                style={{ backgroundColor: '#373A45' }}
                onClick={handleGenerate}
              >
                Generate
              </button>
            </div>

            {/* Back Button at bottom */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2 rounded-md text-white flex items-center gap-2 font-medium"
                style={{ backgroundColor: '#373A45' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Enter Password to Generate Payslip</h2>
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
                style={{ backgroundColor: '#42573C' }}
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

export default PayslipPage
