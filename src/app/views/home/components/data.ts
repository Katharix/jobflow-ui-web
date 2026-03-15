import type { PricingPlan, Service, TeamMember, Testimonial } from "./types";

export const services: Service[] = [
  {
    title: 'Custom Software Development',
    description: 'We understand that every business has unique needs. Our team can create custom software solutions tailored specifically.',
    icon: 'ti-device-desktop-analytics',
    link: '#!',
    textClass: 'text-muted'
  },
  {
    title: 'Integration Services',
    description: 'Our software seamlessly integrates with a variety of platforms and tools. We provide integration services to ensure.',
    icon: 'ti-webhook',
    link: '#!',
    bgClass: 'bg-primary bg-shape',
    textClass: 'text-white'
  },
  {
    title: 'Training and Onboarding',
    description: 'We offer thorough training programs and onboarding sessions to help your team get up to speed with our software quickly.',
    icon: 'ti-heart-handshake',
    link: '#!',
    textClass: 'text-muted'
  },
  {
    title: 'Consulting Services',
    description: 'Our experts provide strategic consulting to help you leverage our software for maximum benefit. We offer insights.',
    icon: 'ti-message-user',
    link: '#!',
    textClass: 'text-muted'
  },
  {
    title: 'Updates and Maintenance',
    description: 'We continually update our software to incorporate the latest advancements and features. Our maintenance services.',
    icon: 'ti-refresh-dot',
    link: '#!',
    textClass: 'text-muted'
  },
  {
    title: 'Technical Support',
    description: 'Our dedicated support team is available 24/7 to assist you with any technical issues you may encounter.',
    icon: 'ti-headset',
    link: '#!',
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
  },
  {
    name: 'Tina F. Yates',
    role: 'Web Developer',
    imageUrl: '/images/team/user-2.jpg'
  },
  {
    name: 'Sidney J. Long',
    role: 'Web Designer',
    imageUrl: '/images/team/user-4.jpg'
  }
];

export const testimonials: Testimonial[] = [
  {
    rating: 4.7,
    text: `"Skywave has completely transformed the way we operate. The user-friendly interface and seamless integration with our existing tools have saved us countless hours of work. The support team is incredibly responsive and always goes above and beyond to help us. We've tried other solutions, but nothing compares to the efficiency and reliability of this software. It’s truly the best investment we've made for our business!"`,
    name: 'Danilo Tanic',
    position: 'Head of Design at Paypal',
    avatar: '/images/team/avatar-8.jpg'
  },
  {
    rating: 4.4,
    text: `"Company is a game-changer for our team. The intuitive design and powerful features have streamlined our processes and boosted our productivity. The onboarding process was smooth, thanks to the excellent training and support provided by the team. We’ve seen significant improvements in our workflow since implementing this software. I highly recommend it to anyone looking to enhance their operations."`,
    name: 'Samuel Kane',
    position: 'Project Manager at Shopify',
    avatar: '/images/team/avatar-5.jpg'
  },
  {
    rating: 4.6,
    text: `"Team has exceeded our expectations in every way. From the moment we started using it, our productivity soared, and tasks that used to take hours are now completed in minutes. The customer support is outstanding—always quick to respond and incredibly helpful. This software has become an indispensable part of our daily operations, and we can't imagine working without it."`,
    name: 'James Arthur',
    position: 'Senior Manager at Amazon',
    avatar: '/images/team/avatar-3.jpg'
  },
  {
    rating: 4.9,
    text: `"Skywave has been a total game-changer for our business. The ease of use and the flexibility it offers have allowed us to customize our workflow like never before. The regular updates and new features keep us ahead of the curve, and the support team is always there when we need them. We've seen a remarkable improvement in our team's efficiency, and I can't recommend this software enough."`,
    name: 'Olga D. Ward',
    position: 'Sales Manager',
    avatar: '/images/team/avatar-4.jpg'
  }
];

export const plans: PricingPlan[] = [
  {
    name: 'Go',
    price: 29,
    annualPrice: 278,
    duration: 'Month',
    savings: 'Save $70',
    description: 'Best for solo operators who need a reliable daily workflow.',
    badge: 'bg-success-subtle text-success',
    buttonClass: 'btn-primary',
    features: [
      'Job scheduling and calendar view',
      'Estimates, invoices, and payments',
      'Customer records and job history',
      'Email notifications',
    ]
  },
  {
    name: 'Flow',
    price: 59,
    annualPrice: 564,
    duration: 'Month',
    savings: 'Save $144',
    description: 'Best for growing teams managing multiple jobs per day.',
    badge: 'bg-success-subtle text-success',
    buttonClass: 'btn-info',
    features: [
      'Everything in Go',
      'Team and crew assignments',
      'Advanced scheduling workflow',
      'Text message reminders',
      'Estimate follow-up tools'
    ]
  },
  {
    name: 'Max',
    price: 89,
    annualPrice: 864,
    duration: 'Month',
    savings: 'Save $204',
    description: 'Best for scaling operations that need automation and control.',
    badge: 'bg-success-subtle text-success',
    buttonClass: 'btn-info',
    features: [
      'Everything in Flow',
      'Custom branding (logo, colors)',
      'Automated job follow-ups',
      'Priority support',
      'Expanded admin controls'
    ]
  }
];