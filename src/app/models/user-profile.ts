export interface UserProfile {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  preferredLanguage: string | null;
}

export interface UserProfileUpdateRequest {
  email?: string | null;
  phoneNumber?: string | null;
  preferredLanguage?: string | null;
}
