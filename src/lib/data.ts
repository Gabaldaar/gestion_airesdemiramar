
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
  dni: string;
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
    { id: 1, name: 'Depto 1', address: 'Calle Falsa 123, Miramar', googleCalendarId: 'cal1@google.com', imageUrl: 'https://picsum.photos/600/400?random=1' },
    { id: 2, name: 'Depto 2', address: 'Avenida Siempreviva 742, Miramar', googleCalendarId: 'cal2@google.com', imageUrl: 'https://picsum.photos/600/400?random=2' },
    { id: 3, name: 'Casa 3', address: 'Calle 20 N° 1550, Miramar', googleCalendarId: 'cal3@google.com', imageUrl: 'https://picsum.photos/600/400?random=3' },
    { id: 4, name: 'Depto 4', address: 'Avenida 23 N° 830, Miramar', googleCalendarId: 'cal4@google.com', imageUrl: 'https://picsum.photos/600/400?random=4' },
];

let tenants: Tenant[] = [
    { id: 1, name: 'Juan Perez', dni: '12345678', address: 'Su casa', city: 'CABA', country: 'Argentina', email: 'juan@perez.com', phone: '11-1234-5678' }
];

const bookings: Booking[] = [];
const payments: Payment[] = [];


// --- FUNCIONES DE ACCESO A DATOS ---

export async function getProperties(): Promise<Property[]> {
  return properties;
}

export async function getPropertyById(id: number): Promise<Property | undefined> {
  return properties.find(p => p.id === id);
}

export async function getTenants(): Promise<Tenant[]> {
    return tenants;
}

export async function addTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
    const newTenant = {
        id: tenants.length > 0 ? Math.max(...tenants.map(t => t.id)) + 1 : 1,
        ...tenant
    };
    tenants.push(newTenant);
    return newTenant;
}

export async function updateTenant(updatedTenant: Tenant): Promise<Tenant | null> {
    const tenantIndex = tenants.findIndex(t => t.id === updatedTenant.id);
    if (tenantIndex === -1) {
        return null;
    }
    tenants[tenantIndex] = updatedTenant;
    return updatedTenant;
}


export async function getBookings(): Promise<Booking[]> {
    return bookings;
}
