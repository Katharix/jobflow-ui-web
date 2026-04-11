export interface SupportHubAuditLog {
  id: string;
  organizationId: string | null;
  userId: string | null;
  category: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  path: string | null;
  method: string | null;
  statusCode: number;
  success: boolean;
  ipAddress: string | null;
  detailsJson: string | null;
  createdAt: string;
}
