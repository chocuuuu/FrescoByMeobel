"use client"

import { useEffect } from "react"

function ForceLogout() {
  useEffect(() => {
    // Clear all session storage to force logout
    sessionStorage.clear()
    localStorage.clear() // Also clear localStorage in case tokens are stored there

    // Redirect to login page
    window.location.href = "/"
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p>You will be redirected to the login page.</p>
      </div>
    </div>
  )
}

export default ForceLogout
