
export type Property = {
  id: number;
  name: string;
  address: string;
  googleCalendarId: string;
  imageUrl: string;
};

export type Tenant = {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
};

export type Booking = {
  id: number;
  propertyId: number;
  tenantId: number;
  startDate: string;
  endDate: string;
  amount: number;
  currency: 'USD' | 'ARS';
  exchangeRate?: number; // Para convertir de USD a ARS
};

export type Payment = {
  id: number;
  bookingId: number;
  amount: number;
  date: string;
};

export type PropertyExpense = {
    id: number;
    propertyId: number;
    description: string;
    amount: number;
    date: string;
}

export type BookingExpense = {
    id: number;
    bookingId: number;
    description: string;
    amount: number;
    date: string;
}

// --- DATOS DE EJEMPLO ---

const properties: Property[] = [
    { id: 1, name: 'Depto 1', address: 'Calle Falsa 123', googleCalendarId: 'cal1@google.com', imageUrl: 'https://picsum.photos/600/400?random=1' },
    { id: 2, name: 'Depto 2', address: 'Avenida Siempreviva 742', googleCalendarId: 'cal2@google.com', imageUrl: 'https://picsum.photos/600/400?random=2' },
];

const tenants: Tenant[] = [
    { id: 1, name: 'Juan Perez', address: 'Su casa', city: 'CABA', country: 'Argentina', email: 'juan@perez.com', phone: '11-1234-5678' }
];

const bookings: Booking[] = [];
const payments: Payment[] = [];


// --- FUNCIONES DE ACCESO A DATOS ---

export async function getProperties(): Promise<Property[]> {
  return properties;
}

export async function getTenants(): Promise<Tenant[]> {
    return tenants;
}

export async function getBookings(): Promise<Booking[]> {
    return bookings;
}
