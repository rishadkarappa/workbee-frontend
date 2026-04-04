import { api } from "./axios-instance";

export const WorkService = {

    getAppliers: (page: number, limit: number, search: string) => {
        return api.get("/work/get-new-appliers", {
            params: { page, limit, search }
        });
    },

    approveWorkerApplication: (data: {
        workerId: string | undefined;
        status: "approved" | "rejected";
        rejectionReason?: string;
    }) => {
        return api.post("/work/approve-worker", data)
    },

    getAllWorkers: (page: number, limit: number, search: string, status?: string) => {
        return api.get("/work/get-workers", {
            params: {
                page,
                limit,
                search,
                status: status && status !== 'all' ? status : undefined
            }
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

        return api.get(`/work/get-all-works?${params.toString()}`);
    },

    postWork: (formData: FormData) => {
        return api.post("/work/post-work", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        })
    },

    applyForWorker: (workerData: any) => {
        return api.post("/work/apply-worker", workerData)
    },

    blockWorker: (id: string) => {
        return api.patch(`/work/block-worker/${id}`);
    },

    // - User
    getMyWorks: () => {
        return api.get('/work/get-my-works');
    },

    updateWork: (workId: string, workData: any) => {
        return api.put(`/work/update-work/${workId}`, workData);
    },

    deleteMyWork: (workId: string) => {
        return api.delete(`/work/delete-my-work/${workId}`)
    },

    // - Worker
    /**
     * Get works assigned to the currently authenticated worker.
     * Backend: GET /work/worker-assigned-works
     * Returns works where status === 'assigned' and the workerId matches.
     */
    getWorkerAssignedWorks: () => {
        return api.get('/work/worker-assigned-works');
    },
}