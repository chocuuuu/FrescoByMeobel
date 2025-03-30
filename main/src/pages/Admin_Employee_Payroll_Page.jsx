"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar.jsx"
import EditPayroll from "../components/Edit_Payroll.jsx"
import { API_BASE_URL } from "../config/api"

function AdminEmployeePayrollPage() {
  const [employees, setEmployees] = useState([])
  const [payrollData, setPayrollData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const recordsPerPage = 5

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true)
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch(`${API_BASE_URL}/employment-info/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch employees")
        }

        const data = await response.json()

        // Filter for active employees only
        const activeEmployees = data.filter((employee) => employee.active !== false)
        setEmployees(activeEmployees)

        // Generate placeholder payroll data for each employee
        const placeholderPayroll = generatePlaceholderPayroll(activeEmployees)
        setPayrollData(placeholderPayroll)

        console.log("Active employees fetched:", activeEmployees.length)
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("An error occurred while fetching employees. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Generate placeholder payroll data
  const generatePlaceholderPayroll = (employeeList) => {
    return employeeList.map((employee) => {
      // Calculate a random base salary between 20,000 and 50,000
      const baseSalary = Math.floor(Math.random() * 30000) + 20000

      // Calculate random deductions (10-15% of base salary)
      const deductionRate = (Math.random() * 5 + 10) / 100
      const deductions = Math.round(baseSalary * deductionRate)

      // Calculate random allowances (5-10% of base salary)
      const allowanceRate = (Math.random() * 5 + 5) / 100
      const allowances = Math.round(baseSalary * allowanceRate)

      // Calculate net salary
      const netSalary = baseSalary + allowances - deductions

      return {
        id: employee.id,
        employee_id: employee.employee_number,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        position: employee.position || "Staff",
        base_salary: baseSalary,
        allowances: allowances,
        deductions: deductions,
        net_salary: netSalary,
        status: "Paid", // Placeholder status
        // Add fields needed for the Edit_Payroll component
        rate_per_month: baseSalary.toString(),
      }
    })
  }

  // Handle edit payroll - open modal with employee data
  const handleEditPayroll = (employeeId) => {
    const employee = payrollData.find((emp) => emp.id === employeeId)
    if (employee) {
      setSelectedEmployee(employee)
      setIsEditModalOpen(true)
    }
  }

  // Handle payroll update
  const handlePayrollUpdate = (updatedData) => {
    console.log("Updating payroll data:", updatedData)
    // Here you would typically send the updated data to your API
    // For now, we'll just update the local state

    if (selectedEmployee) {
      const updatedPayrollData = payrollData.map((emp) => {
        if (emp.id === selectedEmployee.id) {
          return {
            ...emp,
            base_salary: Number.parseFloat(updatedData.baseSalary),
            deductions: Number.parseFloat(updatedData.totalDeductions),
            net_salary: Number.parseFloat(updatedData.totalSalaryCompensation),
            status: "Processing", // Change status after update
          }
        }
        return emp
      })

      setPayrollData(updatedPayrollData)
      setIsEditModalOpen(false)
      setSelectedEmployee(null)
    }
  }

  // Filter payroll data based on search term
  const filteredPayrollData = payrollData.filter((record) => {
    return (
      record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Sort by employee ID in descending order (assuming higher ID = newer employee)
  const sortedPayrollData = [...filteredPayrollData].sort((a, b) => {
    // Convert to numbers and sort in descending order
    return Number.parseInt(b.employee_id) - Number.parseInt(a.employee_id)
  })

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = sortedPayrollData.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(sortedPayrollData.length / recordsPerPage)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "pending":
        return "bg-blue-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-white">Employee Payroll</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={() => {
                  // Placeholder for generating payroll
                  alert("Payroll generation functionality will be implemented later")
                }}
                className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors"
              >
                Generate Payroll
              </button>
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346] w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Payroll Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4 w-[10%]">ID</th>
                  <th className="py-3 px-4 w-[30%]">NAME</th>
                  <th className="py-3 px-4 w-[15%]">POSITION</th>
                  <th className="py-3 px-4 w-[12%]">GROSS SALARY</th>
                  <th className="py-3 px-4 w-[12%]">NET SALARY</th>
                  <th className="py-3 px-4 w-[10%]">STATUS</th>
                  <th className="py-3 px-4 w-[15%]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {currentRecords.length > 0 ? (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-white/10">
                      <td className="py-3 px-4">{record.employee_id}</td>
                      <td className="py-3 px-4">{record.employee_name}</td>
                      <td className="py-3 px-4">{record.position}</td>
                      <td className="py-3 px-4">{formatCurrency(record.base_salary)}</td>
                      <td className="py-3 px-4">{formatCurrency(record.net_salary)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-4 py-1 rounded-full font-medium whitespace-nowrap ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEditPayroll(record.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors text-md md:text-lg"
                        >
                          Edit Payroll
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center">
                      No payroll records found
                    </td>
                  </tr>
                )}
                {/* Add empty rows to maintain table height */}
                {currentRecords.length > 0 &&
                  [...Array(Math.max(0, recordsPerPage - currentRecords.length))].map((_, index) => (
                    <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                      <td colSpan="7"></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-white">
                Showing {currentRecords.length} of {sortedPayrollData.length} employees
              </p>
            </div>
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
                {currentPage} of {totalPages || 1}
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors ${
                  currentPage === totalPages || totalPages === 0 ? "opacity-50 cursor-not-allowed" : ""
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
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedEmployee(null)
        }}
        employeeData={selectedEmployee}
        onUpdate={handlePayrollUpdate}
      />
    </div>
  )
}

export default AdminEmployeePayrollPage

