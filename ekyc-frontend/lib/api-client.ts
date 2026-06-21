import axios from "axios";

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensures cookies are automatically sent with every request
});

// 🌟 UPDATED: Reads the access token strictly from cookies now
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; next_auth_session=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

// Request Interceptor: Injects the Bearer token from cookies into headers
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Catches 401 errors and performs cookie-based silent refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Access token expired. Triggering silent cookie refresh...");

        // 🌟 UPDATED: Passed empty body {} because the refresh token lives inside a cookie.
        // withCredentials: true forces the browser to send your cookies along automatically.
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/auth/refresh`,
          {},
          { 
            headers: { "Content-Type": "application/json" },
            withCredentials: true 
          }
        );

        // Fallback to checking the newly dropped cookie if it's not explicitly in the JSON body
        const newAccessToken = res.data?.data?.accessToken || getToken();

        if (newAccessToken) {
          console.log("✅ Token refreshed successfully via cookies. Retrying original request...");
          
          // Re-inject the new token and replay the original network request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        console.error("❌ Cookie-based silent refresh failed:", refreshErr);
      }

      // ── CLEANUP & LOGOUT (Runs only if both access & refresh cookies are dead) ──
      console.warn("Session expired completely. Evicting client context...");

      if (typeof window !== "undefined") {
        // Clear non-HttpOnly tracking cookies on the frontend
        document.cookie = "next_auth_session=; path=/; max-age=0; SameSite=Strict";
        document.cookie = "reg_step=; path=/; max-age=0; SameSite=Strict";
        
        // Redirect to entry page
        window.location.href = "/";
      }
    }

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