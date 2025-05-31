import { Component, Input, TemplateRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { OrganizationDto } from '../../../models/organization';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WizardComponent } from "../../../common/wizard/wizard.component";
import { NgWizardConfig, STEP_STATE, StepValidationArgs, THEME } from 'ng-wizard';
import { of } from 'rxjs';
import { WizardStep } from '../../../common/wizard/wizard-step';

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, RouterModule, WizardComponent],
  templateUrl: './onboarding-checklist.component.html',
  styleUrl: './onboarding-checklist.component.scss'
})
export class OnboardingChecklistComponent implements AfterViewInit {
  @Input() organization: OrganizationDto;
  @ViewChild('step1') step1!: TemplateRef<any>;
  @ViewChild('step2') step2!: TemplateRef<any>;
  @ViewChild('step3') step3!: TemplateRef<any>;

  wizardSteps: WizardStep[] = [];

  wizardConfig: NgWizardConfig = {
    selected: 0,
    theme: THEME.arrows,
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.wizardSteps = [
      {
        title: 'Step 1',
        description: 'Enter details',
        canExit: () => true,
        contentTemplate: this.step1
      },
      {
        title: 'Step 2',
        state: STEP_STATE.disabled,
        contentTemplate: this.step2
      },
      {
        title: 'Step 3',
        canEnter: (args: StepValidationArgs) => of(true),
        contentTemplate: this.step3
      }
    ];

    this.cdr.detectChanges(); // <-- Fixes ExpressionChanged error
  }
}
