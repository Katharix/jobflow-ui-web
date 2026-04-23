import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideAuth,
  initializeAuth
} from '@angular/fire/auth';
import {
  browserLocalPersistence
} from 'firebase/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from '../configs/firebase-config';

export const firebaseProviders = [
  provideFirebaseApp(() => initializeApp(firebaseConfig)),

  // Omit popupRedirectResolver here so Firebase does not load gapi.js on every
  // page initialisation. The resolver is passed directly to signInWithPopup()
  // in AuthService so it is only loaded when the user explicitly triggers
  // Google Sign-In.
  provideAuth(() =>
    initializeAuth(getApp(), {
      persistence: browserLocalPersistence
    })
  ),

  provideFirestore(() => getFirestore())
];
