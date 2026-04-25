import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() headline = '';
  @Input() body = '';
  @Input() ctaLabel = '';
  @Input() ctaRoute: string | null = null;
  @Input() icon: string | null = null;
  @Input() ctaAction: (() => void) | null = null;

  onCtaClick(): void {
    if (this.ctaAction) {
      this.ctaAction();
    }
  }
}
