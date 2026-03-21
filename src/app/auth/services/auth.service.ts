import { inject, Injectable } from '@angular/core';
import { BaseApiService } from '../../services/shared/base-api.service';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
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

  register(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return this.auth.signOut();
  }

  loginWithFirebase(idToken: string) {
    return this.api.post<LoginWithFirebaseResponse>(`${this.authUrl}login-with-firebase`, { token: idToken });
  }

  get currentUser() {
    return this.auth.currentUser;
  }
}
