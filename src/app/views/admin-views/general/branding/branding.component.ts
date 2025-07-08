import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ColorBlockModule } from 'ngx-color/block';
import { ColorTwitterModule } from 'ngx-color/twitter';
import { OrganizationDto } from '../../../../models/organization';
import { OrganizationContextService } from '../../../../services/shared/organization-context.service';
import { OrganizationBrandingService } from '../../../../services/organization-branding.service';
import { BrandingDto } from '../../../../models/organization-branding';
import { FileUploadService } from '../../../../services/file-upload.service';
import { LucideAngularModule } from 'lucide-angular';
import { PageHeaderComponent } from '../../dashboard/page-header/page-header.component';


@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ColorBlockModule, ColorTwitterModule, LucideAngularModule, PageHeaderComponent],
  templateUrl: './branding.component.html',
  styleUrl: './branding.component.scss'
})
export class BrandingComponent {
  organization: OrganizationDto
  brandingForm!: FormGroup;
  logoPreview: string | null = null;
  imageUrl: string | null = null;
  uploadedLogo: File;

  constructor(
    private fb: FormBuilder,
    private orgContext: OrganizationContextService,
    private brandingService: OrganizationBrandingService,
    private uploadService: FileUploadService
  ) {
    this.orgContext.org$.subscribe(org => {
      if (org) {
        this.organization = org;
      }
    });
    // ✅ Safe initialization after fb is assigned
    this.brandingForm = this.fb.group({
      primaryColor: ['#0d6efd'],
      secondaryColor: ['#6c757d'],
      tagline: [''],
      businessName: this.organization.organizationName,
      footerNote: ['']
    });
  }

  onLogoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => this.logoPreview = reader.result as string;
      reader.readAsDataURL(file);
      this.uploadedLogo = file;
    }
  }
  onPrimaryColorChange(event: any) {
    const hex = event.color.hex;
    this.brandingForm.patchValue({ primaryColor: hex });
  }

  onSecondaryColorChange(event: any) {
    const hex = event.color.hex;
    this.brandingForm.patchValue({ secondaryColor: hex });
  }

  get previewStyles() {
    const { primaryColor, secondaryColor } = this.brandingForm.value;
    return {
      backgroundColor: '#fff',
      borderLeft: `4px solid ${primaryColor}`
    };
  }

 onSave(): void {
  if (this.brandingForm.invalid) return;

  this.uploadService.uploadImage(
    this.uploadedLogo,
    'company_logos_unsigned',
    `jobflow/companies/${this.organization.id}/images/logo`
  ).subscribe({
    next: (url) => {
      this.imageUrl = url;

      const payload: BrandingDto = {
        organizationId: this.organization.id,
        ...this.brandingForm.value,
        logoUrl: url // ✅ use the actual url from Cloudinary
      };

      this.brandingService.createOrUpdateBranding(payload).subscribe({
        next: res => {
          console.log('✅ Branding saved successfully:', res);
        },
        error: err => {
          console.error('❌ Error saving branding:', err);
        }
      });
    },
    error: (err) => console.error('❌ Upload failed:', err)
  });
}

}
