export interface SupportHubTicket {
  id: string;
  title: string;
  status: 'Urgent' | 'High' | 'Normal' | 'Low' | 'Resolved';
  organizationName: string;
  createdAt: string;
}
