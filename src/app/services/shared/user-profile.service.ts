import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { UserProfile, UserProfileUpdateRequest } from '../../models/user-profile';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private api = inject(BaseApiService);
  private readonly baseUrl = 'users/me';

  getMe(): Observable<UserProfile> {
    return this.api.get<UserProfile>(this.baseUrl);
  }

  updateMe(request: UserProfileUpdateRequest): Observable<UserProfile> {
    return this.api.put<UserProfile>(this.baseUrl, request);
  }
}
