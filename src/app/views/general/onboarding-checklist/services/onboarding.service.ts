import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {BaseApiService} from "../../../../services/shared/base-api.service";
import { OrganizationDto } from '../../../../models/organization';

export interface OnboardingStepDto {
  key: string;
  title: string;
  order: number;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface OnboardingQuickStartTrackDto {
  key: string;
  title: string;
  description: string;
}

export interface OnboardingQuickStartServiceDto {
  name: string;
  description: string;
  unit: string;
  price: number;
}

export interface OnboardingQuickStartPresetDto {
  key: string;
  title: string;
  description: string;
  defaultServices: OnboardingQuickStartServiceDto[];
}

export interface OnboardingQuickStartStateDto {
  selectedTrackKey?: string | null;
  selectedPresetKey?: string | null;
  isPresetApplied: boolean;
  tracks: OnboardingQuickStartTrackDto[];
  presets: OnboardingQuickStartPresetDto[];
}

export interface OnboardingQuickStartApplyRequest {
  trackKey: string;
  presetKey: string;
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

  getQuickStartState(): Observable<OnboardingQuickStartStateDto> {
    return this.api.get<OnboardingQuickStartStateDto>(`${this.invoiceUrl}quick-start`);
  }

  applyQuickStart(request: OnboardingQuickStartApplyRequest): Observable<OnboardingQuickStartStateDto> {
    return this.api.post<OnboardingQuickStartStateDto>(`${this.invoiceUrl}quick-start`, request);
  }

  completeOnboarding(): Observable<OrganizationDto> {
    return this.api.post<OrganizationDto>(`${this.invoiceUrl}complete`, {});
  }
}
