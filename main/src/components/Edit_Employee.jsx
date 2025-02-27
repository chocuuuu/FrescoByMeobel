"use client"

import { useState, useEffect } from "react"

function EditEmployee({ isOpen, onClose, onUpdate, employeeData }) {
  // Initial form state with nested structure
  const initialFormState = {
    user: {
      role: "",
      email: "",
      password: "",
    },
    employment_info: {
      employee_number: "",
      first_name: "",
      last_name: "",
      position: "",
      address: "",
      hire_date: "",
      status: "ACTIVE",
      active: true,
    },
  }

  const [formData, setFormData] = useState(initialFormState)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when employeeData changes
  useEffect(() => {
    if (employeeData) {
      // Get the user data from the nested structure
      const userData = employeeData.user || {}

      setFormData({
        user: {
          role: employeeData.user?.role,
          email: "", // Start empty for optional update
          password: "", // Start empty for optional update
        },
        employment_info: {
          employee_number: employeeData.employee_number || "",
          first_name: employeeData.first_name || "",
          last_name: employeeData.last_name || "",
          position: employeeData.position || "",
          address: employeeData.address || "",
          hire_date: employeeData.hire_date || "",
          status: employeeData.status || "ACTIVE",
          active: employeeData.active ?? true,
        },
      })
    }
  }, [employeeData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const accessToken = localStorage.getItem("access_token")

      // Create request payload with only the fields that should be updated
      const requestPayload = {
        role: formData.user.role,
        first_name: formData.employment_info.first_name,
        last_name: formData.employment_info.last_name,
        position: formData.employment_info.position,
        address: formData.employment_info.address,
        status: formData.employment_info.status,
        active: formData.employment_info.active,
      }

      // Only include email and password if they are provided
      if (formData.user.email.trim()) {
        requestPayload.email = formData.user.email
      }
      if (formData.user.password.trim()) {
        requestPayload.password = formData.user.password
      }

      console.log("Update Request Payload:", requestPayload)

      const response = await fetch(`http://localhost:8000/api/v1/employment-info/${employeeData.id}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      const responseText = await response.text()
      console.log("Response Status:", response.status)
      console.log("Raw API Response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse JSON response:", e)
        throw new Error(`Server response: ${responseText}`)
      }

      if (!response.ok) {
        if (typeof data === "object") {
          const errorMessages = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("\n")
          throw new Error(errorMessages)
        } else if (data.detail) {
          throw new Error(data.detail)
        } else {
          throw new Error("Failed to update employee. Please check the form and try again.")
        }
      }

      // If successful, update the employee data
      onUpdate(data)
      onClose()
    } catch (error) {
      console.error("Error updating employee:", error)
      setError(error.message || "Failed to update employee. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e, section) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: type === "checkbox" ? checked : value,
      },
    }))
  }

  if (!isOpen || !employeeData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Edit Employee Information</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Role*</label>
                <select
                  name="role"
                  value={formData.user.role}
                  onChange={(e) => handleChange(e, "user")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">New Email (Optional)</label>
                <div className="space-y-1">
                  <input
                    type="email"
                    name="email"
                    value={formData.user.email}
                    onChange={(e) => handleChange(e, "user")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                    placeholder="Leave blank to keep current email"
                  />
                  <p className="text-sm text-gray-500">Current: {employeeData.user?.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">New Password (Optional)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.user.password}
                  onChange={(e) => handleChange(e, "user")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>
          </div>

          {/* Employment Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Employee Number</label>
                <input
                  type="text"
                  value={formData.employment_info.employee_number}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">First Name*</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.employment_info.first_name}
                  onChange={(e) => handleChange(e, "employment_info")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Last Name*</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.employment_info.last_name}
                  onChange={(e) => handleChange(e, "employment_info")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Position*</label>
                <input
                  type="text"
                  name="position"
                  value={formData.employment_info.position}
                  onChange={(e) => handleChange(e, "employment_info")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Address*</label>
                <input
                  type="text"
                  name="address"
                  value={formData.employment_info.address}
                  onChange={(e) => handleChange(e, "employment_info")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Hire Date</label>
                <input
                  type="date"
                  value={formData.employment_info.hire_date}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm text-gray-700">Status*</label>
                <select
                  name="status"
                  value={formData.employment_info.status}
                  onChange={(e) => handleChange(e, "employment_info")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C7346]"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>

              <div className="space-y-1 flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.employment_info.active}
                    onChange={(e) => handleChange(e, "employment_info")}
                    className="h-4 w-4 text-[#5C7346] border-gray-300 rounded focus:ring-[#5C7346]"
                  />
                  <span className="text-sm text-gray-700">Active Employee</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-[#5C7346] rounded-md hover:bg-[#4a5c38] focus:outline-none focus:ring-2 focus:ring-[#5C7346] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditEmployee

