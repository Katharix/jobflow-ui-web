export interface SupportHubStaffMember {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  firebaseUid: string | null;
  role: 'KatharixAdmin' | 'KatharixEmployee';
  createdAt: string;
  isActive: boolean;
}
