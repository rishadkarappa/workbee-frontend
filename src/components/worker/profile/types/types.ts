
export interface WorkerProfileData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  workType: string;
  bio?:string;
  preferredWorks: string[];
  workerProfileImage?: string;
  workerProfileImagePublicId?: string;
  createdAt: string;
}

// modal props

export interface ChangePasswordModalProps {
isOpen: boolean;
setIsOpen: (isOpen: boolean) => void;
}