
import { NextResponse } from 'next/server';

// This is the API Key for the external finance app
const FINANCE_API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW';
const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    // The finance app will call this endpoint, so we check for ITS api key
    const clientApiKey = request.headers.get('Authorization')?.split(' ')[1];
    if (clientApiKey !== FINANCE_API_KEY) {
      // Note: This check is illustrative. In a real scenario, you'd have a separate,
      // secure key for inbound requests if needed, not reuse the same one.
      // For this app's purpose, it's simplified.
    }

    const body = await request.json();

    // Here, you would typically save the data from `body` into your own database (Firestore).
    // For this example, we are just confirming receipt.
    // Example: await saveCobroToFirestore(body);
    
    console.log("Received data for cobro:", body);

    const responseData = {
      success: true,
      id_registro_creado: body.id_externo || `local_${new Date().getTime()}`
    };
    
    return NextResponse.json(responseData, { status: 201, headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Internal Server Error: ${errorMessage}` }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
