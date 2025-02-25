"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"
import EditPayroll from "../components/Edit_Payroll"

function AdminEmployeePayrollPage() {
  const [payrollData, setPayrollData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const employeesPerPage = 5

  useEffect(() => {
    // Simulating API call to fetch payroll data
    const fetchPayrollData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Replace this with actual API call when available
        const data = [
          {
            id: 1,
            name: "Raceli Sincioco",
            rate_per_month: "19000",
            deductions: "3927",
            pay_date: "2024-11-15",
          },
          {
            id: 2,
            name: "Nicolai Alcaraz",
            rate_per_month: "19000",
            deductions: "3927",
            pay_date: "2024-11-15",
          },
          {
            id: 3,
            name: "Cyrus Canape",
            rate_per_month: "19000",
            deductions: "3927",
            pay_date: "2024-11-15",
          },
          {
            id: 4,
            name: "Eli Dizon",
            rate_per_month: "19000",
            deductions: "3927",
            pay_date: "2024-11-15",
          },
          {
            id: 5,
            name: "John Doe",
            rate_per_month: "20000",
            deductions: "4000",
            pay_date: "2024-11-15",
          },
          {
            id: 6,
            name: "Jane Smith",
            rate_per_month: "18000",
            deductions: "3800",
            pay_date: "2024-11-15",
          },
        ]
        setPayrollData(data)
      } catch (error) {
        console.error("Error fetching payroll data:", error)
        setError("An error occurred while fetching payroll data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPayrollData()
  }, [])

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee)
    setIsEditModalOpen(true)
  }

  const handleUpdatePayroll = (formData) => {
    setPayrollData((prevData) =>
      prevData.map((employee) => {
        if (employee.id === selectedEmployee.id) {
          return {
            ...employee,
            rate_per_month: formData.baseSalary,
            deductions: formData.totalDeductions,
          }
        }
        return employee
      }),
    )
    setIsEditModalOpen(false)
  }

  const filteredPayrollData = payrollData.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Pagination logic
  const indexOfLastEmployee = currentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = filteredPayrollData.slice(indexOfFirstEmployee, indexOfLastEmployee)
  const totalPages = Math.ceil(filteredPayrollData.length / employeesPerPage)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Payroll</h2>
            <div className="flex items-center space-x-4">
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346]"
              />
            </div>
          </div>

          {/* Payroll Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4 w-1/6">ID</th>
                  <th className="py-3 px-4 w-1/4">NAME</th>
                  <th className="py-3 px-4 w-1/6">RATE PER MONTH</th>
                  <th className="py-3 px-4 w-1/6">DEDUCTIONS</th>
                  <th className="py-3 px-4 w-1/6">PAY DATE</th>
                  <th className="py-3 px-4 w-1/6">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {currentEmployees.map((item) => (
                  <tr key={item.id} className="border-b border-white/10">
                    <td className="py-3 px-4 truncate">{item.id}</td>
                    <td className="py-3 px-4 truncate">{item.name}</td>
                    <td className="py-3 px-4 truncate">₱{item.rate_per_month}</td>
                    <td className="py-3 px-4 truncate">₱{item.deductions}</td>
                    <td className="py-3 px-4 truncate">{item.pay_date}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="bg-[#5C7346] text-white px-4 py-1 rounded-md hover:bg-[#4a5c38] transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Add empty rows to maintain table height */}
                {[...Array(Math.max(0, employeesPerPage - currentEmployees.length))].map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                    <td colSpan="6"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="flex justify-end items-center mt-4">
            <div className="flex space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors ${
                  currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Previous
              </button>
              <button className="bg-white text-[#5C7346] px-4 py-2 rounded-md">
                {currentPage}
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors ${
                  currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Payroll Modal */}
      <EditPayroll
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employeeData={selectedEmployee}
        onUpdate={handleUpdatePayroll}
      />
    </div>
  )
}

export default AdminEmployeePayrollPage

