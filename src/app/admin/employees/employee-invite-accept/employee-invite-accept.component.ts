import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeInviteService } from '../../employees/services/employee-invite.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-employee-invite-accept',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-invite-accept.component.html'
})
export class EmployeeInviteAcceptComponent implements OnInit {
  @Input() token!: string;
  @Output() accepted = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private inviteService: EmployeeInviteService) {}

  ngOnInit() {
    this.form = this.fb.group({
      phoneNumber: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    try {
      await firstValueFrom(this.inviteService.accept(this.token));
      this.accepted.emit();
    } finally {
      this.loading = false;
    }
  }
}
