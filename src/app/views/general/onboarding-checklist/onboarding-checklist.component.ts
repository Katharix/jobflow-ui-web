import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingService } from './services/onboarding.service';

@Component({
   selector: 'jobflow-onboarding-checklist',
   standalone: true,
   imports: [CommonModule],
   templateUrl: './onboarding-checklist.component.html'
})
export class OnboardingChecklistComponent implements OnChanges {
   @Input() organizationId: string | null = null;

   steps: any[] = [];
   nextStep: any | null = null;

   constructor(private onboardingService: OnboardingService) {}

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['organizationId'] && this.organizationId) {
         this.load();
      }
   }

   private load(): void {
      this.onboardingService
         .getChecklist(this.organizationId!)
         .subscribe(steps => {
            this.steps = steps.sort((a, b) => a.order - b.order);
            this.nextStep = this.steps.find(s => !s.isCompleted) ?? null;
         });
   }
}
