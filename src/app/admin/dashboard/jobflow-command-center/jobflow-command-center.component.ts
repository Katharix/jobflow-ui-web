import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface CommandCenterAction {
   label: string;
   description: string;
   route: string;
   icon: string;
   queryParams?: Record<string, string>;
}

export interface CommandCenterFlowStep {
   step: string;
   title: string;
   description: string;
   metric: string;
   ctaLabel: string;
   route: string;
   queryParams?: Record<string, string>;
   status: 'ready' | 'attention' | 'clear';
}

@Component({
   selector: 'app-dashboard-comprehensive-workflow',
   standalone: true,
   imports: [CommonModule, RouterModule],
   template: `
      <section class="workflow" *ngIf="flowSteps.length">
         <header class="workflow__header">
            <h2>Comprehensive workflow</h2>
            <p>Two clear steps per row. Follow left to right.</p>
         </header>

         <div class="workflow__grid">
            <article *ngFor="let step of flowSteps" [class]="getFlowStepStatusClass(step)">
               <div class="workflow-step__meta">
                  <span>{{ step.step }}</span>
                  <strong>{{ getFlowStepStatusLabel(step) }}</strong>
               </div>

               <h3>{{ step.title }}</h3>
               <p>{{ step.description }}</p>
               <small>{{ step.metric }}</small>

               <a [routerLink]="step.route" [queryParams]="step.queryParams || null">{{ step.ctaLabel }}</a>
            </article>
         </div>
      </section>
   `,
   styles: [`
      .workflow {
         display: grid;
         gap: 0.75rem;
      }

      .workflow__header h2 {
         margin: 0;
         font-size: 1rem;
         font-weight: 700;
         color: var(--bs-heading-color);
      }

      .workflow__header p {
         margin: 0.2rem 0 0;
         font-size: 0.8rem;
         color: var(--bs-secondary-color);
      }

      .workflow__grid {
         display: grid;
         grid-template-columns: repeat(2, minmax(0, 1fr));
         gap: 0.6rem;
      }

      .workflow-step {
         border: 1px solid var(--bs-border-color);
         border-radius: 0.75rem;
         padding: 0.7rem;
         background: var(--bs-body-bg);
         display: grid;
         gap: 0.4rem;
      }

      .workflow-step h3 {
         margin: 0;
         font-size: 0.86rem;
         font-weight: 700;
         color: var(--bs-heading-color);
      }

      .workflow-step p {
         margin: 0;
         font-size: 0.74rem;
         color: var(--bs-secondary-color);
      }

      .workflow-step small {
         font-size: 0.72rem;
         color: var(--bs-secondary-color);
      }

      .workflow-step a {
         margin-top: 0.1rem;
         font-size: 0.75rem;
         font-weight: 700;
         color: var(--bs-primary);
         text-decoration: none;
         justify-self: start;
      }

      .workflow-step__meta {
         display: flex;
         justify-content: space-between;
         align-items: center;
         gap: 0.4rem;
      }

      .workflow-step__meta span {
         font-size: 0.7rem;
         text-transform: uppercase;
         letter-spacing: 0.04em;
         color: var(--bs-secondary-color);
         font-weight: 700;
      }

      .workflow-step__meta strong {
         font-size: 0.66rem;
         font-weight: 700;
         padding: 0.14rem 0.36rem;
         border-radius: 999rem;
      }

      .workflow-step--attention {
         border-left: 4px solid rgba(var(--bs-warning-rgb), 0.9);
      }

      .workflow-step--attention .workflow-step__meta strong {
         background: rgba(var(--bs-warning-rgb), 0.16);
         color: var(--bs-warning-text-emphasis, var(--bs-warning));
      }

      .workflow-step--ready {
         border-left: 4px solid rgba(var(--bs-primary-rgb), 0.9);
      }

      .workflow-step--ready .workflow-step__meta strong {
         background: rgba(var(--bs-primary-rgb), 0.12);
         color: var(--bs-primary);
      }

      .workflow-step--clear {
         border-left: 4px solid rgba(var(--bs-success-rgb), 0.9);
      }

      .workflow-step--clear .workflow-step__meta strong {
         background: rgba(var(--bs-success-rgb), 0.15);
         color: var(--bs-success);
      }

      @media (max-width: 575px) {
         .workflow__grid {
            grid-template-columns: 1fr;
         }
      }
   `]
})
export class DashboardComprehensiveWorkflowComponent {
   @Input() flowSteps: CommandCenterFlowStep[] = [];

   getFlowStepStatusClass(step: CommandCenterFlowStep): string {
      return `workflow-step workflow-step--${step.status}`;
   }

   getFlowStepStatusLabel(step: CommandCenterFlowStep): string {
      switch (step.status) {
         case 'ready':
            return 'Ready';
         case 'attention':
            return 'Needs attention';
         default:
            return 'Clear';
      }
   }
}

@Component({
   selector: 'app-jobflow-command-center',
   standalone: true,
   imports: [CommonModule, RouterModule, DashboardComprehensiveWorkflowComponent],
   templateUrl: './jobflow-command-center.component.html',
   styleUrl: './jobflow-command-center.component.scss'
})
export class JobflowCommandCenterComponent {
   @Input() primaryActions: CommandCenterAction[] = [];
   @Input() flowSteps: CommandCenterFlowStep[] = [];
}
