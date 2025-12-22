
'use server';

import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
const API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW';

const apiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};

export async function GET(request: Request) {
  const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

  try {
    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: apiHeaders,
      cache: 'no-store',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error parsing API error response." }));
        throw new Error(errorData.error || `Error ${response.status} fetching imputation data.`);
    }
    
    const data = await response.json();
    
    // Return the response from the external API, including CORS headers for client-side fetch
    return NextResponse.json(data, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });

  } catch (error) {
    console.error('[FINANCE PROXY ERROR]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown proxy error';
    return NextResponse.json({ error: `Failed to connect to the finance API via proxy: ${errorMessage}` }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new Response(null, { headers, status: 204 });
}
