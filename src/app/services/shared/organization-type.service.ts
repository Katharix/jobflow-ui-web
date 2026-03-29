import { Injectable, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { OrganizationType } from '../../models/organization-type';

@Injectable({
  providedIn: 'root'
})
export class OrganizationTypeService {
  private api = inject(BaseApiService);

  organizationTypeUrl: string;

  constructor() {
    this.organizationTypeUrl = 'organization/types/';
  }

  getAllOrganizations(): Observable<OrganizationType[]> {
    return this.api.get<OrganizationType[]>(`${this.organizationTypeUrl}all`);
  }
}
