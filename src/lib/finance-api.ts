
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
 * Registers a new income/payment in the finance application.
 * This function is still a server action as it's called from another server action (addPayment)
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
