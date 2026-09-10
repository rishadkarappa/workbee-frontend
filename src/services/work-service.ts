import type { ApplyForWorkerDto } from "@/components/worker/worker-apply";
import { api } from "./axios-instance/axios-instance";
import { WORK_ENDPOINTS } from "@/constants/api-endpoints/work-endpoints";
import type { MediaItem } from "./cloudinary-work-media-service";

interface UpdateWorkDto {
    workTitle?: string;
    workCategory?: string;
    workType?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    status?: string;
    progress?: string;
    workerId?: string;
    manualAddress?: string;
    landmark?: string;
}

interface PostWorkDto {
    userId: string;
    workTitle: string;
    workCategory: string;
    workType: string;

    date?: string;
    startDate?: string;
    endDate?: string;
    time: string;

    voiceFile: MediaItem | null;
    images: MediaItem[];
    videos: MediaItem[];

    description: string;
    duration?: string;
    budget?: string;

    latitude: number;
    longitude: number;

    currentLocation?: string;
    manualAddress?: string;
    landmark?: string;

    contactNumber: string;
    petrolAllowance?: string;
    extraRequirements?: string;
    anythingElse?: string;

    termsAccepted: boolean;
}

export const WorkService = {

    getAppliers: (page: number, limit: number, search: string) => {
        return api.get(WORK_ENDPOINTS.GET_APPLIERS, {
            params: { page, limit, search }
        });
    },

    approveWorkerApplication: (data: { workerId: string; status: "approved" | "rejected"; rejectionReason?: string; }) => {
        return api.post(WORK_ENDPOINTS.APPROVE_WORKER, data)
    },

    getAllWorkers: (page: number, limit: number, search: string, status?: string) => {
        return api.get(WORK_ENDPOINTS.GET_WORKERS, {
            params: { page, limit, search, status: status && status !== 'all' ? status : undefined }
        });
    },

    getAllWorks: (filters?: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
        latitude?: number;
        longitude?: number;
        maxDistance?: number;
    }) => {
        const params = new URLSearchParams();

        if (filters?.search) params.append('search', filters.search);
        if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', filters.limit.toString());

        if (filters?.latitude !== undefined) params.append('latitude', filters.latitude.toString());
        if (filters?.longitude !== undefined) params.append('longitude', filters.longitude.toString());
        if (filters?.maxDistance !== undefined) params.append('maxDistance', filters.maxDistance.toString());

        // return api.get(WORK_ENDPOINTS.GET_ALL_WORKS);
        return api.get(WORK_ENDPOINTS.GET_ALL_WORKS, { params: filters });
    },

    postWork: (workData: PostWorkDto) => {
        return api.post(WORK_ENDPOINTS.POST_WORK, workData);
    },

    applyForWorker: (workerData: ApplyForWorkerDto) => {
        return api.post(WORK_ENDPOINTS.APPLY_WORKER, workerData)
    },

    blockWorker: (id: string) => {
        return api.patch(WORK_ENDPOINTS.BLOCK_WORKER(id));
    },

    // - User
    getMyWorks: () => {
        return api.get(WORK_ENDPOINTS.GET_MY_WORKS);
    },

    updateWork: (workId: string, workData: UpdateWorkDto) => {
        return api.put(WORK_ENDPOINTS.UPDATE_WORK(workId), workData);
    },

    deleteMyWork: (workId: string) => {
        return api.delete(WORK_ENDPOINTS.DELETE_MY_WORK(workId))
    },

    // - Worker
    /**
     * Get works assigned to the currently authenticated worker.
     * Backend: GET /work/worker-assigned-works
     * Returns works where status === 'assigned' and the workerId matches.
     */

    getWorkerAssignedWorks: () => {
        return api.get(WORK_ENDPOINTS.GET_WORKER_ASSIGNED_WORKS);
    },

    getWorkerProfile: () => {
        return api.get(WORK_ENDPOINTS.GET_WORKER_PROFILE);
    },

    getUploadSign: () => {
        return api.get(WORK_ENDPOINTS.GET_UPLOAD_SIGN);
    },

    saveImageUrlFromCloud: (data: { imageUrl: string; publicId: string; }) => {
        return api.patch(WORK_ENDPOINTS.SAVE_WORKER_PROF_URI_FROM_CLOUD, data);
    },

    //dashboard stat
    getWorkerDashboardStats: () => {
        return api.get(WORK_ENDPOINTS.GET_WORKER_DASHBOARD_STATS);
    },

    getAdminWorkStats: () => {
        return api.get(WORK_ENDPOINTS.ADMIN_WORK_STATS);
    },

    updateWorkerProfile: (data: { name: string; phone: string; location: string; bio: string; }) => {
        return api.patch(WORK_ENDPOINTS.UPDATE_WORKER_PROFILE, data);
    },
}