
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
export const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
export const FINANCE_API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW';

