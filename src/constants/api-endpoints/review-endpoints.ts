export const REVIEW_ENDPOINTS = {
    CREATE_REVIEW: '/work/review',
    CHECK_REVIEW: (workId: string) => `/work/review/check/${workId}`,
    GET_WORKER_PROFILE_STATS: (workerId: string) => `/work/worker-profile-stats/${workerId}`,
};