// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000

// Check if the session is valid
export const isSessionValid = () => {
  const token = localStorage.getItem("access_token")
  const sessionStart = localStorage.getItem("session_start")

  if (!token || !sessionStart) {
    return false
  }

  // Check if session has expired
  const now = Date.now()
  const sessionStartTime = Number.parseInt(sessionStart, 10)
  const sessionElapsed = now - sessionStartTime

  return sessionElapsed < SESSION_TIMEOUT
}

// Refresh the session
export const refreshSession = () => {
  localStorage.setItem("session_start", Date.now().toString())
}

// End the session and redirect to login
export const endSession = () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user_id")
  localStorage.removeItem("user_email")
  localStorage.removeItem("user_role")
  localStorage.removeItem("session_start")

  // Redirect to login page
  window.location.href = "/"
}

// Session activity monitor
export const initSessionMonitor = () => {
  // Refresh session on user activity
  const refreshOnActivity = () => {
    if (isSessionValid()) {
      refreshSession()
    } else {
      endSession()
    }
  }


  // Check session validity periodically
  const intervalId = setInterval(() => {
    if (!isSessionValid()) {
      endSession()
    }
  }, 60000) // Check every minute

  // Clean up function
  return () => {
    window.removeEventListener("mousemove", refreshOnActivity)
    window.removeEventListener("keydown", refreshOnActivity)
    window.removeEventListener("click", refreshOnActivity)
    window.removeEventListener("scroll", refreshOnActivity)
    clearInterval(intervalId)
  }
}

// Prevent browser back navigation after logout
export const preventBackNavigation = () => {
  window.history.pushState(null, "", window.location.pathname)

  const handlePopState = () => {
    window.history.pushState(null, "", window.location.pathname)
  }

  window.addEventListener("popstate", handlePopState)

  return () => {
    window.removeEventListener("popstate", handlePopState)
  }
}
