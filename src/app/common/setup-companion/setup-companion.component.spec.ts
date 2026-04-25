import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { SetupCompanionComponent } from './setup-companion.component';
import { SetupCompanionApiService } from '../../services/shared/setup-companion-api.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { Router } from '@angular/router';
import { OrganizationDto } from '../../models/organization';

describe('SetupCompanionComponent', () => {
  let fixture: ComponentFixture<SetupCompanionComponent>;
  let component: SetupCompanionComponent;
  let apiSpy: jasmine.SpyObj<SetupCompanionApiService>;
  let orgSubject: BehaviorSubject<OrganizationDto | null>;

  const orgWithOnboardingComplete: OrganizationDto = {
    id: 'org-1',
    organizationName: 'Test Org',
    onboardingComplete: true,
  };

  const orgOnboardingIncomplete: OrganizationDto = {
    id: 'org-1',
    organizationName: 'Test Org',
    onboardingComplete: false,
  };

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('SetupCompanionApiService', ['ask']);
    orgSubject = new BehaviorSubject<OrganizationDto | null>(null);

    await TestBed.configureTestingModule({
      imports: [SetupCompanionComponent],
      providers: [
        { provide: SetupCompanionApiService, useValue: apiSpy },
        { provide: OrganizationContextService, useValue: { org$: orgSubject.asObservable() } },
        { provide: Router, useValue: { url: '/admin/dashboard' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupCompanionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Visibility ────────────────────────────────────────────────────────────

  describe('visibility', () => {
    it('is hidden when org$ emits null', () => {
      orgSubject.next(null);
      expect(component.visible()).toBeFalse();
    });

    it('is hidden when onboardingComplete is false', () => {
      orgSubject.next(orgOnboardingIncomplete);
      expect(component.visible()).toBeFalse();
    });

    it('is hidden when org has no id', () => {
      orgSubject.next({ onboardingComplete: true });
      expect(component.visible()).toBeFalse();
    });

    it('is visible when org has id and onboardingComplete is true', () => {
      orgSubject.next(orgWithOnboardingComplete);
      expect(component.visible()).toBeTrue();
    });
  });

  // ── FAB toggle ────────────────────────────────────────────────────────────

  describe('toggle()', () => {
    it('opens the panel', () => {
      component.toggle();
      expect(component.isOpen()).toBeTrue();
    });

    it('closes the panel when already open', () => {
      component.toggle();
      component.toggle();
      expect(component.isOpen()).toBeFalse();
    });

    it('seeds the assistant greeting on first open', () => {
      component.toggle();
      expect(component.messages().length).toBe(1);
      expect(component.messages()[0].role).toBe('assistant');
    });

    it('does not re-seed the greeting on subsequent opens', () => {
      component.toggle(); // opens, seeds greeting
      component.toggle(); // closes
      component.toggle(); // re-opens
      expect(component.messages().length).toBe(1);
    });
  });

  // ── Close button ──────────────────────────────────────────────────────────

  describe('close()', () => {
    it('closes the panel', () => {
      component.toggle();
      component.close();
      expect(component.isOpen()).toBeFalse();
    });

    it('retains messages after close so the conversation persists on re-open', () => {
      component.toggle();
      const greetingCount = component.messages().length;
      component.close();
      component.toggle();
      expect(component.messages().length).toBe(greetingCount);
    });
  });

  // ── send() ────────────────────────────────────────────────────────────────

  describe('send()', () => {
    beforeEach(() => {
      component.toggle(); // open to seed greeting
    });

    it('does nothing when inputText is empty', () => {
      component.inputText = '   ';
      component.send();
      expect(apiSpy.ask).not.toHaveBeenCalled();
    });

    it('does nothing when already loading', () => {
      component.inputText = 'Hello?';
      component.isLoading.set(true);
      component.send();
      expect(apiSpy.ask).not.toHaveBeenCalled();
    });

    it('clears input and appends the user message immediately', fakeAsync(() => {
      apiSpy.ask.and.returnValue(of({ answer: 'OK' }));
      component.inputText = 'How do I add a service?';
      component.send();
      tick(50);

      const userMsg = component.messages().find(m => m.role === 'user');
      expect(userMsg?.text).toBe('How do I add a service?');
      expect(component.inputText).toBe('');
    }));

    it('appends the assistant reply on success', fakeAsync(() => {
      apiSpy.ask.and.returnValue(of({ answer: 'Go to Settings > Services.' }));
      component.inputText = 'Where are services?';
      component.send();
      tick(50);

      const msgs = component.messages();
      const reply = msgs[msgs.length - 1];
      expect(reply.role).toBe('assistant');
      expect(reply.text).toBe('Go to Settings > Services.');
    }));

    it('clears isLoading after a successful reply', fakeAsync(() => {
      apiSpy.ask.and.returnValue(of({ answer: 'Done' }));
      component.inputText = 'Test question';
      component.send();
      tick(50);

      expect(component.isLoading()).toBeFalse();
    }));

    it('appends a rate-limit message on 429', fakeAsync(() => {
      apiSpy.ask.and.returnValue(throwError(() => ({ status: 429 })));
      component.inputText = 'Question';
      component.send();
      tick(50);

      expect(component.rateLimited()).toBeTrue();
      const last = component.messages().at(-1);
      expect(last?.role).toBe('assistant');
      expect(last?.text).toContain('hourly question limit');
    }));

    it('clears isLoading after a 429 error', fakeAsync(() => {
      apiSpy.ask.and.returnValue(throwError(() => ({ status: 429 })));
      component.inputText = 'Question';
      component.send();
      tick(50);

      expect(component.isLoading()).toBeFalse();
    }));

    it('appends a generic error message on non-429 failure', fakeAsync(() => {
      apiSpy.ask.and.returnValue(throwError(() => ({ status: 500 })));
      component.inputText = 'Question';
      component.send();
      tick(50);

      const last = component.messages().at(-1);
      expect(last?.role).toBe('assistant');
      expect(last?.text).toContain('Something went wrong');
      expect(component.rateLimited()).toBeFalse();
    }));

    it('passes the current route to the API', fakeAsync(() => {
      apiSpy.ask.and.returnValue(of({ answer: 'OK' }));
      component.inputText = 'Question';
      component.send();
      tick(50);

      expect(apiSpy.ask).toHaveBeenCalledWith(
        jasmine.objectContaining({ currentRoute: '/admin/dashboard' })
      );
    }));
  });

  // ── handleKeydown() ───────────────────────────────────────────────────────

  describe('handleKeydown()', () => {
    beforeEach(() => {
      component.toggle();
      apiSpy.ask.and.returnValue(of({ answer: 'OK' }));
    });

    it('submits on Enter without Shift', fakeAsync(() => {
      component.inputText = 'Submit me';
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
      spyOn(event, 'preventDefault');
      component.handleKeydown(event);
      tick(50);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiSpy.ask).toHaveBeenCalled();
    }));

    it('does not submit on Shift+Enter', () => {
      component.inputText = 'New line here';
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      spyOn(event, 'preventDefault');
      component.handleKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(apiSpy.ask).not.toHaveBeenCalled();
    });

    it('does not submit on other keys', () => {
      component.inputText = 'Typing…';
      const event = new KeyboardEvent('keydown', { key: 'a' });
      component.handleKeydown(event);
      expect(apiSpy.ask).not.toHaveBeenCalled();
    });
  });
});
