import { getSQL } from '@/lib/db';
import { NextResponse } from 'next/server';

function formatDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().split('T')[0];
  if (typeof d === 'string') {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
    return d;
  }
  return '';
}

export async function GET(request: Request) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    const employees = await sql`
      SELECT id, name, section, grp, location, COALESCE(off_day, '') as off_day, COALESCE(on_vacation, false) as on_vacation
      FROM employees 
      WHERE active = true 
      ORDER BY grp, section, name
    `;

    // Always fetch vacation periods
    const vacPeriodsResult = await sql`
      SELECT id, employee_id, start_date, end_date
      FROM vacation_periods
      ORDER BY employee_id, start_date
    `;
    const vacationPeriods = vacPeriodsResult.map((r) => ({
      id: r.id as number,
      employee_id: r.employee_id as number,
      start_date: formatDate(r.start_date),
      end_date: r.end_date ? formatDate(r.end_date) : null,
    }));

    if (date) {
      const attResult = await sql`
        SELECT employee_id, status 
        FROM attendance 
        WHERE date = ${date}
      `;
      const attendance: Record<number, string> = {};
      for (const row of attResult) {
        attendance[row.employee_id as number] = row.status as string;
      }
      return NextResponse.json({ employees, attendance, vacationPeriods });
    }

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startDate = `${month}-01`;
      const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
      const endDate = `${nextMonth}-01`;

      const attResult = await sql`
        SELECT employee_id, date, status 
        FROM attendance 
        WHERE date >= ${startDate}::date AND date < ${endDate}::date
      `;
      const attendance: Record<number, Record<string, string>> = {};
      for (const row of attResult) {
        const empId = row.employee_id as number;
        if (!attendance[empId]) attendance[empId] = {};
        const d = new Date(row.date as string);
        const dateStr = d.toISOString().split('T')[0];
        attendance[empId][dateStr] = row.status as string;
      }
      return NextResponse.json({ employees, attendance, vacationPeriods });
    }

    return NextResponse.json({ error: 'Missing date or month parameter' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = getSQL();
    const { records } = await request.json();
    
    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing records array' }, { status: 400 });
    }

    let saved = 0;
    for (const record of records) {
      if (record.status) {
        await sql`
          INSERT INTO attendance (employee_id, date, status) 
          VALUES (${record.employee_id}, ${record.date}, ${record.status})
          ON CONFLICT (employee_id, date) 
          DO UPDATE SET status = EXCLUDED.status
        `;
      } else {
        await sql`
          DELETE FROM attendance 
          WHERE employee_id = ${record.employee_id} AND date = ${record.date}
        `;
      }
      saved++;
    }

    return NextResponse.json({ success: true, saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startDate = `${month}-01`;
      const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
      const endDate = `${nextMonth}-01`;
      await sql`DELETE FROM attendance WHERE date >= ${startDate}::date AND date < ${endDate}::date`;
      return NextResponse.json({ success: true });
    }

    if (date) {
      await sql`DELETE FROM attendance WHERE date = ${date}::date`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing date or month parameter' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
