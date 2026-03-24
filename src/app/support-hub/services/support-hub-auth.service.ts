import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';

@Injectable({ providedIn: 'root' })
export class SupportHubAuthService {
  private api = inject(BaseApiService);
  private apiUrl = 'supporthub/register';

  register(): Observable<void> {
    return this.api.post<void>(this.apiUrl, {});
  }
}
