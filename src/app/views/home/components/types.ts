export type Feature = {
    title: string;
    imgSrc: string;
  }
  
  export type Service = {
    title: string;
    description: string;
    icon: string;
    link: string;
    bgClass?: string;
    textClass: string;
  }
  
  export type TeamMember = {
    name: string;
    role: string;
    imageUrl: string;
    profileLink?: string;
  }
  
  export type Testimonial = {
    rating: number;
    text: string;
    name: string;
    position: string;
    avatar: string;
  }
  
  export type PricingPlan = {
    name: string;
    price: number;
    annualPrice: number;
    duration: string;
    features: string[],
    savings: string;
    description: string;
    badge: string;
    buttonClass: string;
  }