import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {LucideAngularModule} from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {OrganizationDto} from '../../models/organization';
import {BrandingDto} from '../../models/organization-branding';
import {FileUploadService} from './services/file-upload.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {OrganizationBrandingService} from './services/organization-branding.service';

@Component({
   selector: 'app-branding',
   standalone: true,
      imports: [
         CommonModule,
         RouterLink,
         ReactiveFormsModule,
         LucideAngularModule,
         TranslateModule
      ],
   templateUrl: './branding.component.html',
   styleUrl: './branding.component.scss'
})
export class BrandingComponent implements OnInit {
   private fb = inject(FormBuilder);
   private orgContext = inject(OrganizationContextService);
   private brandingService = inject(OrganizationBrandingService);
   private uploadService = inject(FileUploadService);
   private translate = inject(TranslateService);
   private destroyRef = inject(DestroyRef);
   private cdr = inject(ChangeDetectorRef);

   organization!: OrganizationDto;
   brandingForm!: FormGroup;
   logoPreview: string | null = null;
   imageUrl: string | null = null;
   uploadedLogo: File | null = null;
   isSaving = false;
   saveStatus: 'success' | 'error' | null = null;
   saveMessage = '';
   previewTab: 'invoice' | 'estimate' = 'invoice';

   constructor() {
      this.brandingForm = this.fb.group({
         primaryColor: ['#0d6efd'],
         secondaryColor: ['#6c757d'],
         tagline: [''],
         businessName: [''],
         footerNote: ['']
      });
   }

   ngOnInit(): void {
      this.orgContext.org$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(org => {
         if (!org) {
            return;
         }

         this.organization = org;
         this.brandingForm.patchValue({
            businessName: org.organizationName ?? ''
         });

         if (org.id) {
            this.loadExistingBranding(org.id);
         }
      });
   }

   private loadExistingBranding(orgId: string): void {
      this.brandingService.getBranding(orgId).subscribe({
         next: (branding) => {
            this.brandingForm.patchValue({
               primaryColor: branding.primaryColor ?? '#0d6efd',
               secondaryColor: branding.secondaryColor ?? '#6c757d',
               tagline: branding.tagline ?? '',
               businessName: branding.businessName ?? this.organization.organizationName ?? '',
               footerNote: branding.footerNote ?? ''
            });

            if (branding.logoUrl) {
               this.imageUrl = branding.logoUrl;
               this.logoPreview = branding.logoUrl;
            }

            this.cdr.detectChanges();
         },
         error: (err: unknown) => {
            console.error(err);
         }
      });
   }

   onLogoSelected(event: Event): void {
      const file = (event.target as HTMLInputElement)?.files?.[0];
      if (file) {
         this.saveStatus = null;
         const reader = new FileReader();
         reader.onload = () => this.logoPreview = reader.result as string;
         reader.readAsDataURL(file);
         this.uploadedLogo = file;
      }
   }

   removeLogo(): void {
      this.logoPreview = null;
      this.imageUrl = null;
      this.uploadedLogo = null;
   }

   onPrimaryColorChange(event: Event): void {
      const hex = (event.target as HTMLInputElement).value;
      this.brandingForm.patchValue({primaryColor: hex});
   }

   onSecondaryColorChange(event: Event): void {
      const hex = (event.target as HTMLInputElement).value;
      this.brandingForm.patchValue({secondaryColor: hex});
   }

   get primaryColor(): string {
      return this.brandingForm.value.primaryColor ?? '#0d6efd';
   }

   get secondaryColor(): string {
      return this.brandingForm.value.secondaryColor ?? '#6c757d';
   }

   get orgAddress(): string {
      const o = this.organization;
      if (!o) return '';
      const parts = [o.address1, o.address2].filter(Boolean);
      const cityState = [o.city, o.state, o.zipCode].filter(Boolean).join(', ');
      return [...parts, cityState].filter(Boolean).join('\n');
   }

   onSave(): void {
      if (this.brandingForm.invalid || !this.organization?.id || this.isSaving) {
         return;
      }

      this.isSaving = true;
      this.saveStatus = null;

      if (!this.uploadedLogo) {
         this.persistBranding(this.imageUrl ?? undefined);
         return;
      }

      this.uploadService.uploadImage(
         this.uploadedLogo,
         'company_logos_unsigned',
         `jobflow/companies/${this.organization.id}/images/logo`
      ).subscribe({
         next: (url) => {
            this.imageUrl = url;
            this.persistBranding(url);
         },
         error: () => {
            this.isSaving = false;
            this.saveStatus = 'error';
            this.saveMessage = this.translate.instant('admin.branding.toast.logoUploadFailed');
         }
      });
   }

   private persistBranding(logoUrl?: string): void {
      const payload: BrandingDto = {
         organizationId: this.organization.id!,
         ...this.brandingForm.value,
         logoUrl
      };

      this.brandingService.createOrUpdateBranding(payload).subscribe({
         next: () => {
            this.isSaving = false;
            this.uploadedLogo = null;
            this.saveStatus = 'success';
            this.saveMessage = this.translate.instant('admin.branding.toast.saveSuccess');
         },
         error: () => {
            this.isSaving = false;
            this.saveStatus = 'error';
            this.saveMessage = this.translate.instant('admin.branding.toast.saveFailed');
         }
      });
   }

}
