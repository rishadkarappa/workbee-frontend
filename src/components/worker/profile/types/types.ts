
export interface WorkerProfileData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  workType: string;
  preferredWorks: string[];
  workerProfileImage?: string;
  workerProfileImagePublicId?: string;
  createdAt: string;
}