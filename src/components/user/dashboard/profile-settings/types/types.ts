// main page types

export interface UserProfileData {
  name: string;
  email: string;
  phone?: number;
  createdAt?: Date;
  userProfileImage?: string;
}

// Fields we don't have real endpoints for yet — dummy/local only
export interface ExtraProfileData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  company: string;
  bio: string;
  location: string;
  badge: string;
}