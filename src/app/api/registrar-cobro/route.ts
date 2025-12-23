
import { NextResponse } from 'next/server';
import { FINANCE_API_KEY, API_BASE_URL } from '@/lib/finance-api';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    // First, check for Authorization header from the client (our app)
    const clientApiKey = request.headers.get('Authorization')?.split(' ')[1];
    if (clientApiKey !== process.env.NEXT_PUBLIC_APP_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();

    const externalApiResponse = await fetch(`${API_BASE_URL}/api/registrar-cobro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FINANCE_API_KEY}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const responseData = await externalApiResponse.json();

    if (!externalApiResponse.ok) {
      throw new Error(responseData.error || 'Error from external finance API');
    }

    return NextResponse.json(responseData, { status: 201, headers: corsHeaders });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
