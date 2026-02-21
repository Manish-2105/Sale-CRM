export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  designation: string;
}

export interface Target {
  id: number;
  user_id: number;
  year: number;
  month: number;
  sales_target_yearly: number;
  sales_target_monthly: number;
  call_target_monthly: number;
  email_target_monthly: number;
  whatsapp_target_monthly: number;
  social_target_monthly: number;
}

export interface Report {
  id: number;
  user_id: number;
  date: string;
  calls: number;
  emails: number;
  whatsapp: number;
  social: number;
  revenue: number;
  leads: number;
  followups: number;
  remarks: string;
  kpi_data: string;
}

export interface KPI {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}
