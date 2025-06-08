import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FeatherIconDirective } from '../../../../../core/feather-icon/feather-icon.directive';
import { SketchComponent } from 'ngx-color/sketch';
import { BlockComponent, ColorBlockModule } from 'ngx-color/block';
import { ColorTwitterModule } from 'ngx-color/twitter';
import { OrganizationDto } from '../../../../../models/organization';
import { OrganizationContextService } from '../../../../../services/shared/organization-context.service';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FeatherIconDirective, ColorBlockModule, ColorTwitterModule],
  templateUrl: './branding.component.html',
  styleUrl: './branding.component.scss'
})
export class BrandingComponent {
  organization: OrganizationDto
  brandingForm!: FormGroup;
  logoPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private orgContext: OrganizationContextService
  ) 
    {
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
  if (this.brandingForm.valid) {
    const formData = this.brandingForm.value;
    // TODO: send formData to API
    console.log('Saving branding settings...', formData);
  }
}

}
