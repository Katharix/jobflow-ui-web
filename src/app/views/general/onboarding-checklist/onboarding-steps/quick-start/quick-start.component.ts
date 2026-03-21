import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './quick-start.component.html',
  styleUrl: './quick-start.component.scss'
})
export class OnboardingQuickStartComponent implements OnInit {
  state: OnboardingQuickStartStateDto | null = null;
  selectedTrackKey = '';
  selectedPresetKey = '';
  loading = true;
  applying = false;
  error: string | null = null;

  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly toast: ToastService
  ) {}

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
    return !!this.selectedTrackKey && !!this.selectedPresetKey && !this.applying;
  }

  selectTrack(track: OnboardingQuickStartTrackDto): void {
    this.selectedTrackKey = track.key;
  }

  selectPreset(preset: OnboardingQuickStartPresetDto): void {
    this.selectedPresetKey = preset.key;
  }

  isTrackSelected(track: OnboardingQuickStartTrackDto): boolean {
    return this.selectedTrackKey === track.key;
  }

  isPresetSelected(preset: OnboardingQuickStartPresetDto): boolean {
    return this.selectedPresetKey === preset.key;
  }

  applyQuickStart(): void {
    if (!this.canApply) {
      this.error = 'Select a track and an industry preset to continue.';
      return;
    }

    this.error = null;
    this.applying = true;

    this.onboardingService.applyQuickStart({
      trackKey: this.selectedTrackKey,
      presetKey: this.selectedPresetKey
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
        this.state = state;
        this.selectedTrackKey = state.selectedTrackKey ?? state.tracks?.[0]?.key ?? '';
        this.selectedPresetKey = state.selectedPresetKey ?? '';
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load quick-start options.';
        this.loading = false;
      }
    });
  }
}
