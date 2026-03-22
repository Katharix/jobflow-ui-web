
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalRef } from '../../../common/modal/modal-ref';
import { MODAL_DATA } from '../../../common/modal/modal.tokens';
import { ToastService } from '../../../common/toast/toast.service';
import { ClientHubAuthService } from '../../services/client-hub-auth.service';
import { EstimateRevisionApi } from '../../services/estimate-revision-api';
import { EstimateRevisionRequestDto } from '../../models/client-hub.models';

export interface EstimateRevisionFormData {
  estimateId: string;
  estimateNumber?: string | null;
}

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

@Component({
    selector: 'app-estimate-revision-form',
    imports: [FormsModule],
    templateUrl: './estimate-revision-form.component.html',
    styleUrl: './estimate-revision-form.component.scss'
})
export class EstimateRevisionFormComponent {
  private readonly ref = inject<ModalRef<EstimateRevisionRequestDto>>(ModalRef);
  data = inject<EstimateRevisionFormData>(MODAL_DATA);

  private readonly api = inject(EstimateRevisionApi);
  private readonly auth = inject(ClientHubAuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  message = '';
  attachments: File[] = [];
  validationErrors: string[] = [];
  submitError: string | null = null;
  isSubmitting = false;

  close(): void {
    this.ref._close();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const incoming = Array.from(input.files);
    const combined = [...this.attachments, ...incoming];

    this.validationErrors = [];
    this.attachments = [];

    if (combined.length > MAX_FILES) {
      this.validationErrors.push(`You can attach up to ${MAX_FILES} files.`);
    }

    combined.slice(0, MAX_FILES).forEach((file) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        this.validationErrors.push(`${file.name} has an unsupported file type.`);
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        this.validationErrors.push(`${file.name} exceeds the 10MB size limit.`);
        return;
      }

      this.attachments.push(file);
    });

    input.value = '';
  }

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  submit(form: NgForm): void {
    if (this.isSubmitting) {
      return;
    }

    this.submitError = null;
    this.validationErrors = [];

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.message.trim()) {
      this.validationErrors.push('Message is required.');
      return;
    }

    if (this.attachments.length > MAX_FILES) {
      this.validationErrors.push(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    if (!this.data?.estimateId) {
      this.submitError = 'Estimate identifier is missing.';
      return;
    }

    this.isSubmitting = true;

    this.api
      .createRevisionRequest(this.data.estimateId, this.message.trim(), this.attachments)
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          this.toast.success('Revision request submitted.');
          this.ref._close(result);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;

          if (error.status === 401 || error.status === 403) {
            this.auth.handleUnauthorized(this.router, `/client-hub/estimates/${this.data.estimateId}`);
            this.ref._close();
            return;
          }

          switch (error.status) {
            case 400:
              this.submitError = 'Please check your message and attachments.';
              break;
            case 404:
              this.submitError = 'This estimate could not be found.';
              break;
            case 409:
              this.submitError = 'A revision request is already in progress.';
              break;
            default:
              this.submitError = 'Unable to submit your revision request right now.';
              break;
          }
        },
      });
  }

  formatFileSize(bytes: number): string {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
