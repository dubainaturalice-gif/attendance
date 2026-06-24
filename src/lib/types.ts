export interface Employee {
  id: number;
  name: string;
  section: string;
  grp: string;
  location: string;
  off_day: string;
  on_vacation: boolean;
  active?: boolean;
}

export interface VacationPeriod {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string | null;
}

export interface AttendanceRecord {
  id?: number;
  employee_id: number;
  date: string;
  status: string; // "P", "OT", "O", "L", "V"
}

export interface DailyData {
  employees: Employee[];
  attendance: Record<number, string>; // employee_id -> status
  vacationPeriods: VacationPeriod[];
}

export interface MonthlyData {
  employees: Employee[];
  attendance: Record<number, Record<string, string>>; // employee_id -> { date -> status }
  vacationPeriods: VacationPeriod[];
}
