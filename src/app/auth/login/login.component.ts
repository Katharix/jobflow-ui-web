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
         this.error = err.message;
         this.toast.error(this.error || 'Login failed.');
      }
   }


   loginWithGoogle() {
      const provider = new GoogleAuthProvider();

      signInWithPopup(this.auth, provider)
         .then(async (result) => {
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
         })
         .catch((error) => {
            console.error('Google login error:', error);
            this.error = error.message;
            this.toast.error('Google sign-in failed. Please try again.');
         });
   }

}
