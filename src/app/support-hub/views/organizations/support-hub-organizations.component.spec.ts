import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SupportHubOrganizationsComponent } from './support-hub-organizations.component';
import { OrganizationService } from '../../../services/shared/organization.service';
import { OrganizationDto } from '../../../models/organization';

describe('SupportHubOrganizationsComponent', () => {
  let component: SupportHubOrganizationsComponent;
  let fixture: ComponentFixture<SupportHubOrganizationsComponent>;
  let orgService: jasmine.SpyObj<OrganizationService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockOrgs: OrganizationDto[] = [
    { id: 'o1', organizationName: 'Alpha LLC', city: 'Denver', state: 'CO', onboardingComplete: true, subscriptionPlanName: 'Pro' } as OrganizationDto,
    { id: 'o2', organizationName: 'Beta Inc', city: undefined, state: undefined, onboardingComplete: false, subscriptionPlanName: 'Free' } as OrganizationDto,
  ];

  beforeEach(async () => {
    orgService = jasmine.createSpyObj('OrganizationService', ['getAllOrganizations']);
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    orgService.getAllOrganizations.and.returnValue(of(mockOrgs));

    await TestBed.configureTestingModule({
      imports: [SupportHubOrganizationsComponent],
      providers: [
        { provide: OrganizationService, useValue: orgService },
        { provide: ChangeDetectorRef, useValue: cdr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubOrganizationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads organizations on init', () => {
    fixture.detectChanges();

    expect(orgService.getAllOrganizations).toHaveBeenCalled();
    expect(component.organizations.length).toBe(2);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
  });

  it('sets error when organizations fail to load', () => {
    orgService.getAllOrganizations.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('Unable to load organizations.');
  });

  it('locationAccessor formats city and state', () => {
    const result = component.locationAccessor('', mockOrgs[0]);
    expect(result).toBe('Denver, CO');
  });

  it('locationAccessor returns dash when city/state are null', () => {
    const result = component.locationAccessor('', mockOrgs[1]);
    expect(result).toBe('—');
  });

  it('onboardingAccessor returns Complete when true', () => {
    expect(component.onboardingAccessor('', mockOrgs[0])).toBe('Complete');
  });

  it('onboardingAccessor returns In progress when false', () => {
    expect(component.onboardingAccessor('', mockOrgs[1])).toBe('In progress');
  });

  it('sets up 5 columns', () => {
    fixture.detectChanges();
    expect(component.columns.length).toBe(5);
  });
});
