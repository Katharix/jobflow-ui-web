import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { of, throwError } from 'rxjs';
import { SupportHubSessionsComponent } from './support-hub-sessions.component';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { OrganizationService } from '../../../services/shared/organization.service';
import { SupportHubSession } from '../../models/support-hub-session';
import { OrganizationDto } from '../../../models/organization';
import { TranslateModule } from '@ngx-translate/core';

describe('SupportHubSessionsComponent', () => {
  let component: SupportHubSessionsComponent;
  let fixture: ComponentFixture<SupportHubSessionsComponent>;
  let dataService: jasmine.SpyObj<SupportHubDataService>;
  let orgService: jasmine.SpyObj<OrganizationService>;
  let auth: jasmine.SpyObj<Auth>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockSessions: SupportHubSession[] = [
    { id: 's1', organizationName: 'Org1', agentName: 'Agent1', status: 'Live', startedAt: '2025-01-01' },
    { id: 's2', organizationName: 'Org1', agentName: 'Agent2', status: 'Queued', startedAt: null },
  ];

  const mockOrgs: OrganizationDto[] = [
    { id: 'org1', organizationName: 'Test Org' } as OrganizationDto,
  ];

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('SupportHubDataService', ['getSessions', 'createSession', 'requestScreenView']);
    orgService = jasmine.createSpyObj('OrganizationService', ['getAllOrganizations']);
    auth = jasmine.createSpyObj<Auth>('Auth', [], { currentUser: null });
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    dataService.getSessions.and.returnValue(of(mockSessions));
    dataService.createSession.and.returnValue(of(mockSessions[0]));
    orgService.getAllOrganizations.and.returnValue(of(mockOrgs));

    await TestBed.configureTestingModule({
      imports: [SupportHubSessionsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SupportHubDataService, useValue: dataService },
        { provide: OrganizationService, useValue: orgService },
        { provide: Auth, useValue: auth },
        { provide: ChangeDetectorRef, useValue: cdr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubSessionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads sessions and organizations on init', () => {
    fixture.detectChanges();

    expect(dataService.getSessions).toHaveBeenCalled();
    expect(orgService.getAllOrganizations).toHaveBeenCalled();
    expect(component.sessions.length).toBe(2);
    expect(component.isLoading).toBe(false);
  });

  it('sets isLoading false on session load error', () => {
    dataService.getSessions.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
  });

  it('sets default selectedOrganizationId from first org', () => {
    fixture.detectChanges();
    expect(component.selectedOrganizationId).toBe('org1');
  });

  it('createSession does nothing if no organizationId', () => {
    fixture.detectChanges();
    component.selectedOrganizationId = '';
    component.createSession();

    expect(dataService.createSession).not.toHaveBeenCalled();
  });

  it('createSession does nothing if agentName is empty', () => {
    fixture.detectChanges();
    component.selectedOrganizationId = 'org1';
    component.newAgentName = '  ';
    component.createSession();

    expect(dataService.createSession).not.toHaveBeenCalled();
  });

  it('createSession calls service and reloads', () => {
    fixture.detectChanges();
    component.selectedOrganizationId = 'org1';
    component.newAgentName = 'Agent Test';
    component.newStatus = 'Queued';

    component.createSession();

    expect(dataService.createSession).toHaveBeenCalledWith({
      organizationId: 'org1',
      agentName: 'Agent Test',
      status: 'Queued',
    });
  });

  it('assignToMe uses currentUser email when available', () => {
    Object.defineProperty(auth, 'currentUser', { value: { email: 'admin@test.com' }, configurable: true });
    component.assignToMe();

    expect(component.newAgentName).toBe('admin@test.com');
  });

  it('assignToMe falls back to default when no email', () => {
    Object.defineProperty(auth, 'currentUser', { value: { email: null }, configurable: true });
    component.assignToMe();

    expect(component.newAgentName).toBeTruthy();
  });

  it('openOrgModal sets isOrgModalOpen and clears search', () => {
    component.orgSearchTerm = 'abc';
    component.openOrgModal();

    expect(component.isOrgModalOpen).toBe(true);
    expect(component.orgSearchTerm).toBe('');
  });

  it('selectOrganization sets id and closes modal', () => {
    component.isOrgModalOpen = true;
    component.selectOrganization(mockOrgs[0]);

    expect(component.selectedOrganizationId).toBe('org1');
    expect(component.isOrgModalOpen).toBe(false);
  });

  it('onViewScreen prevents concurrent calls', () => {
    dataService.requestScreenView.and.returnValue(of({ sessionId: 's1', viewerUrl: 'https://screen.test' }));
    component.viewingSessionId = 'other';
    component.onViewScreen('s1');

    expect(dataService.requestScreenView).not.toHaveBeenCalled();
  });
});
