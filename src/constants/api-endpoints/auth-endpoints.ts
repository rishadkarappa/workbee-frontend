export const AUTH_ENDPOINTS = {
    AUTH: {
        
        REGISTER: "/auth/register",
        VERIFY_OTP: "/auth/verifyOtp",
        RESEND_OTP: "/auth/resend-otp",
        LOGIN: "/auth/login",
        FORGOT_PASSWORD: "/auth/forgot-password",
        RESET_PASSWORD: (token: string) => `/auth/reset-password/${token}`,
        VERIFY: "/auth/verify",
        REFRESH_TOKEN: "/auth/refresh-token",
        LOGOUT: "/auth/logout",
        GOOGLE_LOGIN: "/auth/google-login",

        GET_USER_DETAILS: (id:string) => `/auth/get-user-details/${id}`,

        GET_USER_PROFILE_DETAILS: "/auth/get-user-profile-settings",
        GET_UPLOAD_SIGN: "/auth/profile-image/upload-signature",

        ADMIN: {
            LOGIN: "/auth/admin/login",
            GET_USERS: "/auth/admin/get-users",
            BLOCK_USER: (id: string) => `/auth/admin/block-user/${id}`,
        },

        WORKER: {
            LOGIN: "/auth/worker-login",
        },
    },
};