import { Component, Input } from '@angular/core';

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
    imports: [RouterModule],
    template: `
      @if (flowSteps.length) {
        <section class="workflow">
          <header class="workflow__header">
            <h2>Workflow radar</h2>
            <p>See what is waiting, in motion, and ready to complete.</p>
          </header>
          <div class="workflow__grid">
            @for (step of flowSteps; track step) {
              <article [class]="getFlowStepStatusClass(step)">
                <div class="workflow-step__meta">
                  <span>{{ step.step }}</span>
                  <strong>{{ getFlowStepStatusLabel(step) }}</strong>
                </div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.description }}</p>
                <small>{{ step.metric }}</small>
                <a [routerLink]="step.route" [queryParams]="step.queryParams || null">{{ step.ctaLabel }}</a>
              </article>
            }
          </div>
        </section>
      }
      `,
    styles: [`
      .workflow {
         display: grid;
         gap: 0.75rem;
      }

      .workflow__header h2 {
         margin: 0;
         font-size: 0.95rem;
         font-weight: 700;
         color: #2a3f54;
      }

      .workflow__header p {
         margin: 0.2rem 0 0;
         font-size: 0.76rem;
         color: #6c7a89;
      }

      .workflow__grid {
         display: grid;
         grid-template-columns: repeat(2, minmax(0, 1fr));
         gap: 0.6rem;
      }

      .workflow-step {
         border: 1px solid #e8edf5;
         border-radius: 0.55rem;
         padding: 0.65rem;
         background: #fbfcff;
         display: grid;
         gap: 0.35rem;
      }

      .workflow-step h3 {
         margin: 0;
         font-size: 0.82rem;
         font-weight: 700;
         color: #2a3f54;
      }

      .workflow-step p {
         margin: 0;
         font-size: 0.72rem;
         color: #6c7a89;
      }

      .workflow-step small {
         font-size: 0.7rem;
         color: #6c7a89;
      }

      .workflow-step a {
         margin-top: 0.1rem;
         font-size: 0.72rem;
         font-weight: 700;
         color: #1c86ff;
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
         color: #6c7a89;
         font-weight: 700;
      }

      .workflow-step__meta strong {
         font-size: 0.66rem;
         font-weight: 700;
         padding: 0.14rem 0.36rem;
         border-radius: 0.35rem;
      }

      .workflow-step--attention {
         border-left: 4px solid rgba(240, 173, 78, 0.9);
      }

      .workflow-step--attention .workflow-step__meta strong {
         background: rgba(240, 173, 78, 0.16);
         color: #b8741d;
      }

      .workflow-step--ready {
         border-left: 4px solid rgba(28, 134, 255, 0.9);
      }

      .workflow-step--ready .workflow-step__meta strong {
         background: rgba(28, 134, 255, 0.12);
         color: #1c86ff;
      }

      .workflow-step--clear {
         border-left: 4px solid rgba(26, 187, 156, 0.9);
      }

      .workflow-step--clear .workflow-step__meta strong {
         background: rgba(26, 187, 156, 0.15);
         color: #1abb9c;
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
    imports: [RouterModule, DashboardComprehensiveWorkflowComponent],
    templateUrl: './jobflow-command-center.component.html',
    styleUrl: './jobflow-command-center.component.scss'
})
export class JobflowCommandCenterComponent {
   @Input() primaryActions: CommandCenterAction[] = [];
   @Input() flowSteps: CommandCenterFlowStep[] = [];
}
