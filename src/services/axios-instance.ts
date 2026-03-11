import { AuthHelper } from "@/utils/auth-helper";
import axios from "axios";
import { notificationSocketService } from "@/services/notification-socket-service";

const baseURL = import.meta.env.VITE_GATEWAY_URL;

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ─── Shared logout helper ────────────────────────────────────────────────────
const forceLogout = (reason: "blocked" | "expired") => {
  notificationSocketService.disconnect();
  
  const userRole = AuthHelper.getUserRole();
  AuthHelper.clearAuth();

  if (reason === "blocked") {
    // Small delay so any in-flight UI renders complete
    setTimeout(() => {
      const loginPath =
        userRole === "admin" ? "/admin" :
        userRole === "worker" ? "/worker/worker-login" :
        "/login";

      // Pass a flag so the login page can show "Your account has been blocked"
      window.location.href = `${loginPath}?blocked=true`;
    }, 100);
  } else {
    const loginPath =
      userRole === "admin" ? "/admin" :
      userRole === "worker" ? "/worker/worker-login" :
      "/login";
    window.location.href = loginPath;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = AuthHelper.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const responseData = error.response?.data;

    // Case 1: Account blocked — immediate logout, no refresh attempt
    // Gateway returns 401 with code "ACCOUNT_BLOCKED"
    const isBlockedError =
      responseData?.code === "ACCOUNT_BLOCKED" ||
      responseData?.error?.toLowerCase().includes("blocked") ||
      responseData?.message?.toLowerCase().includes("blocked");

    if (isBlockedError) {
      console.warn("Account blocked — forcing logout");
      forceLogout("blocked");
      return Promise.reject(error);
    }

    // Case 2: Token expired/invalid — attempt refresh
    if ((status === 401 || status === 403) && !originalRequest._retry) {

      const isTokenError =
        responseData?.error?.toLowerCase().includes("token") ||
        responseData?.message?.toLowerCase().includes("token") ||
        responseData?.error?.toLowerCase().includes("expired") ||
        responseData?.error?.toLowerCase().includes("invalid") ||
        status === 403; // 403 from gateway always means bad/expired token

      if (!isTokenError) {
        return Promise.reject(error);
      }

      // Queue concurrent requests while refresh is in progress
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = AuthHelper.getRefreshToken();

      if (!refreshToken) {
        console.log("No refresh token — redirecting to login");
        forceLogout("expired");
        return Promise.reject(error);
      }

      try {
        console.log("Access token expired, refreshing...");

        const response = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        console.log("Token refreshed successfully");

        AuthHelper.setAccessToken(accessToken);
        AuthHelper.setRefreshToken(newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        return api(originalRequest);

      } catch (refreshError: any) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError, null);

        // Check if refresh itself failed due to block
        const refreshBlocked =
          refreshError.response?.data?.code === "ACCOUNT_BLOCKED" ||
          refreshError.response?.data?.error?.toLowerCase().includes("blocked");

        forceLogout(refreshBlocked ? "blocked" : "expired");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);