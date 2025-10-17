import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthRedirectGuard implements CanActivate {
  private router = inject(Router);
  private auth = inject(Auth); // ✅ safe inject (waits for provider init)

  canActivate(): boolean {
    const user = this.auth.currentUser;

    if (user) {
      this.router.navigate(['/admin']);
      return false;
    }

    return true;
  }
}
