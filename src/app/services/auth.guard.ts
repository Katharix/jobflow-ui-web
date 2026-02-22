import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';
import {Firestore, doc, getDoc} from '@angular/fire/firestore';

export const authGuard: CanActivateFn = (route, state) => {
   const auth = inject(Auth);
   const db = inject(Firestore);
   const router = inject(Router);

   const allowedRoles: string[] = route.data?.['roles'] ?? [];

   return new Promise<boolean>((resolve) => {
      onAuthStateChanged(auth, async (user) => {
         // 🔒 Not authenticated
         if (!user) {
            router.navigate(['/auth/login'], {
               queryParams: {returnUrl: state.url}
            });
            return resolve(false);
         }

         // 🔎 Load role from Firestore
         const snap = await getDoc(doc(db, 'users', user.uid));

         if (!snap.exists()) {
            router.navigate(['/auth/login']);
            return resolve(false);
         }

         const role = snap.data()?.['role'];

         // ✅ Role allowed
         if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
            return resolve(true);
         }

         // ⛔ Unauthorized
         router.navigate(['/unauthorized']);
         resolve(false);
      });
   });
};
