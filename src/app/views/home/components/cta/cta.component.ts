import { Component } from '@angular/core';
import { BrevoListEnum, NewsletterRequest } from '../../../../models/newsletter-request';
import { EmailService } from '../../services/email.service';
import { FormsModule } from '@angular/forms';
import { RecaptchaModule } from 'ng-recaptcha';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [FormsModule, CommonModule, RecaptchaModule],
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss'
})
export class CtaComponent {
  email: string = '';
  isSubmitting = false;
  success = false;
  error = false;

  constructor(private emailService: EmailService) { }

  onSubmit() {
    if (!this.email) return;

    const payload: NewsletterRequest = {
      email: this.email,
      listId: BrevoListEnum.Newsletter
    };

    this.isSubmitting = true;

    this.emailService.subscribeToNewsletter(payload).subscribe({
      next: () => {
        this.success = true;
        this.error = false;
        this.email = '';
        this.isSubmitting = false;
        setTimeout(() => this.success = false, 5000);
      },
      error: () => {
        this.success = false;
        this.error = true;
        this.isSubmitting = false;
        setTimeout(() => this.error = false, 5000);
      }
    });
  }
}
