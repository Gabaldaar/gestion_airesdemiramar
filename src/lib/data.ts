
import type { Property, Booking, PropertyExpense, Pricing, Payment, RentalExpense, Tenant } from './types';

// En una aplicación real, estos datos vendrían de una base de datos.
// Usamos "let" en lugar de "const" para poder modificar los arrays en memoria.
let properties: Property[] = [
  {
    id: 1,
    name: 'Depto. Centauro',
    address: 'Av. Centauro 555, Miramar',
    googleCalendarId: 'calendar1@google.com',
    imageUrl: 'https://picsum.photos/600/400?random=1'
  },
  {
    id: 2,
    name: 'Casa del Bosque',
    address: 'Calle 40 1234, Miramar',
    googleCalendarId: 'calendar2@google.com',
    imageUrl: 'https://picsum.photos/600/400?random=2'
  },
  {
    id: 3,
    name: 'Loft Moderno',
    address: 'Av. Costanera 789, Miramar',
    googleCalendarId: 'calendar3@google.com',
    imageUrl: 'https://picsum.photos/600/400?random=3'
  },
  {
    id: 4,
    name: 'Chalet Familiar',
    address: 'Calle 21 987, Miramar',
    googleCalendarId: 'calendar4@google.com',
    imageUrl: 'https://picsum.photos/600/400?random=4'
  },
];

let tenants: Tenant[] = [
    { id: 1, name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '+54 223 555-0101', address: 'Calle Falsa 123', city: 'Mar del Plata', province: 'Buenos Aires', country: 'Argentina' },
    { id: 2, name: 'Ana García', email: 'ana.garcia@email.com', phone: '+54 11 555-0102', address: 'Av. Siempre Viva 742', city: 'CABA', province: 'CABA', country: 'Argentina' },
    { id: 3, name: 'Carlos López', email: 'carlos.lopez@email.com', phone: '+54 351 555-0103', address: 'El Jacarandá 456', city: 'Córdoba', province: 'Córdoba', country: 'Argentina' },
    { id: 4, name: 'Maria Fernandez', email: 'maria.fernandez@email.com', phone: '+54 261 555-0104', address: 'San Martín 876', city: 'Mendoza', province: 'Mendoza', country: 'Argentina' },
];

let bookings: Booking[] = [
  {
    id: 1,
    propertyId: 1,
    tenantId: 1,
    tenantName: 'Juan Pérez',
    tenantContact: 'juan.perez@email.com',
    checkIn: '2024-07-20T14:00:00.000Z',
    checkOut: '2024-07-27T10:00:00.000Z',
    amountUSD: 700,
    amountARS: 630000,
    conversionRate: 900,
    payments: [
      { id: 1, date: '2024-06-20T10:00:00.000Z', amount: 350, currency: 'USD', conversionRate: 900 },
      { id: 2, date: '2024-07-20T10:00:00.000Z', amount: 315000, currency: 'ARS', conversionRate: 900 }
    ],
    rentalExpenses: [
        { id: 1, description: 'Comisión inmobiliaria', amount: 70, currency: 'USD' }
    ],
  },
  {
    id: 2,
    propertyId: 2,
    tenantId: 2,
    tenantName: 'Ana García',
    tenantContact: 'ana.garcia@email.com',
    checkIn: '2024-08-01T14:00:00.000Z',
    checkOut: '2024-08-15T10:00:00.000Z',
    amountUSD: 2100,
    amountARS: 1995000,
    conversionRate: 950,
    payments: [
      { id: 3, date: '2024-07-01T10:00:00.000Z', amount: 1050, currency: 'USD', conversionRate: 950 },
    ],
    rentalExpenses: [],
  },
  {
    id: 3,
    propertyId: 1,
    tenantId: 3,
    tenantName: 'Carlos López',
    tenantContact: 'carlos.lopez@email.com',
    checkIn: '2024-08-05T14:00:00.000Z',
    checkOut: '2024-08-12T10:00:00.000Z',
    amountUSD: 800,
    amountARS: 760000,
    conversionRate: 950,
    payments: [
      { id: 4, date: '2024-07-10T10:00:00.000Z', amount: 800, currency: 'USD', conversionRate: 950 }
    ],
    rentalExpenses: [],
  },
  {
    id: 4,
    propertyId: 3,
    tenantId: 4,
    tenantName: 'Maria Fernandez',
    tenantContact: 'maria.fernandez@email.com',
    checkIn: '2024-07-22T14:00:00.000Z',
    checkOut: '2024-07-29T10:00:00.000Z',
    amountUSD: 1200,
    amountARS: 1080000,
    conversionRate: 900,
    payments: [
      { id: 5, date: '2024-07-01T12:00:00.000Z', amount: 1200, currency: 'USD', conversionRate: 900 }
    ],
    rentalExpenses: [
      { id: 2, description: 'Limpieza extra', amount: 50, currency: 'USD' }
    ],
  },
];

let propertyExpenses: PropertyExpense[] = [
    { id: 1, propertyId: 1, date: '2024-07-05T10:00:00.000Z', description: 'Impuesto municipal', amount: 100 },
    { id: 2, propertyId: 1, date: '2024-07-15T10:00:00.000Z', description: 'Reparación de cañería', amount: 250 },
    { id: 3, propertyId: 2, date: '2024-07-10T10:00:00.000Z', description: 'Servicio de jardinería', amount: 80 },
    { id: 4, propertyId: 3, date: '2024-07-01T10:00:00.000Z', description: 'Pago de expensas', amount: 150 },
];

