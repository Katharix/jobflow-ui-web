export interface Employee {
  id: string;
  organizationId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  isActive: boolean;
}
