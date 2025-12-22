
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

const apiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
};


/**
 * Fetches imputation data (categories, accounts, wallets) from the finance API.
 * This function is executed on the server and calls the external API directly.
 * @returns {Promise<DatosImputacion>}
 * @throws {Error} if the API call fails.
 */
export async function getDatosImputacion(): Promise<DatosImputacion> {
    const externalApiUrl = `${API_BASE_URL}/api/datos-imputacion`;

    try {
        const response = await fetch(externalApiUrl, {
            method: 'GET',
            headers: apiHeaders,
            cache: 'no-store', // Ensure fresh data and prevent static rendering issues
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Error parsing API error response." }));
            throw new Error(errorData.error || `Error ${response.status} fetching imputation data.`);
        }

        const data: DatosImputacion = await response.json();
        return data;
    } catch (error) {
        console.error('[Finance API Client Error - getDatosImputacion]:', error);
        // Re-throw a more user-friendly error
        throw new Error('Failed to connect to the finance API. Please check if the external API is running and CORS is configured.');
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
            headers: apiHeaders,
            body: JSON.stringify(payload),
            cache: 'no-store',
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
