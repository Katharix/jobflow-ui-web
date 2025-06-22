import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideAuth,
  initializeAuth
} from '@angular/fire/auth';
import {
  browserLocalPersistence
} from 'firebase/auth'; // ✅ persistence constant comes from firebase/auth
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from './firebase-config';

export const firebaseProviders = [
  provideFirebaseApp(() => initializeApp(firebaseConfig)),

  // ✅ Set default persistence globally
  provideAuth(() =>
    initializeAuth(getApp(), {
      persistence: browserLocalPersistence
    })
  ),

  provideFirestore(() => getFirestore())
];
