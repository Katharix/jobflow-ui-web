import {Component, Input, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {WizardStep} from './wizard-step';
import {
   MovingDirection,
   WizardComponent as ArchWizardComponent,
   WizardStepComponent
} from '@rg-software/angular-archwizard';

@Component({
   selector: 'app-wizard',
   template: `
      <!-- Wizard Component -->
      <aw-wizard (stepChanged)="stepChanged($event)" class="shadow rounded-lg p-4 bg-white">
         <aw-wizard-step
            *ngFor="let step of steps"
            [stepTitle]="step.title"
            [canEnter]="wrapGuard(step.canEnter)"
            [canExit]="wrapGuard(step.canExit)"
         >
            <ng-container *ngTemplateOutlet="step.contentTemplate"></ng-container>
         </aw-wizard-step>
      </aw-wizard>

      <!-- Navigation Buttons -->
      <div class="d-flex justify-content-between mt-4">
         <button
            class="btn btn-secondary"
            *ngIf="!isFirstStep()"
            (click)="goToPrevious()"
         >
            ← Previous
         </button>

         <button
            class="btn btn-primary"
            *ngIf="!isLastStep()"
            (click)="goToNext()"
         >
            Next →
         </button>
      </div>

   `
})
export class WizardComponent {
   @Input() steps: WizardStep[] = [];
   @ViewChild(ArchWizardComponent)
   wizardRef!: ArchWizardComponent;

   @ViewChildren(WizardStepComponent)
   wizardSteps!: QueryList<WizardStepComponent>;

   stepChanged(event: any) {
   }

   isFirstStep(): boolean {
      return this.wizardRef?.currentStepIndex === 0;
   }

   isLastStep(): boolean {
      const totalSteps = this.wizardSteps?.length ?? 0;
      return this.wizardRef?.currentStepIndex === totalSteps - 1;
   }

   goToNext(): void {
      if (!this.isLastStep()) {
         this.wizardRef.goToStep(this.wizardRef.currentStepIndex + 1);
      }
   }

   goToPrevious(): void {
      if (!this.isFirstStep()) {
         this.wizardRef.goToStep(this.wizardRef.currentStepIndex - 1);
      }
   }

   wrapGuard(
      guard?: boolean | ((dir: MovingDirection) => boolean | Promise<boolean>)
   ): boolean | ((dir: MovingDirection) => boolean) | ((dir: MovingDirection) => Promise<boolean>) {
      if (guard === undefined) {
         return true;
      }

      if (typeof guard === 'function') {
         const testResult = guard(MovingDirection.Forwards); // Just to infer type

         if (testResult instanceof Promise) {
            return (dir: MovingDirection) => guard(dir) as Promise<boolean>;
         }

         return (dir: MovingDirection) => guard(dir) as boolean;
      }

      return guard;
   }

}
