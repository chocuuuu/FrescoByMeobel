"use client"
import NavBar from "../components/Nav_Bar"
import { useNavigate } from "react-router-dom"

function AdminDashboardPage() {
  const navigate = useNavigate()
  const transaction_history = [
    {
      id: 1,
      name: "Nicolai Alcaraz",
      role: "Chef",
      date: "Oct 1, 2024",
      time: "08:00 AM",
      amount: "₱72,000",
      rate: "₱300/DAY",
      status: "Paid",
    },
    {
      id: 2,
      name: "Racell Sincioco",
      role: "Waiter",
      date: "Oct 1, 2024",
      time: "08:00 AM",
      amount: "₱72,000",
      rate: "₱300/DAY",
      status: "Paid",
    },
    {
      id: 3,
      name: "Cyrus Canape",
      role: "Chef",
      date: "Oct 1, 2024",
      time: "08:00 AM",
      amount: "₱72,000",
      rate: "₱300/DAY",
      status: "Paid",
    },
    {
      id: 4,
      name: "Eli Dizon",
      role: "HR",
      date: "Oct 1, 2024",
      time: "08:00 AM",
      amount: "₱72,000",
      rate: "₱300/DAY",
      status: "Paid",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-16">
        {/* Welcome Section */}
        <div className="mb-12">
          <p className="text-5xl">Welcome,</p>
          <h1 className="text-8xl font-bold">Nicolai</h1>
        </div>

        {/* Dashboard Grid */}
        <div className="justify-center grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-[#5C7346] rounded-lg p-6 text-white">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Transaction History</h2>
                <button className="text-sm">See All</button>
              </div>
              <div className="space-y-4">
                {transaction_history.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between space-x-4">
                    {/* Name and Role */}
                    <div className="flex items-center space-x-4 flex-1 min-w-0 max-w-[25%]">
                      <div className="bg-white rounded-full h-10 w-10"></div>
                      <div className="truncate">
                        <p className="font-medium">{transaction.name}</p>
                        <p className="text-sm opacity-80">{transaction.role}</p>
                      </div>
                    </div>

                    {/* Date and Time */}
                    <div className="text-right w-24 flex-shrink-0">
                      <p>{transaction.date}</p>
                      <p className="text-sm opacity-80">{transaction.time}</p>
                    </div>

                    {/* Amount and Rate */}
                    <div className="text-right w-18 flex-shrink-0">
                      <p>{transaction.amount}</p>
                      <p className="text-sm opacity-80">{transaction.rate}</p>
                    </div>

                    {/* Status Button */}
                    <button className="bg-white text-black rounded-full px-4 py-1 text-sm flex-shrink-0">
                      {transaction.status}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payroll Cards */}
          <div className="space-y-7">
            {/* Previous Payroll */}
            <div className="bg-[#A7BC8F] rounded-lg p-6 text-white">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-medium">Previous Payroll</h3>
                <p className="text-sm">September 1, 2024</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-4xl font-bold">₱120,000</p>
                <span className="inline-block bg-[#5C7346] text-white rounded-full px-4 py-1 text-sm">Paid</span>
              </div>
            </div>

            {/* Upcoming Payroll */}
            <div className="bg-[#A7BC8F] rounded-lg p-6 text-white">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-medium">Upcoming Payroll</h3>
                <p className="text-sm">October 1, 2024</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-4xl font-bold">₱168,000</p>
                <span className="inline-block bg-[#5C7346] text-white rounded-full px-4 py-1 text-sm">Pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-4 mt-12">
          <button className="bg-gray-800 text-white px-6 py-2 rounded-md w-32">Attendance</button>
          <button onClick={() => navigate("/payslip")} className="bg-gray-800 text-white px-6 py-2 rounded-md w-32">
            Payslip
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage

