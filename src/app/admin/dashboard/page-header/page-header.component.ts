import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-page-header',
    imports: [LucideAngularModule, CommonModule],
    templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() actions?: {
    label: string;
    icon?: string;
    class: string;
    click?: () => void;
  }[];
}
