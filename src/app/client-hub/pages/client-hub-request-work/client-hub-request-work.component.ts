
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../../common/toast/toast.service';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { ClientHubService } from '../../services/client-hub.service';

interface ClientHubWorkRequestFormModel {
  subject: string;
  details: string;
  preferredDate: string;
  budget: number | null;
}

@Component({
  selector: 'app-client-hub-request-work',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './client-hub-request-work.component.html',
  styleUrl: './client-hub-request-work.component.scss',
})
export class ClientHubRequestWorkComponent {
  private readonly clientHubService = inject(ClientHubService);
  private readonly clientHubAuth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  isSubmitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  model: ClientHubWorkRequestFormModel = {
    subject: '',
    details: '',
    preferredDate: '',
    budget: null,
  };

  submit(form: NgForm): void {
    if (form.invalid || this.isSubmitting) {
      form.control.markAllAsTouched();
      return;
    }

    this.error = null;
    this.successMessage = null;
    this.isSubmitting = true;

    this.clientHubService
      .requestWork({
        subject: this.model.subject.trim(),
        details: this.model.details.trim(),
        preferredDate: this.model.preferredDate || undefined,
        budget: this.model.budget ?? undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Your work request has been submitted.';
          this.toast.success(this.successMessage);
          this.model = {
            subject: '',
            details: '',
            preferredDate: '',
            budget: null,
          };
          form.resetForm(this.model);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;

          if (error.status === 401 || error.status === 403) {
            this.clientHubAuth.handleUnauthorized(this.router, '/client-hub/request-work');
            return;
          }

          if (error.status === 404 || error.status === 405) {
            this.error =
              'Work request endpoint is not enabled yet on the API. The UI is ready once the endpoint is added.';
            return;
          }

          this.error = 'Unable to submit your request right now. Please try again later.';
        },
      });
  }
}
