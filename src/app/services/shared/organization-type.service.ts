import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { OrganizationType } from '../../models/organization-type';

@Injectable({
  providedIn: 'root'
})
export class OrganizationTypeService {
  organizationTypeUrl: string;

  constructor(private api: BaseApiService) {
    this.organizationTypeUrl = 'organization/types/';
  }

  getAllOrganizations(): Observable<OrganizationType[]> {
    return this.api.get<OrganizationType[]>(`${this.organizationTypeUrl}all`);
  }
}
