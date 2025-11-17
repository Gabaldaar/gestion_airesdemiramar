'use server';

// --- DOLAR API ---
export async function getDollarRate(): Promise<number> {
    try {
        const response = await fetch('https://dolarapi.com/v1/dolares/oficial', {
            cache: 'no-store' // Avoid caching the API response
        });
        if (!response.ok) {
            throw new Error(`Error fetching DolarAPI: ${response.statusText}`);
        }
        const data = await response.json();
        // Return the "venta" value, which is the seller's price
        return data.venta;
    } catch (error) {
        console.error('Failed to fetch dollar rate from DolarAPI:', error);
        throw new Error('No se pudo obtener la cotización del dólar.');
    }
}