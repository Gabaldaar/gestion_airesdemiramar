
import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
const API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW'; // This should be in an environment variable

const apiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};

export async function GET(request: Request) {
    try {
        const apiResponse = await fetch(`${API_BASE_URL}/api/datos-imputacion`, {
            method: 'GET',
            headers: apiHeaders,
            // We ask the downstream API to revalidate, but we also control our own cache.
            // Using a short revalidation here for development proxy.
            next: { revalidate: 60 } 
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            // Forward the error from the external API
            return NextResponse.json(
                { error: data.error || 'Failed to fetch from external API' },
                { status: apiResponse.status }
            );
        }

        // Return the successful response with CORS headers for our own app
        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error('[API Proxy Error]:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown proxy error occurred';
        return NextResponse.json(
            { error: 'API Proxy failed', details: errorMessage },
            { status: 500 }
        );
    }
}

// Handler for OPTIONS preflight requests
export async function OPTIONS(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new Response(null, { headers, status: 204 });
}
