import type { IUser } from "workbee-common";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const USER = "user";
const USER_ID = "userId";

export const AuthHelper = {
  // Save tokens, user, and userId
  setAuth(accessToken: string, refreshToken: string, user: IUser) {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
    localStorage.setItem(USER, JSON.stringify(user));
    localStorage.setItem(USER_ID, user.id);
  },

  // Access Token methods
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN);
  },

  setAccessToken(token: string) {
    localStorage.setItem(ACCESS_TOKEN, token);
  },

  // Refresh Token methods
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN);
  },

  setRefreshToken(token: string) {
    localStorage.setItem(REFRESH_TOKEN, token);
  },

  // User methods
  getUser() {
    const stored = localStorage.getItem(USER);
    return stored ? JSON.parse(stored) : null;
  },

  setUser(user: IUser) {
    localStorage.setItem(USER, JSON.stringify(user));
  },

  // User ID methods
  getUserId() {
    return localStorage.getItem(USER_ID);
  },

  setUserId(id: string) {
    localStorage.setItem(USER_ID, id);
  },

  // Role check 
  getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  },

  isAdmin() {
    return this.getUserRole() === "admin";
  },

  isUser() {
    return this.getUserRole() === "user";
  },

  isWorker() {
    return this.getUserRole() === "worker";
  },

  // Clear all
  clearAuth() {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(USER);
    localStorage.removeItem(USER_ID);
  },

  // Auth check
  isLoggedIn() {
    return !!localStorage.getItem(ACCESS_TOKEN);
  }
};