import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserSessionService } from '../services/user-session.service'; // adjust path as needed

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const db = inject(Firestore);
  const router = inject(Router);
  const session = inject(UserSessionService);

  const allowedRoles = route.data?.['roles'] || [];

  return new Promise<boolean>((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user || session.isSessionExpired()) {
        session.clearSession(); // remove token + keys
        router.navigate(['/auth/login']);
        return resolve(false);
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDoc);

      if (!userSnap.exists()) {
        session.clearSession();
        router.navigate(['/auth/login']);
        return resolve(false);
      }

      const userRole = userSnap.data()['role'];

      if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
        return resolve(true);
      }

      router.navigate(['/unauthorized']);
      resolve(false);
    });
  });
};
