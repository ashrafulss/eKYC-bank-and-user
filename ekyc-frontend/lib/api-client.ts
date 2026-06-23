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

// Reads the access token strictly from cookies
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; next_auth_session=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
};

// Helper function to decode JWT expiration without external libraries
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const { exp } = JSON.parse(jsonPayload);
    
    // 🌟 Returns true if the token expires in the next 5 seconds (buffer window)
    return Date.now() >= exp * 1000 - 5000;
  } catch (err) {
    return true; // Treat as expired if parsing fails to safeguard routes
  }
};

// 🌟 Tracking states for the synchronized parallel request queue
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── REQUEST INTERCEPTOR: Refreshes token BEFORE making any backend calls ──
apiClient.interceptors.request.use(
  async (config) => {
    let token = getToken();

    // 🌟 Check if token is expired BEFORE the call leaves the browser
    if (token && isTokenExpired(token)) {
    

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/auth/refresh`,
            {},
            { 
              headers: { "Content-Type": "application/json" }, 
              withCredentials: true 
            }
          );
          
          const newAccessToken = res.data?.data?.accessToken || getToken();
          if (newAccessToken) {
            token = newAccessToken;
            processQueue(null, newAccessToken);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          console.error("❌ Pre-emptive cookie-based refresh failed:", refreshErr);
          
          // Force logout if the refresh cookie is also invalid or expired
          handleExpiryLogout();
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Parallel requests wait here for the single active refresh process to finish
        token = await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── RESPONSE INTERCEPTOR: Fallback catch-all for unexpected 401s ──
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
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Fallback Interceptor: Triggering cookie refresh...");

        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/auth/refresh`,
          {},
          { 
            headers: { "Content-Type": "application/json" }, 
            withCredentials: true 
          }
        );

        const newAccessToken = res.data?.data?.accessToken || getToken();

        if (newAccessToken) {
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        handleExpiryLogout();
      } finally {
        isRefreshing = false;
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
  }
);

// Unified logout sequence when session fully expires
const handleExpiryLogout = () => {
  console.warn("Session completely expired. Evicting client context...");
  if (typeof window !== "undefined") {
    document.cookie = "next_auth_session=; path=/; max-age=0; SameSite=Strict";
    document.cookie = "reg_step=; path=/; max-age=0; SameSite=Strict";
    window.location.href = "/";
  }
};

export default apiClient;