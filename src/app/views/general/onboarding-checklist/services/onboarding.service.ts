import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {BaseApiService} from "../../../../services/base-api.service";

export interface OnboardingStepDto {
  key: string;
  title: string;
  order: number;
  isCompleted: boolean;
  completedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  invoiceUrl: string;
  constructor(private api: BaseApiService) {
    this.invoiceUrl = 'onboarding/';
  }

  getChecklist(organizationId: string): Observable<OnboardingStepDto[]> {
    return this.api.get<OnboardingStepDto[]>(`${this.invoiceUrl}${organizationId}`);
  }
}
