
'use server';

// Define the structure for the data we expect from the finance API
export interface Categoria {
    id: string;
    nombre: string;
}

export interface Cuenta {
    id: string;
    nombre: string;
}

export interface Billetera {
    id: string;
    nombre: string;
}

export interface DatosImputacion {
    categorias: Categoria[];
    cuentas: Cuenta[];
    billeteras: Billetera[];
}

export interface RegistrarCobroPayload {
    fecha: string;                   // ISO 8601
    monto: number;
    moneda: 'ARS' | 'USD';
    monto_usd?: number;              // Optional for ARS payments
    tasa_cambio?: number;            // Optional for ARS payments
    categoria_id: string;
    cuenta_id: string;
    billetera_id: string;
    descripcion: string;
    id_externo?: string;
}

// --- Configuration ---
const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
const API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW'; // This should be in an environment variable

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};


/**
 * Fetches imputation data (categories, accounts, wallets) from the finance API.
 * This now calls an internal proxy route to avoid CORS issues in development.
 * @returns {Promise<DatosImputacion>}
 * @throws {Error} if the API call fails.
 */
export async function getDatosImputacion(): Promise<DatosImputacion> {
    try {
        // Construct the full, absolute URL for our internal proxy
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const internalUrl = new URL('/api/finance-proxy/datos-imputacion', appUrl);
        
        const response = await fetch(internalUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 300 } 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status} fetching imputation data via proxy.`);
        }

        const data: DatosImputacion = await response.json();
        return data;
    } catch (error) {
        console.error('[Finance API Proxy Error - getDatosImputacion]:', error);
        throw new Error('Failed to connect to the finance API via proxy.');
    }
}


/**
 * Registers a new income/payment in the finance application.
 * @param {RegistrarCobroPayload} payload - The data for the new payment.
 * @returns {Promise<{success: boolean; id_registro_creado?: string; error?: string}>}
 */
export async function registrarCobro(payload: RegistrarCobroPayload) {
     try {
        const response = await fetch(`${API_BASE_URL}/api/registrar-cobro`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.error || `Error ${response.status} registering payment.`);
        }

        return responseData;
    } catch (error) {
        console.error('[Finance API Error - registrarCobro]:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred while registering the payment.' };
    }
}
