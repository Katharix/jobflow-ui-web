export interface Feature {
    title: string;
    imgSrc: string;
  }
  
  export interface Service {
    title: string;
    description: string;
    icon: string;
    link: string;
    bgClass?: string;
    textClass: string;
  }
  
  export interface TeamMember {
    name: string;
    role: string;
    imageUrl: string;
    profileLink?: string;
  }
  
  export interface Testimonial {
    rating: number;
    text: string;
    name: string;
    position: string;
    avatar: string;
  }
  
  export interface PricingPlan {
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