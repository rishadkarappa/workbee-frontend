import { api } from "./axios-instance/axios-instance";

export const AuthService = {

    // User Api's

    // register
    register: (data: { name: string, email: string, password: string }) => {
        return api.post("/auth/register", data)
    },

    // verify otp
    verifyOtp: (data: { userId: string | null; otp: string }) => {
        return api.post("/auth/verifyOtp", data);
    },

    // resent otp
    resendOtp: (data: { userId: string }) => {
        return api.post("/auth/resend-otp", data)
    },

    // login
    login: (data: { email: string, password: string }) => {
        return api.post("/auth/login", data)
    },

    // forgot Password
    forgotPassword: (data: { email: string }) => {
        return api.post("/auth/forgot-password", data)
    },

    // reset Password
    resetPassword: (token: string, data: { password: string }) => {
        return api.post(`/auth/reset-password/${token}`, data);
    },

    // verify User
    verifyUser: () => api.get("/auth/verify"),

    // refresh token
    refreshToken: (refreshToken: string) => {
        return api.post("/auth/refresh-token", { refreshToken });
    },

    // logout
    logout: () => {
        return api.post("/auth/logout");
    },


    // google Auth
    googleAuthLogin: (data: { credential: string }) => {
        return api.post("/auth/google-login", data)
    },


    // Admin Api's

    //Admin Login
    adminLogin: (data: { email: string, password: string }) => {
        return api.post("/auth/admin/login", data)
    },

    // get users
    getUsers: (page: number, limit: number, search: string, status?: string) => {
        return api.get("/auth/admin/get-users", {
            params: {
                page,
                limit,
                search,
                status: status && status !== 'all' ? status : undefined
            }
        });
    },


    // block user
    blockUser: (id: string) => {
        return api.patch(`/auth/admin/block-user/${id}`);
    },

    // Worker Api's

    //worker Login
    workerLogin: (data: { email: string, password: string }) => {
        return api.post("/auth/worker-login", data)
    },

}




