import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let auth: jasmine.SpyObj<Auth>;
  let router: jasmine.SpyObj<Router>;

  function makeRoute(roles: string[] = []): ActivatedRouteSnapshot {
    return { data: { roles } } as unknown as ActivatedRouteSnapshot;
  }

  function makeState(url = '/support-hub/dashboard'): RouterStateSnapshot {
    return { url } as RouterStateSnapshot;
  }

  beforeEach(() => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['authStateReady'], { currentUser: null });
    auth.authStateReady.and.returnValue(Promise.resolve());

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('waits for authStateReady before checking user', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard(makeRoute(), makeState())
    );

    expect(auth.authStateReady).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('redirects to login when no user is signed in', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard(makeRoute(), makeState('/support-hub'))
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/support-hub' }
    });
  });

  it('allows access when user has matching role', async () => {
    const mockUser = {
      getIdTokenResult: jasmine.createSpy('getIdTokenResult').and.returnValue(
        Promise.resolve({ claims: { role: 'KatharixAdmin' } })
      )
    };
    Object.defineProperty(auth, 'currentUser', { value: mockUser });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(makeRoute(['KatharixAdmin', 'KatharixEmployee']), makeState())
    );

    expect(result).toBe(true);
  });

  it('allows access when no roles are required', async () => {
    const mockUser = {
      getIdTokenResult: jasmine.createSpy('getIdTokenResult').and.returnValue(
        Promise.resolve({ claims: { role: 'AnyRole' } })
      )
    };
    Object.defineProperty(auth, 'currentUser', { value: mockUser });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(makeRoute([]), makeState())
    );

    expect(result).toBe(true);
  });

  it('redirects to unauthorized when role does not match', async () => {
    const mockUser = {
      getIdTokenResult: jasmine.createSpy('getIdTokenResult').and.returnValue(
        Promise.resolve({ claims: { role: 'OrgAdmin' } })
      )
    };
    Object.defineProperty(auth, 'currentUser', { value: mockUser, configurable: true });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(makeRoute(['KatharixAdmin']), makeState())
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('redirects to login when getIdTokenResult throws', async () => {
    const mockUser = {
      getIdTokenResult: jasmine.createSpy('getIdTokenResult').and.returnValue(
        Promise.reject(new Error('Token error'))
      )
    };
    Object.defineProperty(auth, 'currentUser', { value: mockUser });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(makeRoute(['KatharixAdmin']), makeState('/some-page'))
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/some-page' }
    });
  });

  it('treats missing role claim as empty string', async () => {
    const mockUser = {
      getIdTokenResult: jasmine.createSpy('getIdTokenResult').and.returnValue(
        Promise.resolve({ claims: {} })
      )
    };
    Object.defineProperty(auth, 'currentUser', { value: mockUser, configurable: true });

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(makeRoute(['KatharixAdmin']), makeState())
    );

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });
});
