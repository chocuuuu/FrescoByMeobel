import React, { useState } from "react";
import NavBar from "../components/Nav_Bar";
import { UserCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminEmployeeAttendancePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [attendanceData, setAttendanceData] = useState([
    { id: 1, name: "Racell Sincioco", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 2, name: "Racell Sincioco", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 3, name: "Racell Sincioco", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
    { id: 4, name: "Racell Sincioco", date: "2024-11-15", timeIn: "09:00 AM", timeOut: "05:00 PM" },
  ]);

  const handleDelete = (id) => {
    setAttendanceData(attendanceData.filter((item) => item.id !== id));
  };

  return (
    <div className="admin-attendance-container">
      <NavBar />
      
      <main className="attendance-content">
        <div className="attendance-header">
          <h2>Attendance</h2>
          <div className="search-container">
            <label>Search: </label>
            <input type="text" className="search-box" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>DATE</th>
                <th>TIME IN</th>
                <th>TIME OUT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData
                .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
                .map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.date}</td>
                    <td>{item.timeIn}</td>
                    <td>{item.timeOut}</td>
                    <td className="action-buttons">
                      <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                      <button className="schedule-btn">Schedule</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="pagination-btn prev-btn">Previous</button>
          <button className="pagination-btn current-btn">1</button>
          <button className="pagination-btn next-btn">Next</button>
        </div>

        {/* Back Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 rounded-md text-white flex items-center gap-2 font-medium"
            style={{ backgroundColor: "#373A45" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </main>

      {/* Embedded CSS */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          background-color: #ffffff;
        }

        .admin-attendance-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .attendance-content {
          background-color: #a4be7b;
          margin: 30px;
          padding: 25px;
          border-radius: 10px;
          flex: 1;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .attendance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .attendance-header h2 {
          font-size: 24px;
          color: #ffffff;
          font-weight: bold;
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #ffffff;
        }

        .search-box {
          padding: 8px 12px;
          border: 1px solid #ffffff;
          border-radius: 100px;
          width: 200px;
          background-color: #ffffff;
        }

        .table-container {
          background-color: #ffffff;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .attendance-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .attendance-table th,
        .attendance-table td {
          width: 16.66%;
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .attendance-table th:first-child,
        .attendance-table td:first-child {
          width: 5%;
        }

        .attendance-table th:last-child,
        .attendance-table td:last-child {
          width: 25%;
        }

        .attendance-table tr:last-child td {
          border-bottom: none;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .delete-btn {
          background-color: #6b7d4b;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .schedule-btn {
          background-color: #4b6043;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .pagination {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 5px;
          margin-top: 20px;
        }

        .pagination-btn {
          border: none;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          min-width: 100px;
          text-align: center;
        }

        .prev-btn,
        .next-btn {
          background-color: #333333;
          color: white;
        }

        .current-btn {
          background-color: #ffffff;
          color: #333333;
          min-width: 40px;
        }
      `}</style>
    </div>
  );
};

export default AdminEmployeeAttendancePage;
