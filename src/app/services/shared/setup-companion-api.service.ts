import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface TrackSetupEventRequest {
  sessionId: string;
  questionKey: string;
  answerKey?: string;
}

export interface AskSetupCompanionRequest {
  sessionId: string;
  question: string;
  currentRoute: string;
}

export interface AskSetupCompanionResponse {
  answer: string;
}

@Injectable({ providedIn: 'root' })
export class SetupCompanionApiService {
  private api = inject(BaseApiService);

  trackEvent(request: TrackSetupEventRequest): Observable<void> {
    return this.api.post<void>('setup-companion/events', request);
  }

  ask(request: AskSetupCompanionRequest): Observable<AskSetupCompanionResponse> {
    return this.api.post<AskSetupCompanionResponse>('setup-companion/ask', request);
  }
}
