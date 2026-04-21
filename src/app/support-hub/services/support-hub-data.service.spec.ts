import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SupportHubDataService } from './support-hub-data.service';
import { BaseApiService } from '../../services/shared/base-api.service';

describe('SupportHubDataService', () => {
  let service: SupportHubDataService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [
        SupportHubDataService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(SupportHubDataService);
  });

  it('fetches all tickets from supporthub/tickets', () => {
    api.get.and.returnValue(of([]));

    service.getTickets().subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/tickets');
  });

  it('fetches all sessions from supporthub/sessions', () => {
    api.get.and.returnValue(of([]));

    service.getSessions().subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/sessions');
  });

  it('creates a ticket via post to supporthub/tickets', () => {
    const payload = { organizationId: 'org-1', title: 'Bug report', status: 'open' };
    api.post.and.returnValue(of({}));

    service.createTicket(payload).subscribe();

    expect(api.post).toHaveBeenCalledWith('supporthub/tickets', payload);
  });

  it('creates a session via post to supporthub/sessions', () => {
    const payload = { organizationId: 'org-1', agentName: 'Support Agent', status: 'active' };
    api.post.and.returnValue(of({}));

    service.createSession(payload).subscribe();

    expect(api.post).toHaveBeenCalledWith('supporthub/sessions', payload);
  });

  it('seeds demo data for the given organization', () => {
    api.post.and.returnValue(of({ ticketsCreated: 3, sessionsCreated: 2 }));

    service.seedDemo('org-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('supporthub/seed', { organizationId: 'org-1' });
  });

  it('requests a screen view for a session', () => {
    api.post.and.returnValue(of({ sessionId: 'sess-1', viewerUrl: 'https://example.com' }));

    service.requestScreenView('sess-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('supporthub/sessions/sess-1/screen', {});
  });

  it('fetches financial summary for an organization', () => {
    api.get.and.returnValue(of({}));

    service.getOrganizationFinancialSummary('org-1').subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/organizations/org-1/financial-summary');
  });

  it('fetches disputes with default page size when no options provided', () => {
    api.get.and.returnValue(of({ items: [], nextCursor: null }));

    service.getOrganizationDisputes('org-1').subscribe();

    expect(api.get).toHaveBeenCalledWith(
      'supporthub/organizations/org-1/disputes',
      jasmine.objectContaining({ pageSize: '100' })
    );
  });

  it('passes cursor to disputes query when provided', () => {
    api.get.and.returnValue(of({ items: [] }));

    service.getOrganizationDisputes('org-1', 'cursor-abc').subscribe();

    const args = api.get.calls.mostRecent().args;
    expect(args[1]).toEqual(jasmine.objectContaining({ cursor: 'cursor-abc' }));
  });

  it('fetches payments with default page size when no options provided', () => {
    api.get.and.returnValue(of({ items: [] }));

    service.getOrganizationPayments('org-1').subscribe();

    expect(api.get).toHaveBeenCalledWith(
      'supporthub/organizations/org-1/payments',
      jasmine.objectContaining({ pageSize: '100' })
    );
  });

  it('fetches audit logs with no params when no filters provided', () => {
    api.get.and.returnValue(of({ items: [] }));

    service.getAuditLogs().subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/audit-logs', {});
  });

  it('passes all provided audit log filter params', () => {
    api.get.and.returnValue(of({ items: [] }));

    service.getAuditLogs({
      pageSize: 20,
      cursor: 'cur-1',
      fromUtc: '2026-01-01',
      toUtc: '2026-12-31',
      category: 'auth',
      success: true
    }).subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/audit-logs', {
      pageSize: '20',
      cursor: 'cur-1',
      fromUtc: '2026-01-01',
      toUtc: '2026-12-31',
      category: 'auth',
      success: 'true'
    });
  });

  it('fetches all staff members', () => {
    api.get.and.returnValue(of([]));

    service.getStaff().subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/staff');
  });

  it('updates staff role via put endpoint', () => {
    api.put.and.returnValue(of(void 0));

    service.updateStaffRole('staff-1', 'admin').subscribe();

    expect(api.put).toHaveBeenCalledWith('supporthub/staff/staff-1/role', { role: 'admin' });
  });

  it('deactivates a staff member via put deactivate endpoint', () => {
    api.put.and.returnValue(of(void 0));

    service.deactivateStaff('staff-1').subscribe();

    expect(api.put).toHaveBeenCalledWith('supporthub/staff/staff-1/deactivate', {});
  });
});
