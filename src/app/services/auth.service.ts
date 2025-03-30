import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { BaseApiService } from './base-api.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authUrl: string;
  constructor(private auth: Auth, private api: BaseApiService) {
    this.authUrl = 'auth/';
  }

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
    return this.api.post<{ email: string }>(`${this.authUrl}login-with-firebase`, {
      token: idToken
    });
  }
  
  get currentUser() {
    return this.auth.currentUser;
  }
}
