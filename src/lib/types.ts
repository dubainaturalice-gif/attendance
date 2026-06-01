export interface Employee {
  id: number;
  name: string;
  section: string;
  grp: string;
  location: string;
  off_day: string;
  active?: boolean;
}

export interface AttendanceRecord {
  id?: number;
  employee_id: number;
  date: string;
  status: string; // "P", "OT", "P,OT", "O", "L", "V"
}

export interface DailyData {
  employees: Employee[];
  attendance: Record<number, string>; // employee_id -> status
}

export interface MonthlyData {
  employees: Employee[];
  attendance: Record<number, Record<string, string>>; // employee_id -> { date -> status }
}
