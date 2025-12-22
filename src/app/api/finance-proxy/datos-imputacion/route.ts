
import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
const API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW'; // This should be in an environment variable

const apiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};

// Define los headers de CORS en un solo lugar para reutilizarlos
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
    console.log('[Proxy GET] Petición recibida en el proxy.');
    try {
        const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;
        console.log(`[Proxy GET] Llamando a la API externa en: ${externalApiUrl}`);

        const apiResponse = await fetch(externalApiUrl, {
            method: 'GET',
            headers: apiHeaders,
            next: { revalidate: 60 } 
        });

        console.log(`[Proxy GET] Respuesta de la API externa recibida con estado: ${apiResponse.status}`);

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error(`[Proxy GET] Error de la API externa:`, data);
            return NextResponse.json(
                { error: data.error || 'Failed to fetch from external API' },
                { status: apiResponse.status, headers: corsHeaders }
            );
        }

        console.log('[Proxy GET] Devolviendo datos exitosamente.');
        return NextResponse.json(data, {
            headers: corsHeaders
        });

    } catch (error) {
        console.error('[Proxy GET] Error catastrófico en el proxy:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown proxy error occurred';
        return NextResponse.json(
            { error: 'API Proxy failed', details: errorMessage },
            { status: 500, headers: corsHeaders }
        );
    }
}

// Handler for OPTIONS preflight requests
export async function OPTIONS(request: Request) {
  console.log('[Proxy OPTIONS] Petición preflight recibida y gestionada.');
  return new Response(null, { headers: corsHeaders, status: 204 });
}
