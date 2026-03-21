import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BrandingDto } from '../../../models/organization-branding';
import { BaseApiService } from '../../../services/shared/base-api.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationBrandingService {
  private api = inject(BaseApiService);

  private apiUrl = `organizationbranding`;

  getBranding(organizationId: string): Observable<BrandingDto> {
    return this.api.get<BrandingDto>(`${this.apiUrl}/${organizationId}`);
  }

  createOrUpdateBranding(payload: BrandingDto): Observable<BrandingDto> {
    return this.api.post<BrandingDto>(this.apiUrl, payload);
  }
}
