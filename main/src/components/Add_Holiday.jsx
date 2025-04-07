"use client"

import { useState, useEffect } from "react"
import dayjs from "dayjs"

const AddHoliday = ({ selectedDate, holiday, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    holiday_type: "regular",
    description: "",
  })

  // Initialize form data when a holiday is selected or date changes
  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name || "",
        date: holiday.date || "",
        holiday_type: holiday.holiday_type || "regular",
        description: holiday.description || "",
      })
    } else if (selectedDate) {
      setFormData({
        ...formData,
        date: dayjs(selectedDate).format("YYYY-MM-DD"),
      })
    }
  }, [holiday, selectedDate])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  // Handle holiday deletion
  const handleDelete = () => {
    if (holiday && holiday.id) {
      onDelete(holiday.id)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{holiday ? "Edit Holiday" : "Add Holiday"}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            readOnly
            className="w-full p-2 border border-gray-300 rounded bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Holiday Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-[#5C7346] focus:border-[#5C7346]"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="holiday_type" className="block text-sm font-medium text-gray-700 mb-1">
            Holiday Type *
          </label>
          <select
            id="holiday_type"
            name="holiday_type"
            required
            value={formData.holiday_type}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-[#5C7346] focus:border-[#5C7346]"
          >
            <option value="regular">Regular Holiday</option>
            <option value="special">Special Holiday</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-[#5C7346] focus:border-[#5C7346]"
          ></textarea>
        </div>

        <div className="flex justify-between">
          <div>
            {holiday && holiday.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#5C7346] text-white rounded hover:bg-[#4a5c38]">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddHoliday

