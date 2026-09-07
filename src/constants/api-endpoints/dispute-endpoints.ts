export const DISPUTE_ENDPOINTS = {
  UPLOAD_SIGNATURE: (resourceType: string) => `/work/dispute/upload-signature?resourceType=${resourceType}`,
  CREATE: `/work/dispute`,
  MY_DISPUTES: `/work/dispute/my-disputes`,
  WORKER_DISPUTES: `/work/dispute/worker-disputes`,
  ADMIN_ALL: `/work/dispute/admin/all`,
  ADMIN_DETAIL: (id: string) => `/work/dispute/admin/${id}`,
  ADMIN_ACTION: (id: string) => `/work/dispute/admin/${id}/action`,
};