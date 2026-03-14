import { inject, Injectable } from '@angular/core';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { ContactFormRequest } from '../../../models/contact-form-request';
import { Observable } from 'rxjs';
import { NewsletterRequest } from '../../../models/newsletter-request';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  emailUrl: string;
  private api = inject(BaseApiService);

  constructor() {
    this.emailUrl = 'email/';
  }

  sendContactForm(contactRequest: ContactFormRequest): Observable<boolean> {
    return this.api.post<boolean>(`${this.emailUrl}send-contact-form`, contactRequest);
  }

  subscribeToNewsletter(newsletterRequest: NewsletterRequest): Observable<boolean> {
    return this.api.post<boolean>(`${this.emailUrl}newsletter`, newsletterRequest);
  }
}
