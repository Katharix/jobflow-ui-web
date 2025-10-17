import { Component } from '@angular/core';
import { ToastService } from '../../../common/toast/toast.service';
import { EmployeeInviteAcceptComponent } from "../employee-invite-accept/employee-invite-accept.component";
import { ModalComponent } from "../../../views/shared/modal/modal.component";

@Component({
  selector: 'app-invite-accept-modal',
  standalone: true,
  templateUrl: './invite-accept-modal.component.html',
  imports: [EmployeeInviteAcceptComponent, ModalComponent]
})
export class InviteAcceptModalComponent {
  showInviteAcceptModal = false;
  inviteToken!: string;

  constructor(private toast: ToastService) {}

  open(token: string) {
    this.inviteToken = token;
    this.showInviteAcceptModal = true;
  }

  onCancel() {
    this.showInviteAcceptModal = false;
  }

  async onConfirm() {
    const form = document.querySelector('app-employee-invite-accept') as any;
    if (form?.component?.form?.valid) {
      await form.component.submit();
    }
  }

  onInviteAccepted() {
    this.toast.success('Your account has been created successfully!');
    this.showInviteAcceptModal = false;
  }
}
