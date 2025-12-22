
'use server';

import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';

// This function handles the proxy request.
// It receives the API key from the client-side fetch and uses it to call the external API.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = body.apiKey;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not provided in proxy request.' }, { status: 400 });
    }

    const apiHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };

    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: apiHeaders,
      cache: 'no-store', // Important for dynamic data
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error parsing API error response." }));
        // Important: Return the error from the external API to the client
        return NextResponse.json({ error: errorData.error || `Error ${response.status} fetching imputation data.` }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Return the successful response from the external API to our client
    return NextResponse.json(data, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST for this proxy
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown proxy error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// The OPTIONS handler is still necessary for the browser's preflight check.
export async function OPTIONS(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Be more specific in production if possible
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new Response(null, { headers, status: 204 });
}
