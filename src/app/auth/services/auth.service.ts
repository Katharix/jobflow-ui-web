import { inject, Injectable } from '@angular/core';
import { BaseApiService } from '../../services/shared/base-api.service';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  authUrl = 'auth/';
  private api = inject(BaseApiService);

  constructor(private auth: Auth) {}

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
    return this.api.post<any>(`${this.authUrl}login-with-firebase`, { token: idToken });
  }

  get currentUser() {
    return this.auth.currentUser;
  }
}
