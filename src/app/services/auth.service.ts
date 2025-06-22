import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth'; // ✅ All from AngularFire

@Injectable({ providedIn: 'root' })
export class AuthService {
  authUrl = 'auth/';

  constructor(private auth: Auth, private api: BaseApiService) {}

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
