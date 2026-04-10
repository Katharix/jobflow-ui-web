import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { OrganizationDto } from '../../models/organization';
import { OrganizationService } from '../../services/shared/organization.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { OrganizationTypeService } from '../../services/shared/organization-type.service';
import { OrganizationType } from '../../models/organization-type';
import { ToastService } from '../../common/toast/toast.service';
import { US_STATES } from '../../common/constants';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './company.component.html',
  styleUrl: './company.component.scss'
})
export class CompanyComponent implements OnInit, OnDestroy {
  private orgService = inject(OrganizationService);
  private orgContext = inject(OrganizationContextService);
  private orgTypeService = inject(OrganizationTypeService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  isLoading = true;
  isSaving = false;
  error: string | null = null;

  model: Partial<OrganizationDto> = {};
  organizationTypes: OrganizationType[] = [];
  usStates = US_STATES;

  private orgSub?: Subscription;

  ngOnInit(): void {
    this.loadOrganizationTypes();
    this.orgSub = this.orgContext.org$.subscribe(org => {
      if (org) {
        this.model = {
          organizationName: org.organizationName ?? '',
          contactFirstName: org.contactFirstName ?? '',
          contactLastName: org.contactLastName ?? '',
          emailAddress: org.emailAddress ?? org.email ?? '',
          phoneNumber: org.phoneNumber ?? '',
          address1: org.address1 ?? '',
          address2: org.address2 ?? '',
          city: org.city ?? '',
          state: org.state ?? '',
          zipCode: org.zipCode ?? '',
          organizationTypeId: org.organizationTypeId ?? '',
        };
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.orgSub?.unsubscribe();
  }

  private loadOrganizationTypes(): void {
    this.orgTypeService.getAllOrganizations().subscribe({
      next: (data) => {
        this.organizationTypes = data
          .filter(e => e.typeName !== 'Master Account')
          .sort((a, b) => {
            if (a.typeName === 'Other') return 1;
            if (b.typeName === 'Other') return -1;
            return a.typeName.localeCompare(b.typeName);
          });
      },
      error: (err: unknown) => console.error('Failed to load org types:', err)
    });
  }

  save(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;

    this.orgService.updateOrganization(this.model).subscribe({
      next: (updated) => {
        this.orgContext.setOrganization(updated);
        this.toast.success(this.translate.instant('company.toast.saved'));
        this.isSaving = false;
      },
      error: () => {
        this.error = this.translate.instant('company.errors.saveFailed');
        this.isSaving = false;
      }
    });
  }
}
