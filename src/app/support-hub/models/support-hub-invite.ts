export interface SupportHubInvite {
  id: string;
  code: string;
  role: 'KatharixAdmin' | 'KatharixEmployee';
  createdAt: string;
  createdBy?: string | null;
  expiresAt: string;
  redeemedAt?: string | null;
  redeemedBy?: string | null;
}
