// main page types

export interface UserProfileData {
  name: string;
  email: string;
  phone?: number;
  createdAt?: Date;
  location?:string;
  userProfileImage?: string;
}

// Fields we don't have real endpoints for yet — dummy/local only
export interface ExtraProfileData {
  firstName: string;
  location:string;
  bio: string;
  badge: string;
}