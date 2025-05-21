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

    const response = await fetch(`${BACKEND_URL}/api/processing-batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return new NextResponse(
        JSON.stringify({ error: data.error || 'Failed to create processing batch on backend', details: data.details }),
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in Next.js POST /api/processing-batches route:', error);
    if (error instanceof Response) {
      return error;
    }
    return new NextResponse(JSON.stringify({ error: 'Internal server error in Next.js API' }), { status: 500 });
  }
}
