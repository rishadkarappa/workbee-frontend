// main page types
export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  location?: string;
  bio?: string;
  userProfileImage?: string;
  createdAt: string;
}

// Fields we don't have real endpoints for yet — dummy/local only
export interface ExtraProfileData {
  firstName: string;
  location:string;
  bio: string;
  badge: string;
}