import { getSQL } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = getSQL();
    const result = await sql`
      SELECT id, name, section, grp, location, active, COALESCE(off_day, '') as off_day, COALESCE(on_vacation, false) as on_vacation
      FROM employees 
      WHERE active = true 
      ORDER BY grp, section, name
    `;
    return NextResponse.json({ employees: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = getSQL();
    const { name, section, grp, location } = await request.json();
    const result = await sql`
      INSERT INTO employees (name, section, grp, location) 
      VALUES (${name}, ${section}, ${grp}, ${location || ''})
      RETURNING id, name, section, grp, location, active, COALESCE(off_day, '') as off_day, COALESCE(on_vacation, false) as on_vacation
    `;
    return NextResponse.json({ employee: result[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // If only off_day is being updated
    if ('off_day' in body && !('name' in body) && !('on_vacation' in body)) {
      const result = await sql`
        UPDATE employees SET off_day = ${body.off_day}
        WHERE id = ${id}
        RETURNING id, name, section, grp, location, active, COALESCE(off_day, '') as off_day, COALESCE(on_vacation, false) as on_vacation
      `;
      return NextResponse.json({ employee: result[0] });
    }

    // If only on_vacation is being updated
    if ('on_vacation' in body && !('name' in body) && !('off_day' in body)) {
      const result = await sql`
        UPDATE employees SET on_vacation = ${body.on_vacation}
        WHERE id = ${id}
        RETURNING id, name, section, grp, location, active, COALESCE(off_day, '') as off_day, COALESCE(on_vacation, false) as on_vacation
      `;
      return NextResponse.json({ employee: result[0] });
    }

    // Full employee update
    const { name, section, grp, location } = body;
    const offDay = body.off_day !== undefined ? body.off_day : '';
    const onVacation = body.on_vacation !== undefined ? body.on_vacation : false;
    const result = await sql`
      UPDATE employees SET name = ${name}, section = ${section}, grp = ${grp}, location = ${location || ''}, off_day = ${offDay}, on_vacation = ${onVacation}
      WHERE id = ${id}
      RETURNING id, name, section, grp, location, active, COALESCE(off_day, '') as off_day, COALESCE(on_vacation, false) as on_vacation
    `;
    return NextResponse.json({ employee: result[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }
    await sql`UPDATE employees SET active = false WHERE id = ${parseInt(id)}`;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
