
import { NextResponse } from 'next/server';

// --- Configuration ---
const FINANCE_API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW'; 
const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';

// This handles GET requests to /api/finance-proxy
export async function GET(request: Request) {
  try {
    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

    if (!FINANCE_API_KEY) {
        // This check is for our own server's configuration, just in case.
        throw new Error("Internal Server Error: API Key not configured on this server.");
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

    // Try to get a more detailed error message from the external API
    if (!response.ok) {
      let errorBody = 'La API de finanzas devolvió un error sin detalles.';
      try {
        const errorJson = await response.json();
        errorBody = errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
        // Could not parse JSON, maybe it's plain text
        try {
            errorBody = await response.text();
        } catch (e2) {
             // Ignore if we can't read the body
        }
      }
      throw new Error(`Error ${response.status}: ${errorBody}`);
    }
    
    const data = await response.json();
    
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
