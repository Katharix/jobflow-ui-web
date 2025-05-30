import { Component, Input } from '@angular/core';
import { OrganizationDto } from '../../../models/organization';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './onboarding-checklist.component.html',
  styleUrl: './onboarding-checklist.component.scss'
})
export class OnboardingChecklistComponent {
  @Input() organization: OrganizationDto;
}
