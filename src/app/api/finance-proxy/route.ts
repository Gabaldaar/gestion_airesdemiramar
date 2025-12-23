
import { NextResponse } from 'next/server';

// --- Configuration ---
// THIS IS THE CORRECT, CENTRALIZED PLACE FOR THE KEY
const FINANCE_API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW'; 
const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';

// This handles GET requests to /api/finance-proxy
export async function GET(request: Request) {
  try {
    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

    if (!FINANCE_API_KEY) {
        // This check is for our own server's configuration, just in case.
        throw new Error("Internal Server Error: API Key not configured.");
    }

    const headersForExternalApi = {
      'Authorization': `Bearer ${FINANCE_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: headersForExternalApi,
      cache: 'no-store', // Prevent caching of the API response
    });

    const data = await response.json();

    if (!response.ok) {
      // Forward the error from the external API
      throw new Error(data.error || `La API de finanzas devolvió un error ${response.status}.`);
    }
    
    // Return the successful response from the external API to our client
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor proxy.';
    console.error('[FINANCE PROXY ERROR]', errorMessage);
    // Return a structured error response to the client
    return NextResponse.json(
      { error: `Error en el proxy interno: ${errorMessage}` },
      { 
        status: 500,
      }
    );
  }
}
