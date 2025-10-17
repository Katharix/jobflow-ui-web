import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { WizardComponent } from './wizard.component';
import { ArchwizardModule } from '@rg-software/angular-archwizard';

@NgModule({
  declarations: [WizardComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ArchwizardModule
  ],
  exports: [WizardComponent]
})
export class WizardModule {}