let pricing: Pricing[] = [
    {
        propertyId: 1,
        defaultNightlyRate: 100,
        seasonalRates: [{ from: '2024-12-20', to: '2025-02-28', rate: 150 }],
        promotions: [{ minNights: 7, discountPercent: 10 }],
    },
    {
        propertyId: 2,
        defaultNightlyRate: 180,
        seasonalRates: [{ from: '2024-12-20', to: '2025-02-28', rate: 250 }],
        promotions: [{ minNights: 14, discountPercent: 15 }],
    },
    {
        propertyId: 3,
        defaultNightlyRate: 120,
        seasonalRates: [{ from: '2024-12-20', to: '2025-02-28', rate: 180 }],
        promotions: [],
    },
    {
        propertyId: 4,
        defaultNightlyRate: 200,
        seasonalRates: [{ from: '2024-12-20', to: '2025-02-28', rate: 280 }],
        promotions: [{ minNights: 10, discountPercent: 5 }],
    }
]

// --- Funciones de Lectura ---
export const getProperties = () => properties;
export const getPropertyById = (id: number) => properties.find(p => p.id === id);

export const getTenants = () => tenants;
export const getTenantById = (id: number) => tenants.find(t => t.id === id);

export const getBookings = () => {
    return bookings.map(booking => {
        const tenant = getTenantById(booking.tenantId);
        return {
            ...booking,
            tenantName: tenant?.name || 'Inquilino no encontrado',
            tenantContact: tenant?.email || 'N/A'
        }
    })
};
export const getBookingsByPropertyId = (propertyId: number) => getBookings().filter(b => b.propertyId === propertyId);
export const getBookingById = (id: number) => getBookings().find(b => b.id === id);

export const getPropertyExpenses = () => propertyExpenses;
export const getExpensesByPropertyId = (propertyId: number) => propertyExpenses.filter(e => e.propertyId === propertyId);

export const getPricingByPropertyId = (propertyId: number) => pricing.find(p => p.propertyId === propertyId);

// --- Funciones de Escritura (Simulación de API) ---

export const addOrUpdateTenant = (data: Omit<Tenant, 'id'> & { id?: number }): Tenant => {
    if (data.id) {
        const tenantIndex = tenants.findIndex(t => t.id === data.id);
        if (tenantIndex !== -1) {
            tenants[tenantIndex] = { ...tenants[tenantIndex], ...data };
            console.log("Updated tenant:", tenants[tenantIndex]);
            return tenants[tenantIndex];
        }
    }
    const newId = tenants.length > 0 ? Math.max(...tenants.map(t => t.id)) + 1 : 1;
    const newTenant: Tenant = { ...data, id: newId };
    tenants.push(newTenant);
    console.log("Added tenant:", newTenant);
    return newTenant;
};


export const updateProperty = (id: number, data: Partial<Omit<Property, 'id'>>) => {
    const propIndex = properties.findIndex(p => p.id === id);
    if(propIndex !== -1) {
        properties[propIndex] = { ...properties[propIndex], ...data };
        console.log("Updated property:", properties[propIndex]);
        return properties[propIndex];
    }
    console.error("Property not found for update:", id);
    return null;
}

export const addBooking = (data: Omit<Booking, 'id' | 'payments' | 'rentalExpenses' | 'tenantName' | 'tenantContact'>) => {
    const tenant = getTenantById(data.tenantId);
    if (!tenant) {
        console.error("Tenant not found for adding booking:", data.tenantId);
        return null;
    }
    
    const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1;
    const newBooking: Booking = {
        ...data,
        id: newId,
        tenantName: tenant.name,
        tenantContact: tenant.email,
        payments: [],
        rentalExpenses: [],
    };
    bookings.push(newBooking);
    console.log("Added booking:", newBooking);
    return newBooking;
}

export const addPropertyExpense = (data: Omit<PropertyExpense, 'id'>) => {
    const newId = propertyExpenses.length > 0 ? Math.max(...propertyExpenses.map(e => e.id)) + 1 : 1;
    const newExpense: PropertyExpense = { ...data, id: newId };
    propertyExpenses.push(newExpense);
    console.log("Added property expense:", newExpense);
    return newExpense;
}

export const addPayment = (bookingId: number, data: Omit<Payment, 'id'>) => {
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if(bookingIndex !== -1) {
        const paymentId = bookings[bookingIndex].payments.length > 0 ? Math.max(...bookings[bookingIndex].payments.map(p => p.id)) + 1 : 1;
        const newPayment: Payment = { ...data, id: paymentId };
        bookings[bookingIndex].payments.push(newPayment);
        console.log("Added payment:", newPayment, "to booking:", bookingId);
        return newPayment;
    }
    console.error("Booking not found for adding payment:", bookingId);
    return null;
}

export const addRentalExpense = (bookingId: number, data: Omit<RentalExpense, 'id'>) => {
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if(bookingIndex !== -1) {
        const expenseId = bookings[bookingIndex].rentalExpenses.length > 0 ? Math.max(...bookings[bookingIndex].rentalExpenses.map(e => e.id)) + 1 : 1;
        const newExpense: RentalExpense = { ...data, id: expenseId };
        bookings[bookingIndex].rentalExpenses.push(newExpense);
        console.log("Added rental expense:", newExpense, "to booking:", bookingId);
        return newExpense;
    }
    console.error("Booking not found for adding rental expense:", bookingId);
    return null;
}
