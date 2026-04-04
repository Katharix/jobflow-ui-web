import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthRedirectGuard implements CanActivate {
  private router = inject(Router);
  private auth = inject(Auth);

  canActivate(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
        unsubscribe();

        if (user) {
          await this.router.navigate(['/admin']);
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }
}
