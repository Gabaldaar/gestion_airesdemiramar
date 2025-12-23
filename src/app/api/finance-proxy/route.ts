
import { NextResponse } from 'next/server';

// Configuration is now self-contained within the proxy
const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
const FINANCE_API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW';

export const dynamic = 'force-dynamic';

async function handler(request: Request) {
  try {
    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

    const headersForExternalApi = {
      'Authorization': `Bearer ${FINANCE_API_KEY}`,
      'Content-Type': 'application/json',
    };
    
    // These headers are for the browser's response from OUR proxy
    const headersForBrowser = {
      'Access-Control-Allow-Origin': '*',
      'Access-control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: headersForBrowser, status: 204 });
    }

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: headersForExternalApi,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `La API de finanzas devolvió un error ${response.status}.` }));
      throw new Error(errorData.error || `Error ${response.status} de la API externa.`);
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: headersForBrowser });

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

export { handler as GET, handler as OPTIONS };
