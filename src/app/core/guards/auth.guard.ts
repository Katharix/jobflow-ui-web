import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';

export const authGuard: CanActivateFn = (route, state) => {
   const auth = inject(Auth);
   const router = inject(Router);

   const allowedRoles: string[] = route.data?.['roles'] ?? [];

   return new Promise<boolean>((resolve) => {
      onAuthStateChanged(auth, async (user) => {
         if (!user) {
            router.navigate(['/auth/login'], {
               queryParams: {returnUrl: state.url}
            });
            return resolve(false);
         }

         const idTokenResult = await user.getIdTokenResult(false);
         const roleClaim = idTokenResult.claims['role'];
         const role = typeof roleClaim === 'string' ? roleClaim : '';

         if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
            return resolve(true);
         }

         router.navigate(['/unauthorized']);
         resolve(false);
      });
   });
};
