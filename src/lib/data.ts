
export type Property = {
  id: number;
  name: string;
  address: string;
  type: 'apartment' | 'house';
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  imageUrl: string;
  status: 'available' | 'rented';
};

export type Booking = {
  id: number;
  propertyId: number;
  tenantName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
};

export type Tenant = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type Payment = {
  id: number;
  bookingId: number;
  amount: number;
  date: string;
  method: 'credit_card' | 'bank_transfer' | 'cash';
};

export type Financials = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
};

const properties: Property[] = [
  { id: 1, name: 'Modern Downtown Loft', address: '123 Main St, Anytown', type: 'apartment', bedrooms: 1, bathrooms: 1, pricePerNight: 150, imageUrl: 'https://picsum.photos/600/400?random=1', status: 'available' },
  { id: 2, name: 'Cozy Suburban House', address: '456 Oak Ave, Suburbia', type: 'house', bedrooms: 3, bathrooms: 2, pricePerNight: 250, imageUrl: 'https://picsum.photos/600/400?random=2', status: 'rented' },
  { id: 3, name: 'Beachfront Villa', address: '789 Ocean Blvd, Beachtown', type: 'house', bedrooms: 4, bathrooms: 3, pricePerNight: 500, imageUrl: 'https://picsum.photos/600/400?random=3', status: 'available' },
];

const bookings: Booking[] = [
  { id: 1, propertyId: 2, tenantName: 'John Doe', startDate: '2024-07-01', endDate: '2024-07-10', totalPrice: 2250, status: 'confirmed' },
  { id: 2, propertyId: 3, tenantName: 'Jane Smith', startDate: '2024-08-15', endDate: '2024-08-20', totalPrice: 2500, status: 'pending' },
  { id: 3, propertyId: 1, tenantName: 'Peter Jones', startDate: '2024-09-01', endDate: '2024-09-05', totalPrice: 600, status: 'confirmed' },
];

const tenants: Tenant[] = [
  { id: 1, name: 'John Doe', email: 'john.doe@email.com', phone: '123-456-7890' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@email.com', phone: '098-765-4321' },
  { id: 3, name: 'Peter Jones', email: 'peter.jones@email.com', phone: '555-555-5555' },
];

const payments: Payment[] = [
    { id: 1, bookingId: 1, amount: 2250, date: '2024-06-25', method: 'credit_card' },
    { id: 2, bookingId: 3, amount: 600, date: '2024-08-20', method: 'bank_transfer' },
];

export async function getProperties(): Promise<Property[]> {
  return properties;
}

export async function getProperty(id: number): Promise<Property | undefined> {
  return properties.find(p => p.id === id);
}

export async function getBookings(): Promise<Booking[]> {
  return bookings;
}

export async function getTenants(): Promise<Tenant[]> {
    return tenants;
}

export async function getPayments(): Promise<Payment[]> {
    return payments;
}

export async function getFinancials(): Promise<Financials> {
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    // Assuming a simple 15% of revenue as expenses for this example
    const totalExpenses = totalRevenue * 0.15; 
    const netProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, netProfit };
}

// Functions to add data
export async function addProperty(property: Omit<Property, 'id'>): Promise<Property> {
  const newProperty: Property = { ...property, id: properties.length + 1 };
  properties.push(newProperty);
  return newProperty;
}

export async function addBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
  const newBooking: Booking = { ...booking, id: bookings.length + 1 };
  bookings.push(newBooking);
  return newBooking;
}
