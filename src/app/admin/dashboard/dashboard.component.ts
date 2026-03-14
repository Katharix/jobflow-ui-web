import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { InvoiceService } from '../invoices/services/invoice.service';
import { OnboardingChecklistComponent } from '../../views/general/onboarding-checklist/onboarding-checklist.component';
import { JobsService } from '../jobs/services/jobs.service';
import { Job, JobLifecycleStatus } from '../jobs/models/job';
import { CustomersService } from '../customer/services/customer.service';
import {
   CommandCenterAction,
   CommandCenterFlowStep,
   JobflowCommandCenterComponent
} from './jobflow-command-center/jobflow-command-center.component';

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, OnboardingChecklistComponent, JobflowCommandCenterComponent],
   templateUrl: './dashboard.component.html',
   styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
   organizationId: string | null = null;
   organizationName = 'your organization';
   currentDateTime = '';
   weatherSummary = '';
   weatherStatusText = 'Click “Use my location” to load local weather';
   weatherIconClass = 'pi pi-spin pi-spinner';

   primaryActions: CommandCenterAction[] = [
      {
         label: 'Create a job',
         description: 'Launch the job intake drawer instantly',
         route: '/admin/jobs',
         icon: 'pi pi-briefcase',
         queryParams: {
            onboardingAction: 'open-job-drawer',
            returnTo: 'dashboard-command-center'
         }
      },
      {
         label: 'Add customer',
         description: 'Capture client details before job intake',
         route: '/admin/clients/create',
         icon: 'pi pi-user-plus',
         queryParams: {
            onboardingAction: 'open-client-drawer',
            returnTo: 'dashboard-command-center'
         }
      }
   ];

   flowSteps: CommandCenterFlowStep[] = [];

   private readonly destroy$ = new Subject<void>();
   private clockIntervalId: ReturnType<typeof setInterval> | null = null;

   constructor(
      private readonly orgContext: OrganizationContextService,
      private readonly jobsService: JobsService,
      private readonly invoiceService: InvoiceService,
      private readonly customersService: CustomersService
   ) {}

   ngOnInit(): void {
      this.startClock();
      this.refreshWeatherFromLocation();

      this.orgContext.org$
         .pipe(takeUntil(this.destroy$))
         .subscribe(org => {
            this.organizationId = org?.id ?? null;
            this.organizationName = org?.organizationName?.trim() || 'your organization';

            if (!this.organizationId) {
               this.flowSteps = [];
               return;
            }

            this.loadDashboard();
         });
   }

   ngOnDestroy(): void {
      if (this.clockIntervalId) {
         clearInterval(this.clockIntervalId);
      }

      this.destroy$.next();
      this.destroy$.complete();
   }

   get welcomeTitle(): string {
      return `Welcome, ${this.organizationName}`;
   }

   get welcomeSubtext(): string {
      return 'Here’s your command center for today—start with what matters most.';
   }

   private startClock(): void {
      this.updateCurrentDateTime();
      this.clockIntervalId = setInterval(() => this.updateCurrentDateTime(), 1000 * 30);
   }

   private updateCurrentDateTime(): void {
      this.currentDateTime = new Intl.DateTimeFormat('en-US', {
         weekday: 'long',
         month: 'long',
         day: 'numeric',
         year: 'numeric',
         hour: 'numeric',
         minute: '2-digit'
      }).format(new Date());
   }

   private loadCurrentWeather(): void {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
         this.weatherStatusText = 'Browser location unavailable — loading approximate local weather…';
         this.weatherIconClass = 'pi pi-spin pi-spinner';
         this.loadApproximateWeatherByIp();
         return;
      }

      navigator.geolocation.getCurrentPosition(
         position => {
            const { latitude, longitude } = position.coords;
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

            Promise.all([
               fetch(weatherUrl).then(response => response.json()),
               this.fetchLocationSummary(latitude, longitude)
            ])
               .then(([data, locationSummary]) => {
                  const current = data?.current_weather;
                  if (!current || typeof current.temperature !== 'number') {
                     this.weatherStatusText = 'Weather unavailable right now';
                     this.weatherIconClass = 'pi pi-cloud';
                     return;
                  }

                  const tempF = Math.round((current.temperature * 9) / 5 + 32);
                  const weatherLabel = this.getWeatherLabel(current.weathercode);
                  this.weatherSummary = locationSummary
                     ? `${tempF}°F · ${weatherLabel} · ${locationSummary}`
                     : `${tempF}°F · ${weatherLabel}`;
                  this.weatherStatusText = this.weatherSummary;
                  this.weatherIconClass = this.getWeatherIconClass(current.weathercode);
               })
               .catch(() => {
                  this.weatherSummary = '';
                  this.weatherStatusText = 'Weather unavailable right now';
                  this.weatherIconClass = 'pi pi-cloud';
               });
         },
         error => {
            this.weatherSummary = '';
            if (error.code === error.PERMISSION_DENIED) {
               this.weatherStatusText = 'Location blocked — using approximate local weather. Enable Location in the tune icon for exact weather.';
               this.weatherIconClass = 'pi pi-map-marker';
               this.loadApproximateWeatherByIp();
               return;
            }

            this.weatherStatusText = 'Unable to detect location right now — loading approximate local weather…';
            this.weatherIconClass = 'pi pi-spin pi-spinner';
            this.loadApproximateWeatherByIp();
         },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
   }

   private loadApproximateWeatherByIp(): void {
      fetch('https://ipapi.co/json/')
         .then(response => response.json())
         .then(location => {
            const latitude = Number(location?.latitude);
            const longitude = Number(location?.longitude);

            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
               throw new Error('Missing IP coordinates');
            }

            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
            return Promise.all([
               fetch(weatherUrl).then(response => response.json()),
               Promise.resolve(
                  [location?.city, location?.region_code || location?.region]
                     .filter(Boolean)
                     .join(', ')
               )
            ]);
         })
         .then(([data, locationSummary]) => {
            const current = data?.current_weather;
            if (!current || typeof current.temperature !== 'number') {
               this.weatherStatusText = 'Weather unavailable right now';
               this.weatherIconClass = 'pi pi-cloud';
               return;
            }

            const tempF = Math.round((current.temperature * 9) / 5 + 32);
            const weatherLabel = this.getWeatherLabel(current.weathercode);
            this.weatherSummary = locationSummary
               ? `${tempF}°F · ${weatherLabel} · ${locationSummary}`
               : `${tempF}°F · ${weatherLabel}`;
            this.weatherStatusText = `${this.weatherSummary} (approx)`;
            this.weatherIconClass = this.getWeatherIconClass(current.weathercode);
         })
         .catch(() => {
            this.weatherStatusText = 'Weather unavailable right now';
            this.weatherIconClass = 'pi pi-cloud';
         });
   }

   private fetchLocationSummary(latitude: number, longitude: number): Promise<string> {
      const reverseGeocodeUrl = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&count=1&language=en`;

      return fetch(reverseGeocodeUrl)
         .then(response => response.json())
         .then(data => {
            const firstResult = data?.results?.[0];
            const city = (firstResult?.city || firstResult?.name || firstResult?.locality) as string | undefined;
            const regionName = firstResult?.admin1 as string | undefined;
            const regionCode = firstResult?.admin1_code as string | undefined;
            const countryCode = firstResult?.country_code as string | undefined;

            if (countryCode === 'US') {
               const stateCode = regionCode?.includes('-') ? regionCode.split('-').pop() : regionCode;
               if (city && stateCode) {
                  return `${city}, ${stateCode}`;
               }

               return city || regionName || '';
            }

            if (city && regionName && city !== regionName) {
               return `${city}, ${regionName}`;
            }

            return city || regionName || '';
         })
         .catch(() => '');
   }

   refreshWeatherFromLocation(): void {
      this.weatherIconClass = 'pi pi-spin pi-spinner';
      this.weatherStatusText = 'Detecting local weather…';
      this.loadCurrentWeather();
   }

   private getWeatherLabel(code: number): string {
      if (code === 0) return 'Clear';
      if ([1, 2, 3].includes(code)) return 'Partly cloudy';
      if ([45, 48].includes(code)) return 'Foggy';
      if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
      if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
      if ([71, 73, 75, 77].includes(code)) return 'Snow';
      if ([80, 81, 82].includes(code)) return 'Rain showers';
      if ([85, 86].includes(code)) return 'Snow showers';
      if ([95, 96, 99].includes(code)) return 'Thunderstorms';
      return 'Weather update';
   }

   private getWeatherIconClass(code: number): string {
      if (code === 0) return 'pi pi-sun';
      if ([1, 2, 3, 45, 48].includes(code)) return 'pi pi-cloud';
      if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'pi pi-cloud-rain';
      if ([71, 73, 75, 77, 85, 86].includes(code)) return 'pi pi-sparkles';
      if ([95, 96, 99].includes(code)) return 'pi pi-bolt';
      return 'pi pi-cloud';
   }

   private loadDashboard(): void {
      forkJoin({
         jobs: this.jobsService.getAllJobs().pipe(catchError(() => of([] as Job[]))),
         invoices: this.invoiceService.getByOrganization().pipe(catchError(() => of([] as any[]))),
         customers: this.customersService.getAllByOrganization().pipe(catchError(() => of([] as any[])))
      })
         .pipe(takeUntil(this.destroy$))
         .subscribe(({ jobs, invoices, customers }) => {
            this.buildDashboardState(jobs, invoices, customers);
         });
   }

   private buildDashboardState(jobs: Job[], invoices: any[], customers: any[]): void {
      const openJobs = jobs.filter(job => !this.isJobDone(job));
      const jobsWithoutSchedule = openJobs
         .filter(job => !job.hasAssignments)
         .slice(0, 6);

      const invoiceAttention = invoices
         .filter(invoice => (invoice.balanceDue ?? 0) > 0)
         .slice(0, 6);

      const draftJobs = jobs.filter(job => job.lifecycleStatus === JobLifecycleStatus.Draft);

      this.flowSteps = [
         {
            step: 'Step 1',
            title: 'Capture customer details',
            description: 'Begin with a complete client profile so every job starts with clean context.',
            metric: `${this.toCount(customers.length)} total customers`,
            ctaLabel: 'Add customer',
            route: '/admin/clients/create',
            queryParams: {
               onboardingAction: 'open-client-drawer',
               returnTo: 'dashboard-command-center'
            },
            status: customers.length === 0 ? 'attention' : 'ready'
         },
         {
            step: 'Step 2',
            title: 'Create job brief',
            description: 'Define job title and client quickly, then move directly into execution.',
            metric: `${this.toCount(draftJobs.length)} draft jobs`,
            ctaLabel: 'Start new job',
            route: '/admin/jobs',
            queryParams: {
               onboardingAction: 'open-job-drawer',
               returnTo: 'dashboard-command-center'
            },
            status: draftJobs.length > 0 ? 'ready' : 'attention'
         },
         {
            step: 'Step 3',
            title: 'Lock the schedule',
            description: 'Convert unscheduled jobs into committed calendar slots.',
            metric: `${this.toCount(jobsWithoutSchedule.length)} waiting to schedule`,
            ctaLabel: 'Open jobs board',
            route: '/admin/jobs',
            queryParams: { returnTo: 'dashboard-command-center' },
            status: jobsWithoutSchedule.length > 0 ? 'attention' : 'clear'
         },
         {
            step: 'Step 4',
            title: 'Invoice and collect',
            description: 'Close the loop with timely invoicing and proactive collections.',
            metric: `${this.toCount(invoiceAttention.length)} invoices need follow-up`,
            ctaLabel: 'Review invoices',
            route: '/admin/invoices',
            queryParams: { returnTo: 'dashboard-command-center' },
            status: invoiceAttention.length > 0 ? 'attention' : 'clear'
         }
      ];
   }

   private isJobDone(job: Job): boolean {
      return [JobLifecycleStatus.Completed, JobLifecycleStatus.Cancelled, JobLifecycleStatus.Failed].includes(job.lifecycleStatus);
   }

   private toCount(value: number): string {
      return new Intl.NumberFormat('en-US').format(value || 0);
   }
}
