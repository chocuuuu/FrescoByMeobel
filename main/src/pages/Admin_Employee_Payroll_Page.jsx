"use client"

import { useState } from "react"
import NavBar from "../components/Nav_Bar"
import EditPayroll from "../components/Edit_Payroll" // Updated import statement

function AdminEmployeePayrollPage() {
  const [payrollData, setPayrollData] = useState([
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
      name: "Raceli Sincioco",
      rate_per_month: "19000",
      deductions: "3927",
      pay_date: "2024-11-15",
    },
    {
      id: 4,
      name: "Raceli Sincioco",
      rate_per_month: "19000",
      deductions: "3927",
      pay_date: "2024-11-15",
    },
  ])

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

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
    setIsEditModalOpen(false) // Close the modal after updating
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-8">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Payroll</h2>
            <div className="flex items-center space-x-4">
              <input
                type="search"
                placeholder="Search..."
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346]"
              />
            </div>
          </div>

          {/* Payroll Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">NAME</th>
                  <th className="py-3 px-4">RATE PER MONTH</th>
                  <th className="py-3 px-4">DEDUCTIONS</th>
                  <th className="py-3 px-4">PAY DATE</th>
                  <th className="py-3 px-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {payrollData.map((item) => (
                  <tr key={item.id} className="border-b border-white/10">
                    <td className="py-3 px-4">{item.id}</td>
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-4">₱{item.rate_per_month}</td>
                    <td className="py-3 px-4">₱{item.deductions}</td>
                    <td className="py-3 px-4">{item.pay_date}</td>
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
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end mt-4 space-x-2">
            <button className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors">
              Previous
            </button>
            <button className="bg-[#5C7346] text-white px-4 py-2 rounded-md hover:bg-[#4a5c38] transition-colors">
              Next
            </button>
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