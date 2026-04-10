import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../common/toast/toast.service';
import { UserProfile, UserProfileUpdateRequest } from '../../../models/user-profile';
import { LocalizationService } from '../../../services/shared/localization.service';
import { UserProfileService } from '../../../services/shared/user-profile.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  private readonly userProfileService = inject(UserProfileService);
  private readonly localization = inject(LocalizationService);
  private readonly toast = inject(ToastService);

  isLoading = true;
  isSaving = false;
  error: string | null = null;

  model: UserProfileUpdateRequest = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    preferredLanguage: 'en',
  };

  languageOptions = [
    { value: 'en', labelKey: 'languages.english' },
    { value: 'es', labelKey: 'languages.spanish' },
    { value: 'fr', labelKey: 'languages.french' },
    { value: 'pt', labelKey: 'languages.portuguese' },
    { value: 'de', labelKey: 'languages.german' },
    { value: 'it', labelKey: 'languages.italian' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;

    this.userProfileService.getMe().subscribe({
      next: (profile: UserProfile) => {
        this.model = {
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          email: profile.email ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          preferredLanguage: profile.preferredLanguage ?? 'en',
        };
        this.localization.setLanguage(this.model.preferredLanguage ?? 'en');
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Unable to load your profile right now.';
        this.isLoading = false;
      },
    });
  }

  save(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;

    this.userProfileService.updateMe(this.model).subscribe({
      next: () => {
        if (this.model.preferredLanguage) {
          this.localization.setLanguage(this.model.preferredLanguage);
        }
        this.toast.success('Your profile has been updated.');
        this.isSaving = false;
      },
      error: () => {
        this.error = 'Unable to save your profile right now.';
        this.isSaving = false;
      },
    });
  }
}
