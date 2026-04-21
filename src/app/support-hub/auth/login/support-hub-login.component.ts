import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    MessageModule,
    TranslateModule
  ],
  templateUrl: './support-hub-login.component.html',
  styleUrl: './support-hub-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubLoginComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

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
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email.trim(), this.password.trim());
      try {
        const tokenResult = await userCredential.user.getIdTokenResult(true);
        const role = tokenResult.claims['role'] as string;
        if (role !== 'KatharixAdmin' && role !== 'KatharixEmployee') {
          await signOut(this.auth);
          this.error = 'Access denied. Only Katharix staff can access the Support Hub.';
          this.isSubmitting = false;
          this.cdr.markForCheck();
          return;
        }
      } catch {
        await signOut(this.auth);
        this.error = 'Unable to verify your access. Please try again.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return;
      }
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
      return maybeError?.message || this.translate.instant('support.login.errors.generic');
    }

    switch (code) {
      case 'auth/invalid-email':
        return this.translate.instant('support.login.errors.invalidEmail');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return this.translate.instant('support.login.errors.invalidCredentials');
      case 'auth/user-disabled':
        return this.translate.instant('support.login.errors.userDisabled');
      case 'auth/too-many-requests':
        return this.translate.instant('support.login.errors.tooManyRequests');
      case 'auth/network-request-failed':
        return this.translate.instant('support.login.errors.network');
      default:
        return maybeError?.message || this.translate.instant('support.login.errors.generic');
    }
  }
}
