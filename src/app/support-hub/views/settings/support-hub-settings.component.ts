import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-support-hub-settings',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ButtonModule],
  templateUrl: './support-hub-settings.component.html',
  styleUrl: './support-hub-settings.component.scss',
})
export class SupportHubSettingsComponent {}
