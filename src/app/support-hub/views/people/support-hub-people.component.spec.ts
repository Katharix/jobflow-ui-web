import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SupportHubPeopleComponent } from './support-hub-people.component';
import { SupportHubInviteService } from '../../services/support-hub-invite.service';
import { SupportHubInvite } from '../../models/support-hub-invite';

describe('SupportHubPeopleComponent', () => {
  let component: SupportHubPeopleComponent;
  let fixture: ComponentFixture<SupportHubPeopleComponent>;
  let invitesService: jasmine.SpyObj<SupportHubInviteService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockInvites: SupportHubInvite[] = [
    { id: 'i1', code: 'ABC123', role: 'KatharixAdmin', createdAt: '2025-01-01', expiresAt: '2025-02-01', redeemedAt: null },
    { id: 'i2', code: 'DEF456', role: 'KatharixEmployee', createdAt: '2025-01-02', expiresAt: '2025-02-02', redeemedAt: '2025-01-15' },
  ];

  beforeEach(async () => {
    invitesService = jasmine.createSpyObj('SupportHubInviteService', ['listInvites', 'createInvite']);
    cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    invitesService.listInvites.and.returnValue(of(mockInvites));
    invitesService.createInvite.and.returnValue(of(mockInvites[0]));

    await TestBed.configureTestingModule({
      imports: [SupportHubPeopleComponent],
      providers: [
        { provide: SupportHubInviteService, useValue: invitesService },
        { provide: ChangeDetectorRef, useValue: cdr },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubPeopleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads invites on init filtering redeemed ones', () => {
    fixture.detectChanges();

    expect(invitesService.listInvites).toHaveBeenCalled();
    expect(component.invites.length).toBe(1);
    expect(component.invites[0].code).toBe('ABC123');
    expect(component.isLoadingInvites).toBe(false);
  });

  it('sets invite error on load failure', () => {
    invitesService.listInvites.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();

    expect(component.inviteError).toBe('Unable to load invites.');
    expect(component.isLoadingInvites).toBe(false);
  });

  it('createInvite calls service and reloads', () => {
    fixture.detectChanges();
    component.newInviteRole = 'KatharixAdmin';
    component.createInvite();

    expect(invitesService.createInvite).toHaveBeenCalledWith('KatharixAdmin');
  });

  it('createInvite does nothing when already creating', () => {
    fixture.detectChanges();
    component.isCreatingInvite = true;
    component.createInvite();

    expect(invitesService.createInvite).not.toHaveBeenCalled();
  });

  it('sets invite error on create failure', () => {
    invitesService.createInvite.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    component.createInvite();

    expect(component.inviteError).toBe('Unable to create invite.');
    expect(component.isCreatingInvite).toBe(false);
  });

  it('inviteExpiryAccessor formats date', () => {
    const result = component.inviteExpiryAccessor('', { expiresAt: '2025-06-15' });
    expect(result).toBeTruthy();
    expect(result).not.toBe('—');
  });

  it('inviteExpiryAccessor returns dash for null', () => {
    const result = component.inviteExpiryAccessor('', { expiresAt: null });
    expect(result).toBe('—');
  });

  it('has static staff list with 3 members', () => {
    expect(component.staff.length).toBe(3);
  });
});
