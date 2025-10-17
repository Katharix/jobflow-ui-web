export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  roles?: string[];
  active?: boolean;
  allowDeepMatch?: boolean;
}
