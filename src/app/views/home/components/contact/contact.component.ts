import { Component } from '@angular/core';
import { ContactFormRequest } from '../../../../models/contact-form-request';
import { FormsModule } from '@angular/forms';
import { EmailService } from '../../../../services/email.service';
import { RecaptchaModule } from 'ng-recaptcha';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    FormsModule, 
    CommonModule,
    RecaptchaModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  model: ContactFormRequest = {
    name: '',
    email: '',
    subject: '',
    message: '',
    captchaToken: ''
  };
  
  isSubmitting = false;
  success = false;
  error = false;
  captchaToken: string | null = null;
  reCAPTCHAKey = environment.reCAPTCHASiteKey ?? environment.reCAPTCHASecretKey;

  constructor(private emailService: EmailService)
  {}
  

  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
  }

  onCaptchaExpired() {
    this.captchaToken = null;
  }

  onCaptchaError() {
    this.captchaToken = null;
  }

  onSubmit() {
    if (!this.captchaToken) return;
    this.model.captchaToken = this.captchaToken;
    this.isSubmitting = true;
    this.emailService.sendContactForm(this.model).subscribe({
      next: () => {
        this.success = true;
        this.error = false;
        this.isSubmitting = false;
        setTimeout(() => this.success = false, 5000);
      },
      error: () => {
        this.error = true;
        this.success = false;
        this.isSubmitting = false;
        setTimeout(() => this.error = false, 5000);
      }
    });
  }
}
