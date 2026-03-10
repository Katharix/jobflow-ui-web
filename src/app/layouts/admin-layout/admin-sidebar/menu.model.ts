export type SubscriptionPlan = 'Go' | 'Flow' | 'Max';

export interface MenuItem {
  label: string;
  icon?: string;
  link?: string;
  subItems?: MenuItem[];
  minPlan?: SubscriptionPlan;
  isTitle?: boolean;
  badge?: {
    variant: string;
    text: string;
  };
}
