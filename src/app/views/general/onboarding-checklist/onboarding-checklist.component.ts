import {
  Component,
  Input,
  TemplateRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { OrganizationDto } from '../../../models/organization';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WizardStep } from '../../../common/wizard/wizard-step';
import { WizardModule } from '../../../common/wizard/wizard.module';
import { getOnboardingSteps } from './onboarding-steps.config';
import { ConnectPaymentComponent } from "./onboarding-steps/connect-payment/connect-payment.component";

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, RouterModule, WizardModule, ConnectPaymentComponent],
  templateUrl: './onboarding-checklist.component.html',
  styleUrl: './onboarding-checklist.component.scss'
})
export class OnboardingChecklistComponent implements AfterViewInit {
  @Input() organization: OrganizationDto;
  @ViewChild('step1') step1!: TemplateRef<any>;
  @ViewChild('step2') step2!: TemplateRef<any>;
  @ViewChild('step3') step3!: TemplateRef<any>;
  @ViewChild('step4') step4!: TemplateRef<any>;
  @ViewChild('step5') step5!: TemplateRef<any>;
  @ViewChild('step6') step6!: TemplateRef<any>;

  wizardSteps: WizardStep[] = [];

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.wizardSteps = getOnboardingSteps({
      step1: this.step1,
      step2: this.step2,
      step3: this.step3,
      step4: this.step4,
      step5: this.step5,
      step6: this.step6,
    });

    this.cdr.detectChanges();
  }
}
