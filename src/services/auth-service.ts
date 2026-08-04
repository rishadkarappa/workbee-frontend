import { AuthEndpoints } from "@/constants/api-endpoints/auth-endpoints";
import { api } from "./axios-instance/axios-instance";

export const AuthService = {

    // User Api's

    // register
    register: (data: { name: string, email: string, password: string }) => {
        return api.post(AuthEndpoints.AUTH.REGISTER, data)
    },

    // verify otp
    verifyOtp: (data: { userId: string | null; otp: string }) => {
        return api.post(AuthEndpoints.AUTH.VERIFY_OTP, data);
    },

    // resent otp
    resendOtp: (data: { userId: string }) => {
        return api.post(AuthEndpoints.AUTH.RESEND_OTP, data)
    },

    // login
    login: (data: { email: string, password: string }) => {
        return api.post(AuthEndpoints.AUTH.LOGIN, data)
    },

    // forgot Password
    forgotPassword: (data: { email: string }) => {
        return api.post(AuthEndpoints.AUTH.FORGOT_PASSWORD, data)
    },

    // reset Password
    resetPassword: (token: string, data: { password: string }) => {
        return api.post(AuthEndpoints.AUTH.RESET_PASSWORD(token), data);
    },

    // verify User
    verifyUser: () => api.get(AuthEndpoints.AUTH.VERIFY),

    // refresh token
    refreshToken: (refreshToken: string) => {
        return api.post(AuthEndpoints.AUTH.REFRESH_TOKEN, { refreshToken });
    },

    // logout
    logout: () => {
        return api.post(AuthEndpoints.AUTH.LOGOUT);
    },


    // google Auth
    googleAuthLogin: (data: { credential: string}) => {
        return api.post(AuthEndpoints.AUTH.GOOGLE_LOGIN, data)
    },


    // Admin Api's

    //Admin Login
    adminLogin: (data: { email: string, password: string }) => {
        return api.post(AuthEndpoints.AUTH.ADMIN.LOGIN, data)
    },

    // get users
    getUsers: (page: number, limit: number, search: string, status?: string) => {
        return api.get(AuthEndpoints.AUTH.ADMIN.GET_USERS, {
            params: { page, limit, search, status: status && status !== 'all' ? status : undefined }
        });
    },


    // block user
    blockUser: (id: string) => {
        return api.patch(AuthEndpoints.AUTH.ADMIN.BLOCK_USER(id));
    },

    // Worker Api's

    //worker Login
    workerLogin: (data: { email: string, password: string }) => {
        return api.post(AuthEndpoints.AUTH.WORKER.LOGIN, data)
    },

}




