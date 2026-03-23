export interface EmployeeRole {
   id: string | undefined;
   name: string;
   description?: string;
}

export interface EmployeeRoleUsage {
   roleId: string;
   employeeCount: number;
}
