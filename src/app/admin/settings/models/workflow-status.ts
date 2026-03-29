export interface WorkflowStatusDto {
  statusKey: string;
  label: string;
  sortOrder: number;
}

export interface WorkflowStatusUpsertRequestDto {
  statusKey: string;
  label: string;
  sortOrder: number;
}
