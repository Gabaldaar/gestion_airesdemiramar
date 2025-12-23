
import { NextResponse } from 'next/server';
import { API_BASE_URL, FINANCE_API_KEY } from '@/lib/finance-api';

export const dynamic = 'force-dynamic';

async function handler(request: Request) {
  try {
    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

    const headers = {
      'Authorization': `Bearer ${FINANCE_API_KEY}`,
      'Content-Type': 'application/json',
      // Add CORS headers for the browser to trust the proxy's response
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // For OPTIONS preflight requests, just return the headers
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers, status: 204 });
    }

    const response = await fetch(externalApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FINANCE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'La API de finanzas devolvió una respuesta inválida.' }));
      // Use the error message from the external API if available
      throw new Error(errorData.error || `Error ${response.status} de la API externa`);
    }

    const data = await response.json();
    return NextResponse.json(data, { headers });

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
