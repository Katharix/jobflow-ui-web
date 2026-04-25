import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PageHeaderComponent } from '../../../../../admin/dashboard/page-header/page-header.component';
import {
  OnboardingQuickStartPresetDto,
  OnboardingQuickStartStateDto,
  OnboardingQuickStartTrackDto,
  OnboardingService
} from '../../services/onboarding.service';
import { ToastService } from '../../../../../common/toast/toast.service';

@Component({
  selector: 'app-onboarding-quick-start',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, PageHeaderComponent],
  templateUrl: './quick-start.component.html',
  styleUrl: './quick-start.component.scss'
})
export class OnboardingQuickStartComponent implements OnInit {
  private readonly onboardingService = inject(OnboardingService);
  private readonly toast = inject(ToastService);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  state: OnboardingQuickStartStateDto | null = null;
  selectedTrackKey = '';
  selectedPresetKey = '';
  loading = true;
  applying = false;
  error: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  get tracks(): OnboardingQuickStartTrackDto[] {
    return this.state?.tracks ?? [];
  }

  get presets(): OnboardingQuickStartPresetDto[] {
    return this.state?.presets ?? [];
  }

  get canApply(): boolean {
    return !!this.selectedTrackKey && !this.applying;
  }

  selectTrack(track: OnboardingQuickStartTrackDto): void {
    this.selectedTrackKey = track.key;
  }

  selectPreset(preset: OnboardingQuickStartPresetDto): void {
    this.selectedPresetKey = this.selectedPresetKey === preset.key ? '' : preset.key;
  }

  isTrackSelected(track: OnboardingQuickStartTrackDto): boolean {
    return this.selectedTrackKey === track.key;
  }

  isPresetSelected(preset: OnboardingQuickStartPresetDto): boolean {
    return this.selectedPresetKey === preset.key;
  }

  applyQuickStart(): void {
    if (!this.canApply) {
      this.error = 'Select an onboarding track to continue.';
      return;
    }

    this.error = null;
    this.applying = true;

    this.onboardingService.applyQuickStart({
      trackKey: this.selectedTrackKey,
      presetKey: this.selectedPresetKey || null
    }).subscribe({
      next: (state) => {
        this.state = state;
        this.selectedTrackKey = state.selectedTrackKey ?? this.selectedTrackKey;
        this.selectedPresetKey = state.selectedPresetKey ?? this.selectedPresetKey;
        this.toast.success('Your presets are ready in Pricebook and Workflow settings.', 'Quick-start applied');
        this.applying = false;
      },
      error: () => {
        this.error = 'Unable to apply quick-start right now.';
        this.applying = false;
      }
    });
  }

  private load(): void {
    this.loading = true;
    this.error = null;

    this.onboardingService.getQuickStartState().subscribe({
      next: (state) => {
        this.ngZone.run(() => {
          this.state = state;
          this.selectedTrackKey = state.selectedTrackKey ?? state.tracks?.[0]?.key ?? '';
          this.selectedPresetKey = state.selectedPresetKey
            ?? state.recommendedPresetKey
            ?? '';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.error = 'Unable to load quick-start options.';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }
}
