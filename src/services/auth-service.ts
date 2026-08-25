import { AUTH_ENDPOINTS } from "@/constants/api-endpoints/auth-endpoints";
import { api } from "./axios-instance/axios-instance";

export const AuthService = {

    // User Api's

    // register
    register: (data: { name: string, email: string, password: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.REGISTER, data)
    },

    // verify otp
    verifyOtp: (data: { userId: string | null; otp: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.VERIFY_OTP, data);
    },

    // resent otp
    resendOtp: (data: { userId: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.RESEND_OTP, data)
    },

    // login
    login: (data: { email: string, password: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.LOGIN, data)
    },

    // forgot Password
    forgotPassword: (data: { email: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.FORGOT_PASSWORD, data)
    },

    // reset Password
    resetPassword: (token: string, data: { password: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.RESET_PASSWORD(token), data);
    },

    // verify User
    verifyUser: () => api.get(AUTH_ENDPOINTS.AUTH.VERIFY),

    // refresh token
    refreshToken: (refreshToken: string) => {
        return api.post(AUTH_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    },

    // logout
    logout: () => {
        return api.post(AUTH_ENDPOINTS.AUTH.LOGOUT);
    },

    //user profile apis
    getUserProfileData: () => {
        return api.get(AUTH_ENDPOINTS.AUTH.GET_USER_PROFILE_DETAILS)
    },
    getUploadSign: () => {
        return api.get(AUTH_ENDPOINTS.AUTH.GET_UPLOAD_SIGN)
    },
    saveImageUrlFromCloud: (data: { imageUrl: string; publicId: string; }) => {
        return api.patch(AUTH_ENDPOINTS.AUTH.SAVE_IMAGE_URL_FROM_CLOUD, data);
    },
    changeUserPassword: (data: { currentPassword: string; newPassword: string; }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    },

    // google Auth
    googleAuthLogin: (data: { credential: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.GOOGLE_LOGIN, data)
    },


    // Admin Api's

    //Admin Login
    adminLogin: (data: { email: string, password: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.ADMIN.LOGIN, data)
    },

    // get users
    getUsers: (page: number, limit: number, search: string, status?: string) => {
        return api.get(AUTH_ENDPOINTS.AUTH.ADMIN.GET_USERS, {
            params: { page, limit, search, status: status && status !== 'all' ? status : undefined }
        });
    },


    // block user
    blockUser: (id: string) => {
        return api.patch(AUTH_ENDPOINTS.AUTH.ADMIN.BLOCK_USER(id));
    },

    // Worker Api's

    //worker Login
    workerLogin: (data: { email: string, password: string }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.WORKER.LOGIN, data)
    },

    //change worker pass
    changeWorkerPassword: (data: { currentPassword: string; newPassword: string; }) => {
        return api.post(AUTH_ENDPOINTS.AUTH.WORKER.CHANGE_PASSWORD, data);
    },

}




