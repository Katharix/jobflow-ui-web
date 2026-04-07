import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SupportHubDashboardComponent } from './support-hub-dashboard.component';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { OrganizationService } from '../../../services/shared/organization.service';
import { HelpContentService } from '../../../services/shared/help-content.service';
import { SupportHubTicket } from '../../models/support-hub-ticket';
import { SupportHubSession } from '../../models/support-hub-session';
import { HelpArticle, ChangelogEntry } from '../../../models/help-content';
import { OrganizationDto } from '../../../models/organization';

describe('SupportHubDashboardComponent', () => {
  let component: SupportHubDashboardComponent;
  let fixture: ComponentFixture<SupportHubDashboardComponent>;
  let dataService: jasmine.SpyObj<SupportHubDataService>;
  let orgService: jasmine.SpyObj<OrganizationService>;
  let helpService: jasmine.SpyObj<HelpContentService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockTickets: SupportHubTicket[] = [
    { id: '1', title: 'Bug', status: 'Urgent', organizationName: 'Org1', createdAt: '2025-01-01T00:00:00Z' },
    { id: '2', title: 'Feature', status: 'Normal', organizationName: 'Org1', createdAt: '2025-01-02T00:00:00Z' },
    { id: '3', title: 'Fixed', status: 'Resolved', organizationName: 'Org2', createdAt: '2025-01-03T00:00:00Z' },
  ];

  const mockSessions: SupportHubSession[] = [
    { id: '1', organizationName: 'Org1', agentName: 'Agent1', status: 'Live', startedAt: '2025-01-01' },
    { id: '2', organizationName: 'Org1', agentName: 'Agent2', status: 'Queued', startedAt: null },
    { id: '3', organizationName: 'Org2', agentName: 'Agent3', status: 'Ended', startedAt: '2025-01-01' },
  ];

  const mockOrgs: OrganizationDto[] = [
    { id: 'org1', organizationName: 'Test Org' } as OrganizationDto,
  ];

  const mockArticles: HelpArticle[] = [
    { id: '1', title: 'Guide', summary: null, content: 'Content', articleType: 'Guide', category: 'GettingStarted', tags: null, isFeatured: false, isPublished: true, sortOrder: 1, publishedAt: '2025-01-01', createdAt: '2025-01-01' },
    { id: '2', title: 'Draft', summary: null, content: 'Draft', articleType: 'Faq', category: 'Jobs', tags: null, isFeatured: false, isPublished: false, sortOrder: 2, publishedAt: null, createdAt: '2025-01-02' },
  ];

  const mockChangelog: ChangelogEntry[] = [
    { id: '1', title: 'Release', description: null, version: '1.0', category: 'Feature', isPublished: true, publishedAt: '2025-01-01', createdAt: '2025-01-01' },
  ];

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('SupportHubDataService', ['getTickets', 'getSessions']);
    orgService = jasmine.createSpyObj('OrganizationService', ['getAllOrganizations']);
    helpService = jasmine.createSpyObj('HelpContentService', ['getAllArticles', 'getAllChangelog']);
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    dataService.getTickets.and.returnValue(of(mockTickets));
    dataService.getSessions.and.returnValue(of(mockSessions));
    orgService.getAllOrganizations.and.returnValue(of(mockOrgs));
    helpService.getAllArticles.and.returnValue(of(mockArticles));
    helpService.getAllChangelog.and.returnValue(of(mockChangelog));

    await TestBed.configureTestingModule({
      imports: [SupportHubDashboardComponent],
      providers: [
        { provide: SupportHubDataService, useValue: dataService },
        { provide: OrganizationService, useValue: orgService },
        { provide: HelpContentService, useValue: helpService },
        { provide: ChangeDetectorRef, useValue: cdr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads all data on init via forkJoin', () => {
    fixture.detectChanges();

    expect(dataService.getTickets).toHaveBeenCalled();
    expect(dataService.getSessions).toHaveBeenCalled();
    expect(orgService.getAllOrganizations).toHaveBeenCalled();
    expect(helpService.getAllArticles).toHaveBeenCalled();
    expect(helpService.getAllChangelog).toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
    expect(component.tickets.length).toBe(3);
    expect(component.sessions.length).toBe(3);
    expect(component.organizations.length).toBe(1);
    expect(component.articles.length).toBe(2);
    expect(component.changelog.length).toBe(1);
  });

  it('computes openTickets excluding Resolved', () => {
    fixture.detectChanges();
    expect(component.openTickets).toBe(2);
  });

  it('computes urgentTickets', () => {
    fixture.detectChanges();
    expect(component.urgentTickets).toBe(1);
  });

  it('computes liveSessions', () => {
    fixture.detectChanges();
    expect(component.liveSessions).toBe(1);
  });

  it('computes queuedSessions', () => {
    fixture.detectChanges();
    expect(component.queuedSessions).toBe(1);
  });

  it('computes publishedArticles', () => {
    fixture.detectChanges();
    expect(component.publishedArticles).toBe(1);
  });

  it('returns recentTickets sorted by createdAt descending', () => {
    fixture.detectChanges();
    const recent = component.recentTickets;
    expect(recent[0].id).toBe('3');
    expect(recent[recent.length - 1].id).toBe('1');
  });

  it('returns activeSessions filtering Live and Queued', () => {
    fixture.detectChanges();
    expect(component.activeSessions.length).toBe(2);
    expect(component.activeSessions.every(s => s.status === 'Live' || s.status === 'Queued')).toBe(true);
  });

  it('handles individual observable failure via catchError', () => {
    dataService.getTickets.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(component.tickets).toEqual([]);
    expect(component.sessions.length).toBe(3);
  });

  it('sets isLoading false on forkJoin error', () => {
    dataService.getTickets.and.returnValue(throwError(() => new Error('fail')));
    dataService.getSessions.and.returnValue(throwError(() => new Error('fail')));
    orgService.getAllOrganizations.and.returnValue(throwError(() => new Error('fail')));
    helpService.getAllArticles.and.returnValue(throwError(() => new Error('fail')));
    helpService.getAllChangelog.and.returnValue(throwError(() => new Error('fail')));

    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(component.tickets).toEqual([]);
  });

  it('returns correct status classes', () => {
    expect(component.getStatusClass('Urgent')).toContain('sh-badge--red');
    expect(component.getStatusClass('Live')).toContain('sh-badge--green');
    expect(component.getStatusClass('Queued')).toContain('sh-badge--blue');
    expect(component.getStatusClass('unknown')).toContain('sh-badge--gray');
  });
});
