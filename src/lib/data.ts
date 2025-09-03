





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

export type BookingWithDetails = BookingWithTenantAndProperty & {
    totalPaid: number;
    balance: number;
}


export type Payment = {
  id: number;
  bookingId: number;
  amount: number;
  date: string;
  currency: 'USD' | 'ARS';
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

export type FinancialSummary = {
    propertyId: number;
    propertyName: string;
    totalIncome: number;
    totalPayments: number;
    balance: number;
    totalPropertyExpenses: number;
    totalBookingExpenses: number;
    netResult: number;
}


// --- DATOS DE EJEMPLO ---

const properties: Property[] = [
    { id: 1, name: 'Depto 1', address: 'Calle Falsa 123, Miramar', googleCalendarId: 'c_722f29379255a8057c603d6f1a8316c0dd1a53c15a452f14643c713833d73c8d@group.calendar.google.com', imageUrl: 'https://picsum.photos/600/400?random=1' },
    { id: 2, name: 'Depto 2', address: 'Avenida Siempreviva 742, Miramar', googleCalendarId: 'cal2@google.com', imageUrl: 'https://picsum.photos/600/400?random=2' },
    { id: 3, name: 'Casa 3', address: 'Calle 20 N° 1550, Miramar', googleCalendarId: 'c_722f29379255a8057c603d6f1a8316c0dd1a53c15a452f14643c713833d73c8d@group.calendar.google.com', imageUrl: 'https://picsum.photos/600/400?random=3' },
    { id: 4, name: 'Depto 4', address: 'Avenida 23 N° 830, Miramar', googleCalendarId: 'cal4@google.com', imageUrl: 'https://picsum.photos/600/400?random=4' },
];

let tenants: Tenant[] = [
    { id: 1, name: 'Juan Perez', dni: '12345678', address: 'Su casa', city: 'CABA', country: 'Argentina', email: 'juan@perez.com', phone: '11-1234-5678' },
    { id: 2, name: 'Maria Garcia', dni: '87654321', address: 'Calle Otra 456', city: 'Cordoba', country: 'Argentina', email: 'maria@garcia.com', phone: '351-123-4567' },
    { id: 3, name: 'Pedro Martinez', dni: '11223344', address: 'Avenida Ficticia 789', city: 'Rosario', country: 'Argentina', email: 'pedro@martinez.com', phone: '341-987-6543' }
];

let bookings: Booking[] = [
    { id: 1, propertyId: 1, tenantId: 2, startDate: '2024-07-15T00:00:00.000Z', endDate: '2024-07-30T00:00:00.000Z', amount: 250000, currency: 'ARS' },
    { id: 2, propertyId: 3, tenantId: 1, startDate: '2024-08-01T00:00:00.000Z', endDate: '2024-08-15T00:00:00.000Z', amount: 800, currency: 'USD', exchangeRate: 1000 },
    { id: 3, propertyId: 1, tenantId: 3, startDate: '2024-09-01T00:00:00.000Z', endDate: '2024-09-10T00:00:00.000Z', amount: 350000, currency: 'ARS' },
];

let propertyExpenses: PropertyExpense[] = [
    { id: 1, propertyId: 1, description: "Arreglo de cañería", amount: 15000, date: '2024-07-10T00:00:00.000Z' },
    { id: 2, propertyId: 1, description: "Pintura frente", amount: 45000, date: '2024-06-20T00:00:00.000Z' },
];

let bookingExpenses: BookingExpense[] = [
    { id: 1, bookingId: 1, description: "Comisión plataforma", amount: 25000, date: '2024-07-15T00:00:00.000Z'},
    { id: 2, bookingId: 1, description: "Limpieza", amount: 10000, date: '2024-07-30T00:00:00.000Z'},
];

let payments: Payment[] = [
    { id: 1, bookingId: 1, amount: 100000, date: '2024-07-01T00:00:00.000Z', currency: 'ARS' },
    { id: 2, bookingId: 1, amount: 150000, date: '2024-07-14T00:00:00.000Z', currency: 'ARS' },
    { id: 3, bookingId: 2, amount: 400, date: '2024-07-20T00:00:00.000Z', currency: 'USD' },
];


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


async function getBookingDetails(booking: Booking, allPayments: Payment[]): Promise<BookingWithDetails> {
    const tenant = tenants.find(t => t.id === booking.tenantId);
    const property = properties.find(p => p.id === booking.propertyId);

    const paymentsForBooking = allPayments.filter(p => p.bookingId === booking.id);
    const totalPaid = paymentsForBooking.reduce((acc, payment) => {
        if (payment.currency === booking.currency) {
            return acc + payment.amount;
        }
        // Basic conversion if currencies differ, assuming ARS->USD or USD->ARS
        // This logic might need to be more robust in a real-world app
        if (payment.currency === 'USD' && booking.currency === 'ARS') {
            return acc + payment.amount * (booking.exchangeRate || 1000);
        }
        if (payment.currency === 'ARS' && booking.currency === 'USD') {
            return acc + payment.amount / (booking.exchangeRate || 1000);
        }
        return acc;
    }, 0);

    const balance = booking.amount - totalPaid;

    return { ...booking, tenant, property, totalPaid, balance };
}


export async function getBookings(): Promise<BookingWithDetails[]> {
    const allPayments = await getAllPayments();
    const detailedBookings = await Promise.all(
        bookings.map(booking => getBookingDetails(booking, allPayments))
    );
    return detailedBookings.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getBookingsByPropertyId(propertyId: number): Promise<BookingWithDetails[]> {
    const propertyBookings = bookings.filter(b => b.propertyId === propertyId);
     const allPayments = await getAllPayments();
    const detailedBookings = await Promise.all(
        propertyBookings.map(booking => getBookingDetails(booking, allPayments))
    );
    return detailedBookings.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
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

export async function updateBooking(updatedBooking: Booking): Promise<Booking | null> {
    const bookingIndex = bookings.findIndex(b => b.id === updatedBooking.id);
    if (bookingIndex === -1) {
        return null;
    }
    bookings[bookingIndex] = updatedBooking;
    return updatedBooking;
}

export async function deleteBooking(id: number): Promise<boolean> {
    const initialLength = bookings.length;
    bookings = bookings.filter(b => b.id !== id);
    return bookings.length < initialLength;
}

export async function getAllPropertyExpenses(): Promise<PropertyExpense[]> {
    return propertyExpenses;
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

export async function updatePropertyExpense(updatedExpense: PropertyExpense): Promise<PropertyExpense | null> {
    const expenseIndex = propertyExpenses.findIndex(e => e.id === updatedExpense.id);
    if (expenseIndex === -1) {
        return null;
    }
    propertyExpenses[expenseIndex] = updatedExpense;
    return updatedExpense;
}

export async function deletePropertyExpense(id: number): Promise<boolean> {
    const initialLength = propertyExpenses.length;
    propertyExpenses = propertyExpenses.filter(e => e.id !== id);
    return propertyExpenses.length < initialLength;
}

export async function getAllBookingExpenses(): Promise<BookingExpense[]> {
    return bookingExpenses;
}

export async function getBookingExpensesByBookingId(bookingId: number): Promise<BookingExpense[]> {
    return bookingExpenses
        .filter(e => e.bookingId === bookingId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addBookingExpense(expense: Omit<BookingExpense, 'id'>): Promise<BookingExpense> {
    const newExpense = {
        id: bookingExpenses.length > 0 ? Math.max(...bookingExpenses.map(e => e.id)) + 1 : 1,
        ...expense
    };
    bookingExpenses.push(newExpense);
    return newExpense;
}

export async function updateBookingExpense(updatedExpense: BookingExpense): Promise<BookingExpense | null> {
    const expenseIndex = bookingExpenses.findIndex(e => e.id === updatedExpense.id);
    if (expenseIndex === -1) {
        return null;
    }
    bookingExpenses[expenseIndex] = updatedExpense;
    return updatedExpense;
}

export async function deleteBookingExpense(id: number): Promise<boolean> {
    const initialLength = bookingExpenses.length;
    bookingExpenses = bookingExpenses.filter(e => e.id !== id);
    return bookingExpenses.length < initialLength;
}

export async function getPaymentsByBookingId(bookingId: number): Promise<Payment[]> {
    return payments
        .filter(p => p.bookingId === bookingId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const newPayment = {
        id: payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1,
        ...payment
    };
    payments.push(newPayment);
    return newPayment;
}

export async function updatePayment(updatedPayment: Payment): Promise<Payment | null> {
    const paymentIndex = payments.findIndex(p => p.id === updatedPayment.id);
    if (paymentIndex === -1) {
        return null;
    }
    payments[paymentIndex] = updatedPayment;
    return updatedPayment;
}

export async function deletePayment(id: number): Promise<boolean> {
    const initialLength = payments.length;
    payments = payments.filter(p => p.id !== id);
    return payments.length < initialLength;
}

export async function getAllPayments(): Promise<Payment[]> {
    return payments;
}


export async function getFinancialSummaryByProperty(options?: { startDate?: string; endDate?: string }): Promise<FinancialSummary[]> {
  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const fromDate = startDate ? new Date(startDate) : null;
  const toDate = endDate ? new Date(endDate) : null;

  const [allProperties, allBookings, allPropertyExpenses, allBookingExpenses, allPayments] = await Promise.all([
    getProperties(),
    getBookings(),
    getAllPropertyExpenses(),
    getAllBookingExpenses(),
    getAllPayments(),
  ]);

  const summary: FinancialSummary[] = allProperties.map(property => {
    const isWithinDateRange = (dateStr: string) => {
        if (!fromDate && !toDate) return true;
        const itemDate = new Date(dateStr);
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
    };

    const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate));
    const propertyExpenses = allPropertyExpenses.filter(e => e.propertyId === property.id && isWithinDateRange(e.date));
    const relevantBookingIds = new Set(propertyBookings.map(b => b.id));
    const relevantBookingExpenses = allBookingExpenses.filter(e => relevantBookingIds.has(e.bookingId) && isWithinDateRange(e.date));
    const relevantPayments = allPayments.filter(p => relevantBookingIds.has(p.bookingId) && isWithinDateRange(p.date));


    const getAmountInArs = (amount: number, currency: 'ARS' | 'USD', exchangeRate?: number) => {
        if (currency === 'ARS') {
            return amount;
        }
        return amount * (exchangeRate || 1000); // Default exchange rate
    }

    const totalIncome = propertyBookings.reduce((acc, booking) => {
      return acc + getAmountInArs(booking.amount, booking.currency, booking.exchangeRate);
    }, 0);

    const totalPayments = relevantPayments.reduce((acc, payment) => {
      const bookingForPayment = allBookings.find(b => b.id === payment.bookingId);
      return acc + getAmountInArs(payment.amount, payment.currency, bookingForPayment?.exchangeRate);
    }, 0);


    const balance = totalIncome - totalPayments;

    const totalPropertyExpenses = propertyExpenses.reduce((acc, expense) => acc + expense.amount, 0);

    const totalBookingExpenses = relevantBookingExpenses.reduce((acc, expense) => acc + expense.amount, 0);

    const netResult = totalIncome - totalPropertyExpenses - totalBookingExpenses;

    return {
      propertyId: property.id,
      propertyName: property.name,
      totalIncome,
      totalPayments,
      balance,
      totalPropertyExpenses,
      totalBookingExpenses,
      netResult,
    };
  });

  return summary;
}
