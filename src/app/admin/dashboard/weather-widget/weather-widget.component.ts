import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { WeatherService } from '../../../services/shared/weather.service';
import { WeatherDashboardDto, WeatherForecastDay } from '../../../models/weather';
import { Job, JobLifecycleStatus } from '../../jobs/models/job';
import { JobsService } from '../../jobs/services/jobs.service';

@Component({
   selector: 'app-weather-widget',
   standalone: true,
   imports: [CommonModule],
   templateUrl: './weather-widget.component.html',
   styleUrl: './weather-widget.component.scss'
})
export class WeatherWidgetComponent implements OnInit, OnChanges, OnDestroy {
   @Input() jobs: Job[] = [];
   @Input() variant: 'card' | 'navbar' = 'card';

   weatherLocation = 'Local area';
   weatherIsApproximate = false;
   weatherTemperatureText = '--';
   weatherConditionText = 'Weather update';
   weatherIconClass = 'pi pi-spin pi-spinner';
   weatherForecast: WeatherForecastDay[] = [];
   weatherRiskAlerts: string[] = [];
   locationBlocked = false;
   locationUnavailable = false;
   loadedJobs: Job[] = [];

   private readonly destroy$ = new Subject<void>();
   private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

   private static readonly REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

   constructor(
      private readonly weatherService: WeatherService,
      private readonly jobsService: JobsService
   ) {}

   ngOnInit(): void {
      this.loadJobs();
      this.loadCurrentWeather();
      this.refreshIntervalId = setInterval(
         () => this.loadCurrentWeather(),
         WeatherWidgetComponent.REFRESH_INTERVAL_MS
      );
   }

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['jobs']) {
         this.computeWeatherRiskAlerts();
      }
   }

   ngOnDestroy(): void {
      if (this.refreshIntervalId) {
         clearInterval(this.refreshIntervalId);
      }
      this.destroy$.next();
      this.destroy$.complete();
   }

   refresh(): void {
      this.locationBlocked = false;
      this.locationUnavailable = false;
      this.weatherIconClass = 'pi pi-spin pi-spinner';
      this.loadCurrentWeather();
   }

   private loadCurrentWeather(): void {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
         this.loadWeather();
         return;
      }

      navigator.geolocation.getCurrentPosition(
         position => {
            this.locationBlocked = false;
            this.loadWeather(position.coords.latitude, position.coords.longitude);
         },
         (err: GeolocationPositionError) => {
            if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
               this.locationBlocked = true;
            }
            // Without browser coordinates, the service returns an unavailable state.
            this.loadWeather();
         },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
   }

   private loadWeather(latitude?: number, longitude?: number): void {
      this.weatherService
         .getWeatherDashboard(latitude, longitude)
         .pipe(takeUntil(this.destroy$))
         .subscribe(weather => this.applyWeather(weather));
   }

   private loadJobs(): void {
      this.jobsService
         .getAllJobs()
         .pipe(
            catchError(() => of([] as Job[])),
            takeUntil(this.destroy$)
         )
         .subscribe(jobs => {
            this.loadedJobs = jobs;
            this.computeWeatherRiskAlerts();
         });
   }

   private applyWeather(weather: WeatherDashboardDto): void {
      if (weather.currentCondition === 'unavailable') {
         this.locationUnavailable = true;
         this.weatherIconClass = 'pi pi-map-marker';
         return;
      }
      this.locationUnavailable = false;
      this.weatherLocation = weather.location || 'Local area';
      this.weatherIsApproximate = weather.isApproximate;
      this.weatherTemperatureText = weather.currentTempF > 0 ? `${weather.currentTempF}°F` : '--';
      this.weatherConditionText = weather.currentCondition || 'Weather update';
      this.weatherIconClass = weather.currentIconClass || 'pi pi-cloud';
      this.weatherForecast = weather.forecast ?? [];
      this.computeWeatherRiskAlerts();
   }

   private computeWeatherRiskAlerts(): void {
      const jobs = this.jobs.length ? this.jobs : this.loadedJobs;

      if (!this.weatherForecast.length || !jobs.length) {
         this.weatherRiskAlerts = [];
         return;
      }

      const alerts: string[] = [];
      const riskyDays = this.weatherForecast.filter(day => day.precipitationChance >= 60);

      for (const day of riskyDays) {
         const impactedJobs = jobs.filter(job => {
            if (!job?.scheduledStart) return false;
            const jobDate = new Date(job.scheduledStart).toISOString().slice(0, 10);
            return jobDate === day.date && !this.isJobDone(job);
         }).length;

         if (impactedJobs > 0) {
            const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            alerts.push(
               `${dayLabel}: ${day.precipitationChance}% rain chance, ${impactedJobs} scheduled job${
                  impactedJobs === 1 ? '' : 's'
               } may be impacted.`
            );
         }
      }

      this.weatherRiskAlerts = alerts;
   }

   private isJobDone(job: Job): boolean {
      return [JobLifecycleStatus.Completed, JobLifecycleStatus.Cancelled, JobLifecycleStatus.Failed].includes(
         job.lifecycleStatus
      );
   }
}
