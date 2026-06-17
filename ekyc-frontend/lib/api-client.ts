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

const getCookie = (name: string): string | null => {
  if (typeof window === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};


apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie("next_auth_session");
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
  (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      console.warn(
        "Session token expired or corrupted. Clearing client context...",
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem("user_role");
        document.cookie =
          "next_auth_session=; path=/; max-age=0; SameSite=Strict";
        document.cookie = "reg_step=; path=/; max-age=0; SameSite=Strict";
        window.location.href = "/login?expired=true";
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
