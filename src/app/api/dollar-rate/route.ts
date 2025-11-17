
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // We add a cache-busting parameter to ensure we get the latest rate
    const response = await fetch('https://dolarapi.com/v1/dolares/oficial?_=' + new Date().getTime(), {
      next: {
        revalidate: 600, // Revalidate every 10 minutes
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
