import { Injectable } from "@angular/core";
import { OrganizationDto } from "../../models/organization";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private orgSubject = new BehaviorSubject<OrganizationDto | null>(null);
  org$ = this.orgSubject.asObservable();

  setOrganization(org: OrganizationDto) {
    this.orgSubject.next(org);
  }

  get organizationId(): string | null {
    return this.orgSubject.value?.id ?? null;
  }

  get current(): OrganizationDto | null {
    return this.orgSubject.value;
  }
}
