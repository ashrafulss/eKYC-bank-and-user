// src/lib/api-client.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1",
  timeout: 15000, // 15 seconds request timeout
  headers: {
    "Content-Type": "application/json",
  },
  // Enables cross-site access-control requests, automatically passing cookies along with HTTP calls
  withCredentials: true,
});

/**
 * HELPER FUNCTION:
 * Safely parses cookies by key name on the client browser environment.
 */
const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

/**
 * REQUEST INTERCEPTOR:
 * Runs right before every outgoing network call hits your server.
 */
apiClient.interceptors.request.use(
  (config) => {
    // 1. Retrieve the secure Next Auth session JWT token from the client cookies
    const token = getCookie("next_auth_session");

    // 2. If the token exists, cleanly inject it into the HTTP Authorization header
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request configuration setup bugs globally
    return Promise.reject(error);
  },
);

/**
 * RESPONSE INTERCEPTOR:
 * Evaluates the status code returned by your server before handing it to your page code.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx triggers this function
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx triggers this function
    const originalRequest = error.config;

    // Check if the server explicitly states the session expired or is invalid (401 Unauthorized)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Prevent infinite redirect loops if something goes wrong

      console.warn(
        "Session token expired or corrupted. Clearing client context...",
      );

      // Perform cross-tab cleanup tasks if needed (e.g., clearing application context storage)
      if (typeof window !== "undefined") {
        // Clear locally scoped session variables
        localStorage.removeItem("user_role");

        // Expire cookie contexts manually by setting max-age to 0
        document.cookie =
          "next_auth_session=; path=/; max-age=0; SameSite=Strict";
        document.cookie = "reg_step=; path=/; max-age=0; SameSite=Strict";

        // Force routing window directly to the portal login view.
        // This will clean up cookie states and trigger standard Next.js routing.
        window.location.href = "/login?expired=true";
      }
    }

    // Format consistent server error payloads to prevent UI component crashes
    const customError = {
      message:
        error.response?.data?.message ||
        "An unexpected connection error occurred.",
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    return Promise.reject(customError);
  },
);

export default apiClient;
