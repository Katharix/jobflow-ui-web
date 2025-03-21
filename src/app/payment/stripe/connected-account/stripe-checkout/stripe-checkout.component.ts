import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-stripe-checkout',
  templateUrl: './stripe-checkout.component.html',
  styleUrls: ['./stripe-checkout.component.css']
})
export class StripeCheckoutComponent {
  constructor(private http: HttpClient) {}

  initiateCheckout() {
    this.http.post<{ url: string }>('/create-checkout-session', {}).subscribe(
      (response) => {
        if (response.url) {
          window.location.href = response.url;
        }
      },
      (error) => {
        console.error('Checkout session creation failed', error);
      }
    );
  }
}
