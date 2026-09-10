import { api } from "./axios-instance/axios-instance";
import { WORK_ENDPOINTS } from "@/constants/api-endpoints/work-endpoints";

export interface MediaItem {
  url: string;
  publicId: string;
}

interface SignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export const CloudinaryWorkMediaService = {
  getSignature: async (): Promise<SignatureResponse> => {
    const res = await api.get(WORK_ENDPOINTS.WORK_MEDIA_UPLOAD_SIGNATURE);
    return res.data.data;
  },

  uploadFile: async (
    file: File,
    resourceType: "image" | "video",
    onProgress?: (pct: number) => void
  ): Promise<MediaItem> => {
    const sig = await CloudinaryWorkMediaService.getSignature();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve({ url: data.secure_url, publicId: data.public_id });
        } else {
          reject(new Error("Upload to Cloudinary failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  },
};