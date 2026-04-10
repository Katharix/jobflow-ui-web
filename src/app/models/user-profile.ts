export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  preferredLanguage: string | null;
}

export interface UserProfileUpdateRequest {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  preferredLanguage?: string | null;
}
