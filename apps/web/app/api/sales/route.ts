import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'http://localhost:5000';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
    }

    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return new NextResponse(JSON.stringify(data), { status: response.status });
  } catch (error) {
    console.error('Error in Next.js POST /api/sales:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
