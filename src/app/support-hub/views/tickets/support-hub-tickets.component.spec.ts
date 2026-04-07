import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SupportHubTicketsComponent } from './support-hub-tickets.component';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { OrganizationService } from '../../../services/shared/organization.service';
import { SupportHubTicket } from '../../models/support-hub-ticket';
import { OrganizationDto } from '../../../models/organization';
import { TranslateModule } from '@ngx-translate/core';

describe('SupportHubTicketsComponent', () => {
  let component: SupportHubTicketsComponent;
  let fixture: ComponentFixture<SupportHubTicketsComponent>;
  let dataService: jasmine.SpyObj<SupportHubDataService>;
  let orgService: jasmine.SpyObj<OrganizationService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockTickets: SupportHubTicket[] = [
    { id: '1', title: 'Server down', status: 'Urgent', organizationName: 'Org1', createdAt: '2025-01-01T00:00:00Z' },
    { id: '2', title: 'UI bug', status: 'Normal', organizationName: 'Org1', createdAt: '2025-01-02T00:00:00Z' },
  ];

  const mockOrgs: OrganizationDto[] = [
    { id: 'org1', organizationName: 'Test Org' } as OrganizationDto,
  ];

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('SupportHubDataService', ['getTickets', 'createTicket', 'seedDemo']);
    orgService = jasmine.createSpyObj('OrganizationService', ['getAllOrganizations']);
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    dataService.getTickets.and.returnValue(of(mockTickets));
    dataService.createTicket.and.returnValue(of(mockTickets[0]));
    orgService.getAllOrganizations.and.returnValue(of(mockOrgs));

    await TestBed.configureTestingModule({
      imports: [SupportHubTicketsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: SupportHubDataService, useValue: dataService },
        { provide: OrganizationService, useValue: orgService },
        { provide: ChangeDetectorRef, useValue: cdr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubTicketsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads tickets and organizations on init', () => {
    fixture.detectChanges();

    expect(dataService.getTickets).toHaveBeenCalled();
    expect(orgService.getAllOrganizations).toHaveBeenCalled();
    expect(component.tickets.length).toBe(2);
    expect(component.isLoading).toBe(false);
  });

  it('sets isLoading false on ticket load error', () => {
    dataService.getTickets.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
  });

  it('sets default selectedOrganizationId from first org', () => {
    fixture.detectChanges();
    expect(component.selectedOrganizationId).toBe('org1');
  });

  it('createTicket does nothing if no organizationId', () => {
    fixture.detectChanges();
    component.selectedOrganizationId = '';
    component.createTicket();

    expect(dataService.createTicket).not.toHaveBeenCalled();
  });

  it('createTicket does nothing if title is empty', () => {
    fixture.detectChanges();
    component.selectedOrganizationId = 'org1';
    component.newTitle = '   ';
    component.createTicket();

    expect(dataService.createTicket).not.toHaveBeenCalled();
  });

  it('createTicket calls service and reloads', () => {
    fixture.detectChanges();
    component.selectedOrganizationId = 'org1';
    component.newTitle = 'New ticket';
    component.newSummary = 'Details';
    component.newStatus = 'High';

    component.createTicket();

    expect(dataService.createTicket).toHaveBeenCalledWith({
      organizationId: 'org1',
      title: 'New ticket',
      summary: 'Details',
      status: 'High',
    });
  });

  it('createdAtAccessor formats date', () => {
    const result = component.createdAtAccessor('', { createdAt: '2025-06-15T12:00:00Z' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('—');
  });

  it('createdAtAccessor returns dash for null', () => {
    const result = component.createdAtAccessor('', { createdAt: null });
    expect(result).toBe('—');
  });

  it('filteredOrganizations returns all when search is empty', () => {
    fixture.detectChanges();
    component.orgSearchTerm = '';
    expect(component.filteredOrganizations.length).toBe(1);
  });

  it('getTicketStatusClass returns correct classes', () => {
    expect(component.getTicketStatusClass('Urgent')).toContain('urgent');
    expect(component.getTicketStatusClass('Resolved')).toContain('resolved');
    expect(component.getTicketStatusClass('Normal')).toContain('normal');
  });
});
