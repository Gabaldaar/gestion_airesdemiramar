
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'oficial'; // Default to 'oficial'

    const validTypes = ['oficial', 'blue', 'bolsa', 'contadoconliqui', 'tarjeta', 'cripto'];
    if (!validTypes.includes(type)) {
        return NextResponse.json({ error: 'Invalid dollar type specified' }, { status: 400 });
    }

    // We add a cache-busting parameter to ensure we get the latest rate
    const response = await fetch(`https://dolarapi.com/v1/dolares/${type}?_=` + new Date().getTime(), {
      next: {
        revalidate: 300, // Revalidate every 5 minutes
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from DolarAPI: ${response.statusText}`);
    }

    const data = await response.json();
    
    // We are interested in the 'venta' (selling) price
    if (!data.venta) {
        throw new Error('DolarAPI response is missing the "venta" field.');
    }

    return NextResponse.json({ venta: data.venta });

  } catch (error) {
    console.error('Error in dollar-rate API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch dollar rate', details: errorMessage }, { status: 500 });
  }
}
