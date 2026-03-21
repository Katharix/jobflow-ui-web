import { Component, OnInit, inject } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {FloatLabelModule} from 'primeng/floatlabel';
import {ButtonModule} from 'primeng/button';
import {ColorBlockModule} from 'ngx-color/block';
import {ColorTwitterModule} from 'ngx-color/twitter';
import {LucideAngularModule} from 'lucide-angular';
import {OrganizationDto} from '../../models/organization';
import {BrandingDto} from '../../models/organization-branding';
import {FileUploadService} from './services/file-upload.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {PageHeaderComponent} from '../dashboard/page-header/page-header.component';
import {OrganizationBrandingService} from './services/organization-branding.service';

interface ColorChangeEvent {
   color: {
      hex: string;
   };
}

@Component({
   selector: 'app-branding',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, InputTextModule, TextareaModule, FloatLabelModule, ButtonModule, ColorBlockModule, ColorTwitterModule, LucideAngularModule, PageHeaderComponent],
   templateUrl: './branding.component.html',
   styleUrl: './branding.component.scss'
})
export class BrandingComponent implements OnInit {
   private fb = inject(FormBuilder);
   private orgContext = inject(OrganizationContextService);
   private brandingService = inject(OrganizationBrandingService);
   private uploadService = inject(FileUploadService);

   organization!: OrganizationDto;
   brandingForm!: FormGroup;
   logoPreview: string | null = null;
   imageUrl: string | null = null;
   uploadedLogo: File | null = null;
   isSaving = false;
   saveStatus: 'success' | 'error' | null = null;
   saveMessage = '';

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
      this.orgContext.org$.subscribe(org => {
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

   onPrimaryColorChange(event: ColorChangeEvent): void {
      const hex = event.color.hex;
      this.brandingForm.patchValue({primaryColor: hex});
   }

   onSecondaryColorChange(event: ColorChangeEvent): void {
      const hex = event.color.hex;
      this.brandingForm.patchValue({secondaryColor: hex});
   }

   get previewStyles() {
      const primaryColor = this.brandingForm.value.primaryColor ?? '#0d6efd';
      const secondaryColor = this.brandingForm.value.secondaryColor ?? '#6c757d';
      return {
         backgroundColor: '#fff',
         borderColor: primaryColor,
         boxShadow: `0 0 0 1px ${secondaryColor}`
      };
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
            this.saveMessage = 'Logo upload failed. Please try again.';
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
            this.saveMessage = 'Branding saved successfully.';
         },
         error: () => {
            this.isSaving = false;
            this.saveStatus = 'error';
            this.saveMessage = 'Unable to save branding. Please try again.';
         }
      });
   }

}
