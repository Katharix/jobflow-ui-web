import { TemplateRef } from '@angular/core';
import { MovingDirection } from '@rg-software/angular-archwizard';


export interface WizardStep {
  title: string;
  description?: string;
  canEnter?: boolean | ((direction: MovingDirection) => boolean | Promise<boolean>);
  canExit?: boolean | ((direction: MovingDirection) => boolean | Promise<boolean>);
  contentTemplate: TemplateRef<unknown>;
}
