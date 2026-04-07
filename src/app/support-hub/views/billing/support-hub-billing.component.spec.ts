import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SupportHubBillingComponent } from './support-hub-billing.component';
import { OrganizationService } from '../../../services/shared/organization.service';
import {
  SupportHubDataService,
  SupportHubFinancialSummary,
  SupportHubPaymentEvent,
  CursorPagedResponse,
} from '../../services/support-hub-data.service';
import { OrganizationDto } from '../../../models/organization';

describe('SupportHubBillingComponent', () => {
  let component: SupportHubBillingComponent;
  let fixture: ComponentFixture<SupportHubBillingComponent>;
  let orgService: jasmine.SpyObj<OrganizationService>;
  let dataService: jasmine.SpyObj<SupportHubDataService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockOrgs: OrganizationDto[] = [
    { id: 'org1', organizationName: 'Billing Org' } as OrganizationDto,
  ];

  const mockSummary: SupportHubFinancialSummary = {
    organizationId: 'org1',
    organizationName: 'Billing Org',
    subscriptionPlan: 'Pro',
    subscriptionStatus: 'Active',
    paymentProvider: 1,
    grossCollected: 50000,
    refunded: 1000,
    netCollected: 49000,
    outstanding: 0,
    disputeCount: 1,
    invoiceCount: 10,
  };

  const emptyPage: CursorPagedResponse<SupportHubPaymentEvent> = { items: [], nextCursor: null };

  const paymentPage: CursorPagedResponse<SupportHubPaymentEvent> = {
    items: [
      { id: 'p1', eventType: 'payment', status: 'succeeded', amountPaid: 5000, currency: 'usd', paidAt: '2025-01-01' },
    ],
    nextCursor: 'cursor_abc',
  };

  beforeEach(async () => {
    orgService = jasmine.createSpyObj('OrganizationService', ['getAllOrganizations']);
    dataService = jasmine.createSpyObj('SupportHubDataService', [
      'getOrganizationFinancialSummary',
      'getOrganizationPayments',
      'getOrganizationDisputes',
    ]);
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    orgService.getAllOrganizations.and.returnValue(of(mockOrgs));
    dataService.getOrganizationFinancialSummary.and.returnValue(of(mockSummary));
    dataService.getOrganizationPayments.and.returnValue(of(paymentPage));
    dataService.getOrganizationDisputes.and.returnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      imports: [SupportHubBillingComponent],
      providers: [
        { provide: OrganizationService, useValue: orgService },
        { provide: SupportHubDataService, useValue: dataService },
        { provide: ChangeDetectorRef, useValue: cdr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubBillingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads organizations and triggers billing on init', () => {
    fixture.detectChanges();

    expect(orgService.getAllOrganizations).toHaveBeenCalled();
    expect(component.selectedOrganizationId).toBe('org1');
    expect(dataService.getOrganizationFinancialSummary).toHaveBeenCalledWith('org1');
    expect(dataService.getOrganizationPayments).toHaveBeenCalled();
    expect(dataService.getOrganizationDisputes).toHaveBeenCalled();
  });

  it('loads financial summary', () => {
    fixture.detectChanges();
    expect(component.financialSummary).toEqual(mockSummary);
  });

  it('sets loading false when organizations load empty', () => {
    orgService.getAllOrganizations.and.returnValue(of([]));
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.organizations.length).toBe(0);
  });

  it('handles organization load error', () => {
    orgService.getAllOrganizations.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.organizations).toEqual([]);
    expect(component.loading).toBe(false);
  });

  it('handles financial summary error', () => {
    dataService.getOrganizationFinancialSummary.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.financialSummary).toBeNull();
  });

  it('handles payments error', () => {
    dataService.getOrganizationPayments.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.payments).toEqual([]);
    expect(component.paymentsLoading).toBe(false);
  });

  it('handles disputes error', () => {
    dataService.getOrganizationDisputes.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.disputes).toEqual([]);
    expect(component.disputesLoading).toBe(false);
  });

  it('amountDollars converts cents to dollars', () => {
    expect(component.amountDollars(5000)).toBe(50);
    expect(component.amountDollars(0)).toBe(0);
    expect(component.amountDollars(199)).toBe(1.99);
  });

  it('canGoBackPayments is false initially', () => {
    expect(component.canGoBackPayments).toBe(false);
  });

  it('canGoBackDisputes is false initially', () => {
    expect(component.canGoBackDisputes).toBe(false);
  });

  it('loadOrganizationBilling does nothing without selectedOrganizationId', () => {
    component.selectedOrganizationId = '';
    component.loadOrganizationBilling();

    expect(dataService.getOrganizationFinancialSummary).not.toHaveBeenCalled();
  });
});
