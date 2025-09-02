import type { Property, Booking, PropertyExpense, Pricing } from './types';

const properties: Property[] = [
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

const bookings: Booking[] = [
  {
    id: 1,
    propertyId: 1,
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

const propertyExpenses: PropertyExpense[] = [
    { id: 1, propertyId: 1, date: '2024-07-05T10:00:00.000Z', description: 'Impuesto municipal', amount: 100 },
    { id: 2, propertyId: 1, date: '2024-07-15T10:00:00.000Z', description: 'Reparación de cañería', amount: 250 },
    { id: 3, propertyId: 2, date: '2024-07-10T10:00:00.000Z', description: 'Servicio de jardinería', amount: 80 },
    { id: 4, propertyId: 3, date: '2024-07-01T10:00:00.000Z', description: 'Pago de expensas', amount: 150 },
];

const pricing: Pricing[] = [
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


export const getProperties = () => properties;
export const getPropertyById = (id: number) => properties.find(p => p.id === id);

export const getBookings = () => bookings;
export const getBookingsByPropertyId = (propertyId: number) => bookings.filter(b => b.propertyId === propertyId);
export const getBookingById = (id: number) => bookings.find(b => b.id === id);

export const getPropertyExpenses = () => propertyExpenses;
export const getExpensesByPropertyId = (propertyId: number) => propertyExpenses.filter(e => e.propertyId === propertyId);

export const getPricingByPropertyId = (propertyId: number) => pricing.find(p => p.propertyId === propertyId);

// In a real app, these would be API calls to a server that updates a database.
export const updateProperty = (id: number, data: Partial<Property>) => {
    const propIndex = properties.findIndex(p => p.id === id);
    if(propIndex !== -1) {
        properties[propIndex] = { ...properties[propIndex], ...data };
        console.log("Updated property:", properties[propIndex]);
        return properties[propIndex];
    }
    return null;
}
