import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { OrganizationService } from '../../../services/shared/organization.service';
import { OrganizationDto } from '../../../models/organization';
import {
  JobflowGridColumn,
  JobflowGridComponent,
  JobflowGridPageSettings
} from '../../../common/jobflow-grid/jobflow-grid.component';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-support-hub-organizations',
  standalone: true,
  imports: [CommonModule, JobflowGridComponent, MessageModule],
  templateUrl: './support-hub-organizations.component.html',
  styleUrl: './support-hub-organizations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubOrganizationsComponent implements OnInit {
  private organizationService = inject(OrganizationService);
  private cdr = inject(ChangeDetectorRef);

  organizations: OrganizationDto[] = [];
  columns: JobflowGridColumn[] = [];
  pageSettings: JobflowGridPageSettings = { pageSize: 15, pageSizes: [15, 30, 50, 100] };
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.columns = [
      { field: 'organizationName', headerText: 'Organization' },
      { field: 'subscriptionPlanName', headerText: 'Plan' },
      { headerText: 'Location', valueAccessor: this.locationAccessor },
      { headerText: 'Onboarding', width: 130, textAlign: 'Center', valueAccessor: this.onboardingAccessor },
      { field: 'paymentProvider', headerText: 'Payments', width: 130, textAlign: 'Center' }
    ];

    this.organizationService.getAllOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = (organizations ?? []) as OrganizationDto[];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Unable to load organizations.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  locationAccessor = (_field: string, data: unknown): string => {
    const org = data as OrganizationDto;
    const city = org.city ?? '';
    const state = org.state ?? '';
    return [city, state].filter(Boolean).join(', ') || '—';
  };

  onboardingAccessor = (_field: string, data: unknown): string => {
    const org = data as OrganizationDto;
    return org.onboardingComplete ? 'Complete' : 'In progress';
  };
}
