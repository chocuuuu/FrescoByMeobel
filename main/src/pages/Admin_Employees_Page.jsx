"use client"

import { useState, useEffect } from "react"
import NavBar from "../components/Nav_Bar"
import AddEmployee from "../components/Add_Employee"
import DeleteEmployee from "../components/Delete_Employee"
import EditEmployee from "../components/Edit_Employee"

function AdminEmployeePage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [currentPage, setCurrentPage] = useState(1)
  const [yearFilter, setYearFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const employeesPerPage = 5
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      setError(null)

      try {
        const accessToken = localStorage.getItem("access_token")
        const response = await fetch("http://localhost:8000/api/v1/employment-info/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()
        console.log(data) // Log the response to check its structure

        if (response.ok) {
          if (Array.isArray(data)) {
            setEmployees(data)
          } else {
            setError("Unexpected data format received from the server.")
          }
        } else {
          setError(data.message || "Failed to fetch employee data. Please try again.")
        }
      } catch (error) {
        console.error("Error fetching employees:", error)
        setError("An error occurred while fetching employee data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const getYearFromDate = (dateString) => {
    return new Date(dateString).getFullYear()
  }

  const handleAddEmployee = (newEmployee) => {
    setEmployees((prev) => [...prev, newEmployee])
  }

  const handleEditClick = (employee) => {
    setEmployeeToEdit(employee)
    setIsEditModalOpen(true)
  }

  const handleUpdateEmployee = (updatedEmployee) => {
    setEmployees((prevEmployees) =>
      prevEmployees.map((emp) => (emp.id === updatedEmployee.id ? updatedEmployee : emp))
    )
  }

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`http://localhost:8000/api/v1/employment-info/${employeeToDelete.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Remove the deleted employee from the state
        setEmployees((prevEmployees) => prevEmployees.filter((emp) => emp.id !== employeeToDelete.id))
        setDeleteModalOpen(false)
        setEmployeeToDelete(null)
        setDeleteError(null)
      } else {
        const errorData = await response.json()
        setDeleteError(errorData.message || "Failed to delete employee")
      }
    } catch (error) {
      console.error("Error deleting employee:", error)
      setDeleteError("An error occurred while deleting the employee")
    }
  }

  const filteredEmployees = employees.filter((employee) => {
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === "active" ? employee.active : !employee.active
    const yearEmployed = getYearFromDate(employee.hire_date)
    const matchesYear = yearFilter === "all" || yearEmployed.toString() === yearFilter
    const matchesStatus = statusFilter === "all" || employee.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesTab && matchesYear && matchesStatus
  })

  // Get unique years and statuses for filters

  const years = [...new Set(employees.map((e) => getYearFromDate(e.hire_date)))].sort((a, b) => b - a)
  const statuses = [...new Set(employees.map((e) => e.status))]

  // Pagination logic
  const indexOfLastEmployee = currentPage * employeesPerPage
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee)
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage)

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
        {deleteError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{deleteError}</div>
        )}

        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="space-x-2">
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === "active" ? "bg-[#5C7346] text-white" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => setActiveTab("active")}
              >
                ACTIVE
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === "inactive" ? "bg-[#5C7346] text-white" : "bg-[#D1DBC4] text-gray-700"
                }`}
                onClick={() => setActiveTab("inactive")}
              >
                INACTIVE
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346]"
              />
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346]"
              >
                <option value="all">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346]"
              >
                <option value="all">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-white mb-4">Employees</h2>

          {/* Employee Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4 w-1/6">ID</th>
                  <th className="py-3 px-4 w-1/4">NAME</th>
                  <th className="py-3 px-4 w-1/6">YEAR EMPLOYED</th>
                  <th className="py-3 px-4 w-1/5">STATUS</th>
                  <th className="py-3 px-4 w-1/5">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {currentEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/10">
                    <td className="py-3 px-4 truncate">{employee.employee_number}</td>
                    <td className="py-3 px-4 truncate">{`${employee.first_name} ${employee.last_name}`}</td>
                    <td className="py-3 px-4 truncate">{getYearFromDate(employee.hire_date)}</td>
                    <td className="py-3 px-4 truncate">{employee.status}</td>
                    <td className="py-3 px-4">
                      <div className="space-x-2">
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleEditClick(employee)}
                          className="bg-[#5C7346] text-white px-3 py-1 rounded-md hover:bg-[#4a5c38] transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Add empty rows to maintain table height */}
                {[...Array(Math.max(0, employeesPerPage - currentEmployees.length))].map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                    <td colSpan="5"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors"
            >
              Add Account
            </button>
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
                {currentPage} of {totalPages}
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

      {/* Add Employee Modal */}
      <AddEmployee isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddEmployee} />
      
      {/* Edit Employee Modal */}
      <EditEmployee
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEmployeeToEdit(null)
        }}
        onUpdate={handleUpdateEmployee}
        employeeData={employeeToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteEmployee
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setEmployeeToDelete(null)
          setDeleteError(null)
        }}
        onConfirm={handleDeleteConfirm}
        employeeName={employeeToDelete ? `${employeeToDelete.first_name} ${employeeToDelete.last_name}` : ""}
      />
    </div>
  )
}

export default AdminEmployeePage

