import { API_BASE_URL } from "../config/api"

// Function to check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    const expiry = payload.exp * 1000 // Convert to milliseconds
    return Date.now() > expiry
  } catch (error) {
    console.error("Error checking token expiration:", error)
    return true
  }
}

// Function to refresh the access token
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token")

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    const data = await response.json()

    if (data.access) {
      localStorage.setItem("access_token", data.access)
      return data.access
    } else {
      throw new Error("No access token in response")
    }
  } catch (error) {
    console.error("Error refreshing token:", error)
    // Clear all auth data and redirect to login
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_id")
    localStorage.removeItem("user_email")
    localStorage.removeItem("user_role")
    window.location.href = "/"
    return null
  }
}

// Function to get a valid access token (refreshing if needed)
export const getValidToken = async () => {
  const accessToken = localStorage.getItem("access_token")

  if (!accessToken || isTokenExpired(accessToken)) {
    return await refreshToken()
  }

  return accessToken
}

// Function to make authenticated API requests
export const fetchWithAuth = async (url, options = {}) => {
  const token = await getValidToken()

  if (!token) {
    throw new Error("No valid authentication token")
  }

  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  }

  const response = await fetch(url, authOptions)

  // If unauthorized, try refreshing token once
  if (response.status === 401) {
    const newToken = await refreshToken()

    if (newToken) {
      authOptions.headers.Authorization = `Bearer ${newToken}`
      return fetch(url, authOptions)
    }
  }

  return response
}
