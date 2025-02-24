"use client"

import { useState } from "react"

function AddEmployee({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    role: null,
    email: "",
    password: "",
    employee_number: null,
    first_name: "",
    last_name: "",
    position: "",
    address: "",
    hire_date: null,
    status: false,
    active: false,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/employment-info/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        onAdd(data)
        onClose()
      } else {
        const errorData = await response.json()
        console.error("Failed to add employee:", errorData)
      }
    } catch (error) {
      console.error("Error adding employee:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "employee_number"
            ? value === ""
              ? null
              : Number.parseInt(value)
            : name === "role"
              ? value === ""
                ? null
                : value
              : name === "hire_date"
                ? value === ""
                  ? null
                  : value
                : value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Add New Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              >
                <option value="">Select Role</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* Employee Number */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Employee Number</label>
              <input
                type="number"
                name="employee_number"
                value={formData.employee_number || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* First Name */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* Hire Date */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Hire Date</label>
              <input
                type="date"
                name="hire_date"
                value={formData.hire_date || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-sm text-gray-700">Status</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#5C7346] border-gray-300 rounded focus:ring-[#5C7346]"
                />
                <label className="text-sm text-gray-600">Active Status</label>
              </div>
            </div>

            {/* Active Status */}
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 h-full pt-6">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#5C7346] border-gray-300 rounded focus:ring-[#5C7346]"
                />
                <label className="text-sm text-gray-600">Active</label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-[#5C7346] rounded-md hover:bg-[#4a5c38] focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEmployee

