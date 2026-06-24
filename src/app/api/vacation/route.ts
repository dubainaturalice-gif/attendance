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

export async function GET() {
  try {
    const sql = getSQL();
    const result = await sql`
      SELECT id, employee_id, start_date, end_date
      FROM vacation_periods
      ORDER BY employee_id, start_date
    `;
    const periods = result.map((r) => ({
      id: r.id as number,
      employee_id: r.employee_id as number,
      start_date: formatDate(r.start_date),
      end_date: r.end_date ? formatDate(r.end_date) : null,
    }));
    return NextResponse.json({ periods });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = getSQL();
    const { employee_id, start_date } = await request.json();
    if (!employee_id || !start_date) {
      return NextResponse.json({ error: 'Missing employee_id or start_date' }, { status: 400 });
    }
    await sql`
      UPDATE vacation_periods SET end_date = ${start_date}
      WHERE employee_id = ${employee_id} AND end_date IS NULL
    `;
    const result = await sql`
      INSERT INTO vacation_periods (employee_id, start_date)
      VALUES (${employee_id}, ${start_date})
      RETURNING id, employee_id, start_date, end_date
    `;
    await sql`UPDATE employees SET on_vacation = true WHERE id = ${employee_id}`;
    const period = result[0];
    return NextResponse.json({
      period: {
        id: period.id as number,
        employee_id: period.employee_id as number,
        start_date: formatDate(period.start_date),
        end_date: null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const sql = getSQL();
    const { employee_id, end_date } = await request.json();
    if (!employee_id || !end_date) {
      return NextResponse.json({ error: 'Missing employee_id or end_date' }, { status: 400 });
    }
    const result = await sql`
      UPDATE vacation_periods
      SET end_date = ${end_date}
      WHERE employee_id = ${employee_id} AND end_date IS NULL
      RETURNING id, employee_id, start_date, end_date
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: 'No active vacation period found' }, { status: 404 });
    }
    await sql`UPDATE employees SET on_vacation = false WHERE id = ${employee_id}`;
    const period = result[0];
    return NextResponse.json({
      period: {
        id: period.id as number,
        employee_id: period.employee_id as number,
        start_date: formatDate(period.start_date),
        end_date: formatDate(period.end_date),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sql = getSQL();
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing period id' }, { status: 400 });
    }
    const result = await sql`
      DELETE FROM vacation_periods WHERE id = ${id}
      RETURNING id, employee_id
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }
    const empId = result[0].employee_id;
    const remaining = await sql`
      SELECT id FROM vacation_periods WHERE employee_id = ${empId} AND end_date IS NULL
    `;
    if (remaining.length === 0) {
      await sql`UPDATE employees SET on_vacation = false WHERE id = ${empId}`;
    }
    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const sql = getSQL();
    const { id, start_date, end_date } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing period id' }, { status: 400 });
    }
    if (!start_date && end_date === undefined) {
      return NextResponse.json({ error: 'Missing start_date or end_date' }, { status: 400 });
    }
    let result;
    if (start_date && end_date !== undefined) {
      result = await sql`
        UPDATE vacation_periods SET start_date = ${start_date}, end_date = ${end_date || null}
        WHERE id = ${id}
        RETURNING id, employee_id, start_date, end_date
      `;
    } else if (start_date) {
      result = await sql`
        UPDATE vacation_periods SET start_date = ${start_date}
        WHERE id = ${id}
        RETURNING id, employee_id, start_date, end_date
      `;
    } else {
      result = await sql`
        UPDATE vacation_periods SET end_date = ${end_date || null}
        WHERE id = ${id}
        RETURNING id, employee_id, start_date, end_date
      `;
    }
    if (result.length === 0) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 });
    }
    const period = result[0];
    return NextResponse.json({
      period: {
        id: period.id as number,
        employee_id: period.employee_id as number,
        start_date: formatDate(period.start_date),
        end_date: period.end_date ? formatDate(period.end_date) : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
