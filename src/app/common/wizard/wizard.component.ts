import {
  Component,
  Input,
  ContentChildren,
  QueryList,
  TemplateRef,
  AfterContentInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { NgWizardModule, NgWizardConfig, STEP_STATE, THEME, StepChangedArgs, NgWizardService, StepValidationArgs } from 'ng-wizard';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { WizardStep } from './wizard-step';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-wizard',
  standalone: true,
  imports: [
    NgWizardModule,
    CommonModule,
    ReactiveFormsModule
  ],
  template: `
    <ng-wizard [config]="config" (stepChanged)="stepChanged($event)">
      <ng-wizard-step *ngFor="let step of steps"
                      [title]="step.title"
                      [description]="step.description ?? ''"
                      [canEnter]="isValidCanEnter(step.canEnter)"
                      [canExit]="isValidCanExit(step.canExit)"
                      [state]="step.state">
        <ng-container *ngTemplateOutlet="step.contentTemplate"></ng-container>
      </ng-wizard-step>
    </ng-wizard>
  `
})
export class WizardComponent {

  @Input() steps: WizardStep[] = [];

  @Input() config: NgWizardConfig = {
    selected: 0,
    theme: THEME.arrows,
  };

  constructor(private wizardService: NgWizardService) { }

  stepChanged(args: StepChangedArgs) {
    console.log('Step changed:', args.step);
  }

  isValidCanEnter(input: any): boolean | ((args: StepValidationArgs) => boolean | Observable<boolean>) {
    return typeof input === 'function' || typeof input === 'boolean' ? input : true;
  }

  isValidCanExit(input: any): boolean | ((args: StepValidationArgs) => boolean | Observable<boolean>) {
    return typeof input === 'function' || typeof input === 'boolean' ? input : true;
  }

}
