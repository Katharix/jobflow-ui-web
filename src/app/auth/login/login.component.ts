import {CommonModule} from '@angular/common';
import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {FormsModule, NgForm} from '@angular/forms';
import {Auth, GoogleAuthProvider, signInWithPopup} from '@angular/fire/auth';
import {AuthService} from '../services/auth.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {ToastService} from '../../common/toast/toast.service';


@Component({
   selector: 'app-login',
   standalone: true,
   imports: [
      RouterLink,
      FormsModule,
      CommonModule
   ],
   templateUrl: './login.component.html',
   styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
   @ViewChild('form') form?: NgForm;

   returnUrl: any;
   email = '';
   password = '';
   error: string | null = null;
   rememberMe = true;
   submitted = false;
   isGoogleLoading = false;
   private googleTimeoutId: number | null = null;

   constructor(
      private auth: Auth,
      private router: Router,
      private route: ActivatedRoute,
      private authService: AuthService,
      private orgContext: OrganizationContextService,
      private toast: ToastService
   ) {
   }

   ngOnInit(): void {
      this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
   }

   async onLoggedin(e: Event) {
      e.preventDefault();

      this.submitted = true;
      if (this.form?.invalid) {
         this.form.control.markAllAsTouched();
         return;
      }

      try {
         // ✅ Step 1: Sign in with Firebase
         await this.authService.login(this.email, this.password);


         // ✅ Step 2: Get the ID token
         const currentUser = this.auth.currentUser;
         if (!currentUser) throw new Error('No current user found');
         const idToken = await currentUser.getIdToken();

         // ✅ Step 3: Call backend to sync/create user
         this.authService.loginWithFirebase(idToken).subscribe({
            next: (res) => {

               this.orgContext.setOrganization(res.organization);
               this.toast.success('Welcome back!', 'Signed in');
               this.router.navigate(['/admin']);
            },
            error: (err) => {
               console.error('Backend login failed:', err);
               this.error = 'Login failed on server. Please try again.';
               this.toast.error('Login failed. Please try again.');
            }
         });
      } catch (err: any) {
         this.error = this.mapFirebaseAuthError(err);
         this.toast.error(this.error || 'Login failed.');
      }
   }


   async loginWithGoogle() {
      if (this.isGoogleLoading) {
         return;
      }

      this.isGoogleLoading = true;
      this.error = null;
      const provider = new GoogleAuthProvider();
      this.startGoogleTimeout();

      try {
         const result = await signInWithPopup(this.auth, provider);
         const user = result.user;
         const idToken = await user.getIdToken(); // ✅ Step 2

         // ✅ Step 3: Call backend to create/sync user
         this.authService.loginWithFirebase(idToken).subscribe({
            next: (res) => {

               // ✅ Optional: store info
               localStorage.setItem('isLoggedin', 'true');
               if (res?.organization) {
                  this.orgContext.setOrganization(res.organization);
               }

               // ✅ Step 4: navigate
               this.toast.success('Signed in with Google', 'Success');
               this.router.navigate(['/admin']);
            },
            error: (err) => {
               console.error('Backend login error:', err);
               this.error = 'Login failed. Please try again.';
               this.toast.error('Login failed. Please try again.');
            }
         });
      } catch (error: any) {
         if (error?.code === 'auth/cancelled-popup-request') {
            return;
         }

         console.error('Google login error:', error);
         this.error = this.mapFirebaseAuthError(error);
         this.toast.error(this.error || 'Google sign-in failed. Please try again.');
      } finally {
         this.isGoogleLoading = false;
         this.clearGoogleTimeout();
      }
   }

   private startGoogleTimeout(): void {
      this.clearGoogleTimeout();
      this.googleTimeoutId = window.setTimeout(() => {
         if (!this.isGoogleLoading) {
            return;
         }

         this.isGoogleLoading = false;
         this.error = 'Google sign-in did not complete. Close the popup and try again. (code: auth/popup-timeout)';
         this.toast.error(this.error);
      }, 20000);
   }

   private clearGoogleTimeout(): void {
      if (this.googleTimeoutId !== null) {
         window.clearTimeout(this.googleTimeoutId);
         this.googleTimeoutId = null;
      }
   }

   private mapFirebaseAuthError(error: any): string {
      const code = error?.code as string | undefined;
      if (!code) {
         return error?.message || 'Something went wrong. Please try again.';
      }

      let message: string;
      switch (code) {
         case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
         case 'auth/user-not-found':
         case 'auth/wrong-password':
         case 'auth/invalid-credential':
            message = 'Incorrect email or password.';
            break;
         case 'auth/user-disabled':
            message = 'This account is disabled. Contact support for help.';
            break;
         case 'auth/too-many-requests':
            message = 'Too many attempts. Please wait a moment and try again.';
            break;
         case 'auth/popup-blocked':
            message = 'Popup blocked. Allow popups and try again.';
            break;
         case 'auth/popup-closed-by-user':
            message = 'Popup closed before sign-in completed.';
            break;
         case 'auth/cancelled-popup-request':
            message = 'Another sign-in popup is already open.';
            break;
         case 'auth/network-request-failed':
            message = 'Network error. Check your connection and try again.';
            break;
         case 'auth/operation-not-allowed':
            message = 'Google sign-in is not enabled for this project.';
            break;
         case 'auth/unauthorized-domain':
            message = 'This domain is not authorized for sign-in.';
            break;
         default:
            message = error?.message || 'Something went wrong. Please try again.';
            break;
      }

      return `${message} (code: ${code})`;
   }

}
