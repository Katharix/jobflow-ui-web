import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {Auth} from '@angular/fire/auth';

export const authGuard: CanActivateFn = async (route, state) => {
   const auth = inject(Auth);
   const router = inject(Router);

   const allowedRoles: string[] = route.data?.['roles'] ?? [];

   // Wait for Firebase to finish restoring the persisted session
   await auth.authStateReady();

   const user = auth.currentUser;

   if (!user) {
      await router.navigate(['/auth/login'], {
         queryParams: {returnUrl: state.url}
      });
      return false;
   }

   try {
      const idTokenResult = await user.getIdTokenResult(true);
      const roleClaim = idTokenResult.claims['role'];
      const role = typeof roleClaim === 'string' ? roleClaim : '';

      if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
         return true;
      }

      await router.navigate(['/unauthorized']);
      return false;
   } catch {
      await router.navigate(['/auth/login'], {
         queryParams: {returnUrl: state.url}
      });
      return false;
   }
};
