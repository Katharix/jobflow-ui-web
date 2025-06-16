import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { BrandingDto } from '../models/organization-branding';

@Injectable({
  providedIn: 'root'
})
export class OrganizationBrandingService {
  private apiUrl = `organizationbranding`;

  constructor(private api: BaseApiService) {}

  getBranding(organizationId: string): Observable<BrandingDto> {
    return this.api.get<BrandingDto>(`${this.apiUrl}/${organizationId}`);
  }

  createOrUpdateBranding(payload: BrandingDto): Observable<BrandingDto> {
    return this.api.post<BrandingDto>(this.apiUrl, payload);
  }
}
