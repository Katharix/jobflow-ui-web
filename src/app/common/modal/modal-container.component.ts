import { Component, ViewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkPortalOutlet, ComponentPortal, PortalModule } from '@angular/cdk/portal';

@Component({
  selector: 'app-modal-container',
  standalone: true,
  imports: [NgClass, CdkTrapFocus, PortalModule],
  template: `
    <div class="modal d-block" tabindex="-1" cdkTrapFocus>
      <div class="modal-dialog" [ngClass]="dialogClass">
        <div class="modal-content">
          <ng-template cdkPortalOutlet></ng-template>
        </div>
      </div>
    </div>
  `,
})
export class ModalContainerComponent {
  dialogClass: string | string[] = 'modal-lg';

  @ViewChild(CdkPortalOutlet, { static: true })
  outlet!: CdkPortalOutlet;

  attach(portal: ComponentPortal<unknown>) {
    this.outlet.attach(portal);
  }
}
