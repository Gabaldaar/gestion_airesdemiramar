

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

export type BookingWithTenantAndProperty = Booking & {
    tenant?: Tenant;
    property?: Property;
}

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
    { id: 1, name: 'Juan Perez', dni: '12345678', address: 'Su casa', city: 'CABA', country: 'Argentina', email: 'juan@perez.com', phone: '11-1234-5678' },
    { id: 2, name: 'Maria Garcia', dni: '87654321', address: 'Calle Otra 456', city: 'Cordoba', country: 'Argentina', email: 'maria@garcia.com', phone: '351-123-4567' },
    { id: 3, name: 'Pedro Martinez', dni: '11223344', address: 'Avenida Ficticia 789', city: 'Rosario', country: 'Argentina', email: 'pedro@martinez.com', phone: '341-987-6543' }
];

let bookings: Booking[] = [
    { id: 1, propertyId: 1, tenantId: 2, startDate: '2024-07-15T00:00:00.000Z', endDate: '2024-07-30T00:00:00.000Z', amount: 250000, currency: 'ARS' },
    { id: 2, propertyId: 3, tenantId: 1, startDate: '2024-08-01T00:00:00.000Z', endDate: '2024-08-15T00:00:00.000Z', amount: 800, currency: 'USD' },
    { id: 3, propertyId: 1, tenantId: 3, startDate: '2024-09-01T00:00:00.000Z', endDate: '2024-09-10T00:00:00.000Z', amount: 350000, currency: 'ARS' },
];

let propertyExpenses: PropertyExpense[] = [
    { id: 1, propertyId: 1, description: "Arreglo de cañería", amount: 15000, date: '2024-07-10T00:00:00.000Z' },
    { id: 2, propertyId: 1, description: "Pintura frente", amount: 45000, date: '2024-06-20T00:00:00.000Z' },
];


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


export async function getBookings(): Promise<BookingWithTenantAndProperty[]> {
    return bookings.map(booking => {
        const tenant = tenants.find(t => t.id === booking.tenantId);
        const property = properties.find(p => p.id === booking.propertyId);
        return { ...booking, tenant, property };
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getBookingsByPropertyId(propertyId: number): Promise<BookingWithTenantAndProperty[]> {
    const propertyBookings = bookings.filter(b => b.propertyId === propertyId);
    return propertyBookings.map(booking => {
        const tenant = tenants.find(t => t.id === booking.tenantId);
        return { ...booking, tenant };
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function addBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const newBooking = {
        id: bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1,
        ...booking
    };
    bookings.push(newBooking);
    console.log('Bookings after adding:', bookings);
    return newBooking;
}

export async function getPropertyExpensesByPropertyId(propertyId: number): Promise<PropertyExpense[]> {
    return propertyExpenses
        .filter(e => e.propertyId === propertyId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addPropertyExpense(expense: Omit<PropertyExpense, 'id'>): Promise<PropertyExpense> {
    const newExpense = {
        id: propertyExpenses.length > 0 ? Math.max(...propertyExpenses.map(e => e.id)) + 1 : 1,
        ...expense
    };
    propertyExpenses.push(newExpense);
    return newExpense;
}
