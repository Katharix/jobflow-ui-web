import { Injectable } from "@angular/core";
import { OrganizationDto } from "../../models/organization";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private orgSubject = new BehaviorSubject<OrganizationDto | null>(null);
  org$ = this.orgSubject.asObservable();

  constructor() {
    this.loadOrgFromStorage();
  }

  setOrganization(org: OrganizationDto) {
    this.orgSubject.next(org);
    localStorage.setItem('org', JSON.stringify(org));
  }

  private loadOrgFromStorage() {
    const raw = localStorage.getItem('org');
    if (raw) {
      this.orgSubject.next(JSON.parse(raw));
    }
  }

  clearOrganization() {
    localStorage.removeItem('org');
    this.orgSubject.next(null);
  }

}
