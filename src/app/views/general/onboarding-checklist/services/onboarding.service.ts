import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface OnboardingStep {
  id: string;
  stepName: string;
  isCompleted: boolean;
  completedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/onboarding`;



  getSteps(organizationId: string) {
    return this.http.get<OnboardingStep[]>(`${this.apiUrl}/${organizationId}`);
  }

  markStepComplete(organizationId: string, stepName: string) {
    return this.http.put<OnboardingStep>(
      `${this.apiUrl}/${organizationId}/complete`,
      { stepName }
    );
  }
}
