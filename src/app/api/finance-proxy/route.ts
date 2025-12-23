
import { NextResponse } from 'next/server';

// --- Configuration ---
const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
const FINANCE_API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW'; // Hardcoded for simplicity and robustness

// This handles GET requests to /api/finance-proxy
export async function GET(request: Request) {
  try {
    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

    const headersForExternalApi = {
      'Authorization': `Bearer ${FINANCE_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: headersForExternalApi,
      cache: 'no-store', // Prevent caching of the API response
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Throw an error with a clear message, which will be caught below
      throw new Error(errorData.error || `La API de finanzas devolvió un error ${response.status}.`);
    }

    const data = await response.json();
    
    // Return the successful response from the external API to our client
    return NextResponse.json(data, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor proxy.';
    console.error('[FINANCE PROXY ERROR]', errorMessage);
    return NextResponse.json(
      { error: `Error en el proxy interno: ${errorMessage}` },
      { 
        status: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// This handles the preflight OPTIONS request from the browser
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
