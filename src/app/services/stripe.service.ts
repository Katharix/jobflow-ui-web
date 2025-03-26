import { Injectable } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { BaseApiService } from './base-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private stripePromise = loadStripe('pk_test_YourPublicKey');
  apiBaseUrl: string = ''
  constructor(private baseApiService: BaseApiService) {
    this.apiBaseUrl = 'stripe/'
  }

  async createConnectedAccount(): Promise<string> {
    const res = await firstValueFrom(this.baseApiService.post<{ accountId: string }>(
      `${this.apiBaseUrl}create`, {}
    ));
    return res.accountId;
  }

  async generateAccountLink(accountId: string): Promise<string> {
    const res = await firstValueFrom(this.baseApiService.post<{ url: string }>(
      `${this.apiBaseUrl}generate-account-link`, { account: accountId }
    ));
    return res.url;
  }

  async getStripe(): Promise<Stripe | null> {
    return await this.stripePromise;
  }
}
