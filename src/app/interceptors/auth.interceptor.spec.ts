import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Auth } from '@angular/fire/auth';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<Auth>('Auth', ['authStateReady'], { currentUser: null });
    auth.authStateReady.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Auth, useValue: auth }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('waits for authStateReady before sending API requests', () => {
    http.get('https://localhost:44398/api/test').subscribe();

    expect(auth.authStateReady).toHaveBeenCalled();
  });

  it('attaches Bearer token to API requests', (done) => {
    const mockUser = {
      getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve('firebase-token-123'))
    };
    Object.defineProperty(auth, 'currentUser', { value: mockUser, configurable: true });

    http.get('https://localhost:44398/api/supporthub/tickets').subscribe(() => done());

    setTimeout(() => {
      const req = httpMock.expectOne('https://localhost:44398/api/supporthub/tickets');
      expect(req.request.headers.get('Authorization')).toBe('Bearer firebase-token-123');
      req.flush([]);
    });
  });

  it('skips client-hub requests', () => {
    http.get('https://localhost:44398/api/client-hub/data').subscribe();

    const req = httpMock.expectOne('https://localhost:44398/api/client-hub/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips client-hub-auth requests', () => {
    http.get('https://localhost:44398/api/client-hub-auth/login').subscribe();

    const req = httpMock.expectOne('https://localhost:44398/api/client-hub-auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips client-portal requests', () => {
    http.get('https://localhost:44398/api/client-portal/info').subscribe();

    const req = httpMock.expectOne('https://localhost:44398/api/client-portal/info');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips external URLs that are not the API', () => {
    http.get('https://api.stripe.com/v1/charges').subscribe();

    const req = httpMock.expectOne('https://api.stripe.com/v1/charges');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('skips requests that already have an Authorization header', () => {
    http.get('https://localhost:44398/api/test', {
      headers: { Authorization: 'Bearer existing-token' }
    }).subscribe();

    const req = httpMock.expectOne('https://localhost:44398/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer existing-token');
    req.flush({});
  });

  it('sends request without token when currentUser is null', (done) => {
    Object.defineProperty(auth, 'currentUser', { value: null, configurable: true });

    http.get('https://localhost:44398/api/organizations/all').subscribe(() => done());

    setTimeout(() => {
      const req = httpMock.expectOne('https://localhost:44398/api/organizations/all');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush([]);
    });
  });

  it('sends request without token when getIdToken returns null', (done) => {
    const mockUser = {
      getIdToken: jasmine.createSpy('getIdToken').and.returnValue(Promise.resolve(null))
    };
    Object.defineProperty(auth, 'currentUser', { value: mockUser, configurable: true });

    http.get('https://localhost:44398/api/test').subscribe(() => done());

    setTimeout(() => {
      const req = httpMock.expectOne('https://localhost:44398/api/test');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });
});
