import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';

export const authGuard: CanActivateFn = (route, state) => {
   const auth = inject(Auth);
   const router = inject(Router);

   const allowedRoles: string[] = route.data?.['roles'] ?? [];

   return new Promise<boolean>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
         unsubscribe();

         if (!user) {
            await router.navigate(['/auth/login'], {
               queryParams: {returnUrl: state.url}
            });
            resolve(false);
            return;
         }

         try {
            const idTokenResult = await user.getIdTokenResult(true);
            const roleClaim = idTokenResult.claims['role'];
            const role = typeof roleClaim === 'string' ? roleClaim : '';

            if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
               resolve(true);
               return;
            }

            await router.navigate(['/unauthorized']);
            resolve(false);
         } catch {
            await router.navigate(['/auth/login'], {
               queryParams: {returnUrl: state.url}
            });
            resolve(false);
         }
      });
   });
};
