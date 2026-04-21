import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { SupportHubAuthService } from '../../services/support-hub-auth.service';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-support-hub-register',
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
  templateUrl: './support-hub-register.component.html',
  styleUrl: './support-hub-register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubRegisterComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  private supportHubAuth = inject(SupportHubAuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('form') form?: NgForm;

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  submitted = false;
  isSubmitting = false;

  async register() {
    this.error = '';
    this.submitted = true;

    if (this.form?.invalid) {
      this.form.control.markAllAsTouched();
      return;
    }

    if (this.password.trim() !== this.confirmPassword.trim()) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      await createUserWithEmailAndPassword(
        this.auth,
        this.email.trim(),
        this.password.trim()
      );

      await firstValueFrom(this.supportHubAuth.register());

      await this.auth.currentUser?.getIdToken(true);

      await this.router.navigate(['/support-hub/dashboard']);
    } catch (err: unknown) {
      this.error = this.mapFirebaseAuthError(err);
      this.isSubmitting = false;
      this.cdr.markForCheck();
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
      case 'auth/email-already-in-use':
        return 'That email is already in use. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 8 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-up is not enabled for this project.';
      default:
        return maybeError?.message || 'Something went wrong. Please try again.';
    }
  }

}
