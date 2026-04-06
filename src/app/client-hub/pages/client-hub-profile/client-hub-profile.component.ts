
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../common/toast/toast.service';
import { UpdateClientHubProfileRequest } from '../../models/client-hub.models';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';

@Component({
  selector: 'app-client-hub-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-hub-profile.component.html',
  styleUrl: './client-hub-profile.component.scss',
})
export class ClientHubProfileComponent implements OnInit {
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isSaving = false;
  error: string | null = null;

  model: UpdateClientHubProfileRequest = {
    firstName: '',
    lastName: '',
    emailAddress: '',
    phoneNumber: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
  };

  ngOnInit(): void {
    this.load();
  }

  save(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;

    this.clientHubService.updateMe(this.model).subscribe({
      next: (updated) => {
        this.model = {
          firstName: updated.firstName ?? '',
          lastName: updated.lastName ?? '',
          emailAddress: updated.emailAddress ?? '',
          phoneNumber: updated.phoneNumber ?? '',
          address1: updated.address1 ?? '',
          address2: updated.address2 ?? '',
          city: updated.city ?? '',
          state: updated.state ?? '',
          zipCode: updated.zipCode ?? '',
        };

        this.isSaving = false;
        this.toast.success('Your profile has been updated.');
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.handleAuthError(error, 'Unable to save your profile changes right now.');
      },
    });
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;

    this.clientHubService.getMe().subscribe({
      next: (profile) => {
        this.model = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          emailAddress: profile.emailAddress ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          address1: profile.address1 ?? '',
          address2: profile.address2 ?? '',
          city: profile.city ?? '',
          state: profile.state ?? '',
          zipCode: profile.zipCode ?? '',
        };

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        this.handleAuthError(error, 'Unable to load your profile details right now.');
      },
    });
  }

  private handleAuthError(error: HttpErrorResponse, fallbackMessage: string): void {
    if (error.status === 401 || error.status === 403) {
      this.clientHubAuth.handleUnauthorized(this.router, '/client-hub/profile');
      return;
    }

    this.error = fallbackMessage;
  }
}
