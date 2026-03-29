export interface SupportHubSession {
  id: string;
  organizationName: string;
  agentName: string;
  status: 'Live' | 'Queued' | 'Follow-up' | 'FollowUp' | 'Ended';
  startedAt: string | null;
}
