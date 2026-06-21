import axios from "axios";

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  // Read from localStorage primarily
  const localToken = localStorage.getItem("next_auth_session");
  if (localToken) return localToken;
  
  // Fallback to cookie
  const value = `; ${document.cookie}`;
  const parts = value.split(`; next_auth_session=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};


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

      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;

      if (refreshToken) {
        try {
          // Attempt to refresh the token directly with axios to bypass this interceptor
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/auth/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          const newAccessToken = res.data?.data?.accessToken;
          const newRefreshToken = res.data?.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem("next_auth_session", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("refresh_token", newRefreshToken);
            }
            
            // Retry the original request
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          console.error("Silent refresh failed:", refreshErr);
        }
      }

      console.warn(
        "Session token expired or corrupted. Clearing client context...",
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem("next_auth_session");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("reg_step");
        localStorage.removeItem("user_role");
        document.cookie =
          "next_auth_session=; path=/; max-age=0; SameSite=Strict";
        document.cookie = "reg_step=; path=/; max-age=0; SameSite=Strict";
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
