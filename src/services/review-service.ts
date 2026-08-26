import { REVIEW_ENDPOINTS } from "@/constants/api-endpoints/review-endpoints";
import { api } from "./axios-instance/axios-instance";

export const ReviewService = {
    submitReview: (data: { workId: string; workerId: string; rating: number; testimonial?: string }) => {
        return api.post(REVIEW_ENDPOINTS.CREATE_REVIEW, data);
    },

    checkReviewExists: (workId: string) => {
        return api.get(REVIEW_ENDPOINTS.CHECK_REVIEW(workId));
    },

    getWorkerProfileStats: (workerId: string) => {
        return api.get(REVIEW_ENDPOINTS.GET_WORKER_PROFILE_STATS(workerId));
    },
};