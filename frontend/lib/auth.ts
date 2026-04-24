// API base URL for backend
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Get auth headers
export function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Get current user from localStorage
export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// Check if user is authenticated
export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
}

// Logout
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

// Fetch wrapper
export async function apiFetch(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: getAuthHeaders(),
    });

    // Check if response is JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Response is not JSON (likely HTML error page)
      console.error(`API returned non-JSON response for ${path}:`, {
        status: res.status,
        statusText: res.statusText,
        contentType,
      });
      return {
        success: false,
        message: `Server error (${res.status}): ${res.statusText}`,
      };
    }

    const data = await res.json();

    // Handle 401 unauthorized
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login/admin";
      }
      return { success: false, message: "Session expired. Please login again." };
    }

    return data;
  } catch (error) {
    console.error(`API fetch error for ${path}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error. Please check if the server is running.",
    };
  }
}
