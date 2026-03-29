export interface EmployeeRolePresetItem {
  id?: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface EmployeeRolePreset {
  id?: string;
  name: string;
  description?: string;
  industryKey?: string | null;
  isSystem: boolean;
  organizationId?: string | null;
  items: EmployeeRolePresetItem[];
}

export interface EmployeeRolePresetApplyResult {
  created: number;
  updated: number;
  skipped: number;
}
