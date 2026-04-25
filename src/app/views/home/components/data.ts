import type { PricingPlan, Service, TeamMember, Testimonial } from "./types";

export const services: Service[] = [
  {
    title: 'Job Management',
    description: 'Create, assign, and close jobs from any device. Every status change logged automatically.',
    icon: 'ti-briefcase',
    link: '#features',
    textClass: 'text-muted'
  },
  {
    title: 'Client Hub',
    description: 'Your clients view jobs, accept estimates, and pay invoices from a secure link — no account needed.',
    icon: 'ti-users',
    link: '#features',
    bgClass: 'bg-primary bg-shape',
    textClass: 'text-white'
  },
  {
    title: 'Estimates & Invoices',
    description: 'Send estimates in minutes, convert to invoices in one click, and collect payment the same day.',
    icon: 'ti-file-invoice',
    link: '#features',
    textClass: 'text-muted'
  },
  {
    title: 'Follow-Up Automation',
    description: 'Multi-step email and SMS sequences run automatically — so no lead or invoice falls through the cracks.',
    icon: 'ti-refresh-dot',
    link: '#features',
    textClass: 'text-muted'
  },
  {
    title: 'Dispatch & Scheduling',
    description: 'Visual dispatch board with drag-drop assignments, conflict detection, and travel buffers.',
    icon: 'ti-map-pin',
    link: '#features',
    textClass: 'text-muted'
  },
  {
    title: 'Payments Anywhere',
    description: 'Accept payments via Stripe or Square — in person, by invoice link, or through the Client Hub.',
    icon: 'ti-credit-card',
    link: '#features',
    textClass: 'text-muted'
  }
];

export const teamMembers: TeamMember[] = [
  {
    name: 'Kenneth Simpson',
    role: 'CEO/Founder',
    imageUrl: '/images/team/user-1.jpg'
  },
  {
    name: 'James Peck',
    role: 'Founder',
    imageUrl: '/images/team/user-3.jpg'
  }
];

export const testimonials: Testimonial[] = [
  {
    rating: 5,
    text: '"Before JobFlow I was using three separate apps and still missing follow-ups. Now everything is in one place and clients can pay from a link I text them. Game changer."',
    name: 'Marcus R.',
    position: 'Owner, Riverside Landscaping',
    avatar: '/images/team/avatar-8.jpg'
  },
  {
    rating: 5,
    text: '"My crew gets notified the moment a job is assigned. No more morning chaos trying to figure out who goes where. Scheduling used to take me an hour — now it takes five minutes."',
    name: 'Sandra K.',
    position: 'Owner, CleanPro Services',
    avatar: '/images/team/avatar-5.jpg'
  },
  {
    rating: 4.8,
    text: '"Clients love the estimate portal. They can approve or ask for changes without calling me. I closed a $3,400 job on a Saturday at 10pm — client approved from their phone."',
    name: 'Darnell T.',
    position: 'Owner, D&T HVAC',
    avatar: '/images/team/avatar-3.jpg'
  }
];

export const plans: PricingPlan[] = [
  {
    name: 'Go',
    price: 29,
    annualPrice: 278,
    duration: 'Month',
    savings: 'Save $70',
    description: 'Core workflow for solo operators and small crews.',
    badge: 'bg-success-subtle text-success',
    buttonClass: 'btn-outline-primary',
    features: [
      'Jobs, invoices, and estimates',
      'Client Hub — no client login required',
      'Follow-Up Automation',
      'Messaging (internal + client)',
      'Stripe & Square payments',
      'Mobile app (iOS + Android)'
    ]
  },
  {
    name: 'Flow',
    price: 59,
    annualPrice: 564,
    duration: 'Month',
    savings: 'Save $144',
    description: 'For growing teams that need scheduling and control.',
    badge: 'bg-primary-subtle text-primary',
    buttonClass: 'btn-primary',
    features: [
      'Everything in Go',
      'Employee management + roles',
      'Dispatch board',
      'Pricebook & service catalog',
      'Custom branding (logo + colors)',
      'Workflow settings'
    ]
  },
  {
    name: 'Max',
    price: 89,
    annualPrice: 864,
    duration: 'Month',
    savings: 'Save $204',
    description: 'Full operations visibility for scaling businesses.',
    badge: 'bg-warning-subtle text-warning',
    buttonClass: 'btn-outline-primary',
    features: [
      'Everything in Flow',
      'Advanced dispatch & reporting',
      'Revenue and job analytics',
      'Custom integrations',
      'Priority support'
    ]
  }
];
