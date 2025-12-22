
import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
const API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handler for OPTIONS requests (preflight)
export async function OPTIONS() {
    return new Response(null, { headers: CORS_HEADERS, status: 204 });
}

// Handler for GET requests
export async function GET(request: Request) {
  try {
    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;
    
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch from external API' },
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: CORS_HEADERS });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal proxy server error', details: errorMessage },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
