// wizard-step.model.ts
import { STEP_STATE } from "ng-wizard";
import { TemplateRef } from "@angular/core";
import { Observable } from "rxjs";

export interface WizardStep {
  title: string;
  description?: string;
  canEnter?: boolean | ((args: any) => boolean | Observable<boolean>);
  canExit?: boolean | ((args: any) => boolean | Observable<boolean>);
  state?: STEP_STATE;
  contentTemplate: TemplateRef<any>;
}
