"use client"

import { useState } from "react"
import NavBar from "../components/Nav_Bar"
import { useNavigate } from "react-router-dom"

const AdminEmployeeAttendancePage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [attendanceData, setAttendanceData] = useState([
    { id: 1, name: "Cyrus Canape", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 2, name: "Racell Sincioco", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 3, name: "Nicolai Alcaraz", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 4, name: "Gian Bernales", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 5, name: "Joshua Camit", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 6, name: "Gian Dy", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 7, name: "Marc Custodio", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 8, name: "Ezeniel Cuenca", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
  ])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const handleDelete = (id) => {
    setAttendanceData(attendanceData.filter((item) => item.id !== id))
  }

  const filteredData = attendanceData.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  const nextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24">
        <div className="bg-[#A7BC8F] rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Attendance</h2>
            <div className="flex items-center space-x-4">
              <label className="text-white">Search: </label>
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-[#5C7346]"
              />
            </div>
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="text-left text-white border-b border-white/20">
                  <th className="py-3 px-4 w-1/6">ID</th>
                  <th className="py-3 px-4 w-1/4">NAME</th>
                  <th className="py-3 px-4 w-1/6">DATE</th>
                  <th className="py-3 px-4 w-1/6">TIME IN</th>
                  <th className="py-3 px-4 w-1/6">TIME OUT</th>
                  <th className="py-3 px-4 w-1/6">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {currentItems.map((item) => (
                  <tr key={item.id} className="border-b border-white/10">
                    <td className="py-3 px-4 truncate">{item.id}</td>
                    <td className="py-3 px-4 truncate">{item.name}</td>
                    <td className="py-3 px-4 truncate">{item.date}</td>
                    <td className="py-3 px-4 truncate">{item.timeIn}</td>
                    <td className="py-3 px-4 truncate">{item.timeOut}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-[#DC2626] text-white px-4 py-1 rounded-md hover:bg-[#B91C1C] transition-colors"
                        >
                          Delete
                        </button>
                        <button className="bg-[#4B6043] text-white px-4 py-1 rounded-md hover:bg-[#3a4c34] transition-colors">
                          Schedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Add empty rows to maintain table height */}
                {[...Array(Math.max(0, itemsPerPage - currentItems.length))].map((_, index) => (
                  <tr key={`empty-${index}`} className="border-b border-white/10 h-[52px]">
                    <td colSpan={6}></td>
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
              <button className="bg-white text-[#5C7346] px-4 py-2 rounded-md">{currentPage}</button>
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
    </div>
  )
}

export default AdminEmployeeAttendancePage

