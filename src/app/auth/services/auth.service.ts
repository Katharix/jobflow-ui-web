import { inject, Injectable } from '@angular/core';
import { BaseApiService } from '../../services/shared/base-api.service';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  signInWithPopup as firebaseSignInWithPopup,
  UserCredential
} from 'firebase/auth';
import { OrganizationDto } from '../../models/organization';

interface LoginWithFirebaseResponse {
  organization: OrganizationDto;
}

interface BackendProblemDetails {
  title?: string;
  detail?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  authUrl = 'auth/';
  private api = inject(BaseApiService);

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  loginWithGoogle(): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return firebaseSignInWithPopup(this.auth, provider, browserPopupRedirectResolver);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return this.auth.signOut();
  }

  async deleteCurrentUser(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      await user.delete();
    }
  }

  loginWithFirebase(idToken: string) {
    return this.api.post<LoginWithFirebaseResponse>(`${this.authUrl}login-with-firebase`, { token: idToken });
  }

  async getCurrentUserIdToken(forceRefresh = false): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No current user found.');
    }

    return currentUser.getIdToken(forceRefresh);
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  getBackendErrorMessage(error: unknown, fallbackMessage: string): string {
    const maybeHttpError = error as {
      error?: BackendProblemDetails | string;
    } | null;

    if (!maybeHttpError) {
      return fallbackMessage;
    }

    if (typeof maybeHttpError.error === 'string' && maybeHttpError.error.trim()) {
      return maybeHttpError.error;
    }

    const errorBody = maybeHttpError.error;
    if (errorBody && typeof errorBody === 'object' && 'detail' in errorBody && typeof errorBody.detail === 'string') {
      return errorBody.detail;
    }

    if (errorBody && typeof errorBody === 'object' && 'title' in errorBody && typeof errorBody.title === 'string') {
      return errorBody.title;
    }

    return fallbackMessage;
  }
}
