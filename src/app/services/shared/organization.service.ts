import { Injectable, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Organization, OrganizationDto, OrganizationRequest } from '../../models/organization';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private api = inject(BaseApiService);

  organizationUrl: string;

  constructor() {
    this.organizationUrl = 'organizations/';
  }

  getAllOrganizations() {
    return this.api.get(`${this.organizationUrl}all`);
  }

  registerOrganization(orgDto: OrganizationDto): Observable<Organization> {
    return this.api.post<Organization>(`${this.organizationUrl}register`, orgDto);
  }

  createOrganization(org: OrganizationDto): Observable<Organization> {
    return this.api.post<Organization>(`${this.organizationUrl}create`, org);
  }

  getOrganizationById(org: OrganizationRequest): Observable<Organization> {
    return this.api.post<Organization>(`${this.organizationUrl}retrieve`, org);
  }
}
