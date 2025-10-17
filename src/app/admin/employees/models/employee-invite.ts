export interface EmployeeInvite {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  phoneNumber: string;
  roleId: string;
  inviteToken: string;
  expiresAt: string;
  isAccepted: boolean;
  isRevoked: boolean;
}