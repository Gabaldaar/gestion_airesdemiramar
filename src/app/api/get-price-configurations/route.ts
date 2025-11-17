import { NextResponse } from 'next/server';

// This is your Google App Script URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8fURrNijPJ5cMqCcd7lJlhm7xc0kL3ms2tY7g0uIxZylH5W1ZmwNFb7RO2xOFveHAeQ/exec?modo=datos';

export async function GET() {
  try {
    const response = await fetch(SCRIPT_URL, {
      // Revalidate every 5 minutes to get fresh pricing data without being too aggressive
      next: { revalidate: 300 }, 
    });

    if (!response.ok) {
      throw new Error(`Google App Script responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching price configurations:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch price configurations', details: errorMessage },
      { status: 500 }
    );
  }
}
