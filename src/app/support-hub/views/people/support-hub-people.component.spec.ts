import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SupportHubPeopleComponent } from './support-hub-people.component';
import { SupportHubInviteService } from '../../services/support-hub-invite.service';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { SupportHubInvite } from '../../models/support-hub-invite';
import { SupportHubStaffMember } from '../../models/support-hub-staff';

describe('SupportHubPeopleComponent', () => {
  let component: SupportHubPeopleComponent;
  let fixture: ComponentFixture<SupportHubPeopleComponent>;
  let invitesService: jasmine.SpyObj<SupportHubInviteService>;
  let dataService: jasmine.SpyObj<SupportHubDataService>;

  const mockInvites: SupportHubInvite[] = [
    { id: 'i1', code: 'ABC123', role: 'KatharixAdmin', createdAt: '2025-01-01', expiresAt: '2025-02-01', redeemedAt: null },
    { id: 'i2', code: 'DEF456', role: 'KatharixEmployee', createdAt: '2025-01-02', expiresAt: '2025-02-02', redeemedAt: '2025-01-15' },
  ];

  const mockStaff: SupportHubStaffMember[] = [
    { id: '1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', firebaseUid: 'uid1', role: 'KatharixAdmin', createdAt: '2025-01-01', isActive: true },
  ];

  beforeEach(async () => {
    invitesService = jasmine.createSpyObj('SupportHubInviteService', ['listInvites', 'createInvite']);
    dataService = jasmine.createSpyObj('SupportHubDataService', ['getStaff', 'updateStaffRole', 'deactivateStaff']);

    invitesService.listInvites.and.returnValue(of(mockInvites));
    invitesService.createInvite.and.returnValue(of(mockInvites[0]));
    dataService.getStaff.and.returnValue(of(mockStaff));

    await TestBed.configureTestingModule({
      imports: [SupportHubPeopleComponent],
      providers: [
        { provide: SupportHubInviteService, useValue: invitesService },
        { provide: SupportHubDataService, useValue: dataService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubPeopleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads staff on init', () => {
    fixture.detectChanges();

    expect(dataService.getStaff).toHaveBeenCalled();
    expect(component.staff.length).toBe(1);
    expect(component.loadingStaff).toBe(false);
  });

  it('loads invites on init filtering redeemed ones', () => {
    fixture.detectChanges();

    expect(invitesService.listInvites).toHaveBeenCalled();
    expect(component.invites.length).toBe(1);
    expect(component.invites[0].code).toBe('ABC123');
    expect(component.loadingInvites).toBe(false);
  });

  it('handles staff load failure', () => {
    dataService.getStaff.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.staff).toEqual([]);
    expect(component.loadingStaff).toBe(false);
  });

  it('handles invite load failure', () => {
    invitesService.listInvites.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.invites).toEqual([]);
    expect(component.loadingInvites).toBe(false);
  });

  it('createInvite calls service and reloads', () => {
    fixture.detectChanges();
    component.newInviteRole = 'KatharixAdmin';
    component.createInvite();

    expect(invitesService.createInvite).toHaveBeenCalledWith('KatharixAdmin');
  });

  it('createInvite does nothing when already creating', () => {
    fixture.detectChanges();
    component.creatingInvite = true;
    component.createInvite();

    expect(invitesService.createInvite).not.toHaveBeenCalled();
  });

  it('displayName formats name correctly', () => {
    expect(component.displayName(mockStaff[0])).toBe('Admin User');
  });

  it('roleLabel returns correct label', () => {
    expect(component.roleLabel('KatharixAdmin')).toBe('Admin');
    expect(component.roleLabel('KatharixEmployee')).toBe('Employee');
  });

  it('initials returns correct initials', () => {
    expect(component.initials(mockStaff[0])).toBe('AU');
  });
});
