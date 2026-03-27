import { inject, Injectable } from '@angular/core';
import { BaseApiService } from '../../services/shared/base-api.service';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import {
  GoogleAuthProvider,
  signInWithPopup as firebaseSignInWithPopup,
  UserCredential
} from 'firebase/auth';
import { OrganizationDto } from '../../models/organization';

interface LoginWithFirebaseResponse {
  organization: OrganizationDto;
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
    return firebaseSignInWithPopup(this.auth, provider);
  }

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return this.auth.signOut();
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
}
