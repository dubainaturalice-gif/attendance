import { getSQL } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = getSQL();
    const result = await sql`
      SELECT id, name, section, grp, location, active 
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
      RETURNING id, name, section, grp, location, active
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
    const { id, name, section, grp, location } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const result = await sql`
      UPDATE employees SET name = ${name}, section = ${section}, grp = ${grp}, location = ${location || ''}
      WHERE id = ${id}
      RETURNING id, name, section, grp, location, active
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
