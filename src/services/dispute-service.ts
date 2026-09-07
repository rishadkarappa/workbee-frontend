import { api } from "./axios-instance/axios-instance";
import { DISPUTE_ENDPOINTS } from "@/constants/api-endpoints/dispute-endpoints";

export type ComplaintType =
  | "against_worker" | "about_work" | "cleanliness" | "behavior"
  | "work_not_completed" | "fraud_suspicion" | "other";

export type DisputeActionType =
  | "block_worker" | "unblock_worker"
  | "block_user" | "unblock_user"
  | "blacklist_worker" | "unblacklist_worker"
  | "blacklist_user" | "unblacklist_user"
  | "warning_email_worker" | "warning_email_user"
  | "no_action";

export interface CreateDisputePayload {
  workId: string;
  workerId: string;
  complaintType: ComplaintType;
  description: string;
  proofImages?: string[];
  proofVideo?: string;
}

export interface DisputeActionPayload {
  actionType: DisputeActionType;
  reason: string;
}

export const DisputeService = {
  getUploadSignature: (resourceType: "image" | "video") => {
    return api.get(DISPUTE_ENDPOINTS.UPLOAD_SIGNATURE(resourceType));
  },
  createDispute: (data: CreateDisputePayload) => {
    return api.post(DISPUTE_ENDPOINTS.CREATE, data);
  },
  getMyDisputes: () => {
    return api.get(DISPUTE_ENDPOINTS.MY_DISPUTES);
  },
  getWorkerDisputes: () => {
    return api.get(DISPUTE_ENDPOINTS.WORKER_DISPUTES);
  },
  getAllDisputes: (params: { page: number; limit: number; status?: string; search?: string }) => {
    return api.get(DISPUTE_ENDPOINTS.ADMIN_ALL, { params });
  },
  getDisputeById: (id: string) => {
    return api.get(DISPUTE_ENDPOINTS.ADMIN_DETAIL(id));
  },
  applyAction: (id: string, data: DisputeActionPayload) => {
    return api.patch(DISPUTE_ENDPOINTS.ADMIN_ACTION(id), data);
  },
};