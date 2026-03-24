import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-support-hub-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './support-hub-login.component.html',
  styleUrl: './support-hub-login.component.scss',
})
export class SupportHubLoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);

  @ViewChild('form') form?: NgForm;

  email = '';
  password = '';
  error = '';
  submitted = false;
  isSubmitting = false;

  onLogin(event: Event) {
    event.preventDefault();
    this.login();
  }

  async login() {
    this.error = '';
    this.submitted = true;

    if (this.form?.invalid) {
      this.form.control.markAllAsTouched();
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      await signInWithEmailAndPassword(this.auth, this.email.trim(), this.password.trim());
      await this.router.navigate(['/support-hub/dashboard']);
    } catch (err: unknown) {
      this.error = this.mapFirebaseAuthError(err);
      this.isSubmitting = false;
    }
  }

  private mapFirebaseAuthError(error: unknown): string {
    const maybeError = error as { code?: string; message?: string } | null;
    const code = maybeError?.code;
    if (!code) {
      return maybeError?.message || 'Something went wrong. Please try again.';
    }

    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found for this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again.';
      default:
        return maybeError?.message || 'Something went wrong. Please try again.';
    }
  }
}
