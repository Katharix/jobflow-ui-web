import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-stripe-signup',
  templateUrl: './stripe-signup.component.html',
  styleUrls: ['./stripe-signup.component.css']
})
export class StripeSignupComponent implements OnInit {
  connectedAccountId: string | null = null;
  isCreatingAccount = false;
  isError = false;
  isAddingInfo = false;
  showSignUp = true;
  showDetailsSubmitted = false;
  showAddInfo = false;

  @ViewChild('connectedAccountIdElement', { static: false }) connectedAccountIdElement!: ElementRef;

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.handleRouting();
  }

  signUp() {
    this.isCreatingAccount = true;
    this.isError = false;
    this.showSignUp = false;

    this.http.post<{ account?: string; error?: string }>('/account', {}).subscribe(
      (response) => {
        if (response.error) {
          this.isError = true;
          this.isCreatingAccount = false;
          this.showSignUp = true;
          return;
        }

        this.connectedAccountId = response.account!;
        this.showAddInfo = true;
        this.isCreatingAccount = false;
      },
      (error) => {
        this.isError = true;
        this.isCreatingAccount = false;
        this.showSignUp = true;
      }
    );
  }

  createAccountLinkAndRedirect() {
    if (!this.connectedAccountId) return;

    this.isAddingInfo = true;
    this.isError = false;
    this.showAddInfo = false;

    this.http
      .post<{ url?: string; error?: string }>('/account_link', {
        account: this.connectedAccountId
      })
      .subscribe(
        (response) => {
          if (response.error) {
            this.isError = true;
            this.showAddInfo = true;
            this.isAddingInfo = false;
            return;
          }

          window.location.href = response.url!;
        },
        (error) => {
          this.isError = true;
          this.showAddInfo = true;
          this.isAddingInfo = false;
        }
      );
  }

  private handleRouting() {
    this.route.url.subscribe((segments) => {
      const route = segments[0]?.path;
      if (route === 'return') {
        this.showSignUp = false;
        this.showDetailsSubmitted = true;
      } else if (route === 'refresh' && segments.length > 1) {
        this.connectedAccountId = segments[1].path;
        this.createAccountLinkAndRedirect();
      }
    });
  }
}
