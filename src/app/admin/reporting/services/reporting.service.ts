import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../services/shared/base-api.service';

export interface ReportDashboard {
  revenue: RevenueOverview;
  jobPerformance: JobPerformance;
  employeeUtilization: EmployeeUtilization[];
  topClients: ClientInsight[];
}

export interface RevenueOverview {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  monthlyTrend: MonthlyRevenue[];
}

export interface MonthlyRevenue {
  month: string;
  billed: number;
  collected: number;
}

export interface JobPerformance {
  totalJobs: number;
  draftCount: number;
  bookedCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  avgCompletionDays: number;
  completionRate: number;
  monthlyTrend: MonthlyJobCount[];
}

export interface MonthlyJobCount {
  month: string;
  created: number;
  completed: number;
}

export interface EmployeeUtilization {
  employeeId: string;
  employeeName: string;
  scheduledHours: number;
  actualHours: number;
  assignmentCount: number;
  completedCount: number;
}

export interface ClientInsight {
  clientId: string;
  clientName: string;
  jobCount: number;
  totalRevenue: number;
  outstandingBalance: number;
}

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private api = inject(BaseApiService);
  private readonly endpoint = 'report/';

  getDashboard(startDate?: string, endDate?: string): Observable<ReportDashboard> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.api.get<ReportDashboard>(`${this.endpoint}dashboard`, params);
  }
}
