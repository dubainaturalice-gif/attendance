import { getSQL } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const sql = getSQL();
    const { username, password } = await request.json();
    
    const result = await sql`
      SELECT username, role FROM admin_users 
      WHERE username = ${username} AND password = ${password}
    `;
    
    if (result.length > 0) {
      return NextResponse.json({ 
        success: true, 
        user: { username: result[0].username, role: result[0].role } 
      });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid credentials' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
