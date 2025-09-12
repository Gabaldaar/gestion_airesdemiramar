

// This file contains functions for READING data from Firestore on the client-side.
// It uses the Firebase Web SDK (v9 modular).
// Write operations have been moved to `lib/actions.ts` to be used in Server Actions.

import { db } from './firebase'; // Use Web SDK for client-side operations
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';


// --- TYPE DEFINITIONS ---
const processDoc = (doc: { id: string; data: () => any; }) => {
    const data = doc.data()!;
    // Firestore Timestamps need to be converted to a serializable format.
    // We convert them to ISO strings. The UI will then parse these strings.
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { id: doc.id, ...data };
};


export type Property = {
  id: string;
  name: string;
  address: string;
  googleCalendarId: string;
  imageUrl: string;
  notes?: string;
  contractTemplate?: string;
  contractLogoUrl?: string;
  contractSignatureUrl?: string;
};

export type Tenant = {
  id: string;
  name: string;
  dni: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  notes?: string;
};

export type ContractStatus = 'not_sent' | 'sent' | 'signed' | 'not_required';
export type GuaranteeStatus = 'not_solicited' | 'solicited' | 'received' | 'returned' | 'not_applicable';

export type Booking = {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: 'USD' | 'ARS';
  exchangeRate?: number;
  notes?: string;
  contractStatus?: ContractStatus;
  googleCalendarEventId?: string;
  guaranteeStatus?: GuaranteeStatus;
  guaranteeAmount?: number;
  guaranteeCurrency?: 'USD' | 'ARS';
  guaranteeReceivedDate?: string;
  guaranteeReturnedDate?: string;
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
  id: string;
  bookingId: string;
  amount: number; // Always in USD
  date: string;
  currency: 'USD';
  description?: string;
  exchangeRate?: number;
  originalArsAmount?: number;
};

export type PaymentWithDetails = Payment & {
    propertyId?: string;
    propertyName?: string;
    tenantId?: string;
    tenantName?: string;
}

export type ExpenseCategory = {
    id: string;
    name: string;
};

export type PropertyExpense = {
    id: string;
    propertyId: string;
    description: string;
    amount: number; // Always in ARS
    date: string;
    currency: 'ARS';
    exchangeRate?: number;
    originalUsdAmount?: number;
    categoryId?: string;
}

export type BookingExpense = {
    id: string;
    bookingId: string;
    description: string;
    amount: number; // Always in ARS
    date: string;
    currency: 'ARS';
    exchangeRate?: number; 
    originalUsdAmount?: number;
    categoryId?: string;
}

export type UnifiedExpense = (PropertyExpense | BookingExpense) & {
    type: 'Propiedad' | 'Reserva';
    amountARS: number;
    amountUSD: number;
    propertyName: string;
    tenantName?: string;
    categoryName?: string;
};

export type FinancialSummary = {
    propertyId: string;
    propertyName: string;
    totalIncome: number;
    totalPayments: number;
    balance: number;
    totalPropertyExpenses: number;
    totalBookingExpenses: number;
    netResult: number;
}

export type FinancialSummaryByCurrency = {
    ars: FinancialSummary[];
    usd: FinancialSummary[];
}

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export type EmailSettings = {
    id: 'email';
    replyToEmail?: string;
}


// --- DATA READ FUNCTIONS (CLIENT-SIDE) ---

const getRootCollectionRef = <T>(collectionName: string) => {
    return collection(db, collectionName);
};

const addDefaultData = async (collRef: any, data: any[]) => {
    const querySnapshot = await getDocs(collRef);
    if (querySnapshot.empty) {
        for (const item of data) {
            const docRef = doc(collRef); // Create a new doc with auto-ID
            await setDoc(docRef, item);
        }
        console.log(`Default data added to ${collRef.path}.`);
    }
};

const initializeDefaultData = async () => {
    const emailTemplatesCollection = getRootCollectionRef('emailTemplates');

    const defaultTemplates = [
        {
            name: 'Confirmación de Pago',
            subject: 'Confirmación de tu pago para la reserva en {{propiedad.nombre}}',
            body: `Hola {{inquilino.nombre}},\n\nTe escribimos para confirmar que hemos recibido tu pago de {{montoPago}} con fecha {{fechaPago}} para la reserva en {{propiedad.nombre}}.\n\nDetalles de la reserva:\n- Check-in: {{fechaCheckIn}}\n- Check-out: {{fechaCheckOut}}\n- Monto total: {{montoReserva}}\n- Saldo pendiente actualizado: {{saldoReserva}}\n\n¡Muchas gracias por tu pago!\n\nSaludos cordiales.`
        },
        {
            name: 'Confirmación de Garantía',
            subject: 'Confirmación de recepción de garantía para {{propiedad.nombre}}',
            body: `Hola {{inquilino.nombre}},\n\nConfirmamos que hemos recibido el depósito de garantía de {{montoGarantia}} con fecha {{fechaGarantiaRecibida}} para tu reserva en {{propiedad.nombre}}.\n\nEste depósito será reembolsado al finalizar tu estancia, sujeto a la inspección de la propiedad.\n\n¡Gracias!\n\nSaludos cordiales.`
        }
    ];

    try {
        await addDefaultData(emailTemplatesCollection, defaultTemplates);
    } catch (error) {
        console.error("Error adding default email templates:", error);
    }
};

export async function getProperties(): Promise<Property[]> {
  const propertiesCollection = getRootCollectionRef<Property>('properties');
  const snapshot = await getDocs(query(propertiesCollection, orderBy('name')));
  return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Property[];
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  if (!id) return undefined;
  const propertiesCollection = getRootCollectionRef<Property>('properties');
  const docRef = doc(propertiesCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? processDoc({id: docSnap.id, data: docSnap.data}) as Property : undefined;
}


export async function getTenants(): Promise<Tenant[]> {
    const tenantsCollection = getRootCollectionRef<Tenant>('tenants');
    const snapshot = await getDocs(query(tenantsCollection, orderBy('name')));
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Tenant[];
}

export async function getTenantById(id: string): Promise<Tenant | undefined> {
    if (!id) return undefined;
    const tenantsCollection = getRootCollectionRef<Tenant>('tenants');
    const docRef = doc(tenantsCollection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc({id: docSnap.id, data: docSnap.data}) as Tenant : undefined;
}

async function getBookingDetails(booking: Booking): Promise<BookingWithDetails> {
    const [tenant, property, allPayments] = await Promise.all([
        getTenantById(booking.tenantId),
        getPropertyById(booking.propertyId),
        getPaymentsByBookingId(booking.id)
    ]);

    const totalPaidInUSD = allPayments.reduce((acc, payment) => acc + payment.amount, 0);
    
    let balance;
    if (booking.currency === 'USD') {
        balance = booking.amount - totalPaidInUSD;
    } else { 
        const totalPaidInArs = allPayments.reduce((acc, p) => {
            if (p.originalArsAmount) return acc + p.originalArsAmount;
            return p.exchangeRate ? acc + (p.amount * p.exchangeRate) : acc;
        }, 0);
        balance = booking.amount - totalPaidInArs;
    }

    return { 
        ...booking, 
        tenant, 
        property,
        totalPaid: totalPaidInUSD, 
        balance 
    };
}


export async function getBookings(): Promise<BookingWithDetails[]> {
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const snapshot = await getDocs(query(bookingsCollection, orderBy('startDate', 'asc')));
    const allBookings = snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Booking[];
    return Promise.all(allBookings.map(getBookingDetails));
}

export async function getBookingsByPropertyId(propertyId: string): Promise<BookingWithDetails[]> {
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const q = query(bookingsCollection, where('propertyId', '==', propertyId));
    const snapshot = await getDocs(q);
    const propertyBookings = snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Booking[];
    
    const detailedBookings = await Promise.all(propertyBookings.map(getBookingDetails));
    detailedBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    return detailedBookings;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
    if (!id) return undefined;
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const docRef = doc(bookingsCollection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc({id: docSnap.id, data: docSnap.data}) as Booking : undefined;
}


export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
    const expenseCategoriesCollection = getRootCollectionRef<ExpenseCategory>('expenseCategories');
    const snapshot = await getDocs(query(expenseCategoriesCollection, orderBy('name')));
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as ExpenseCategory[];
}


export async function getAllPropertyExpenses(): Promise<PropertyExpense[]> {
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');
    const snapshot = await getDocs(propertyExpensesCollection);
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as PropertyExpense[];
}

export async function getPropertyExpensesByPropertyId(propertyId: string): Promise<PropertyExpense[]> {
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');
    const q = query(propertyExpensesCollection, where('propertyId', '==', propertyId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as PropertyExpense[];
}


export async function getAllBookingExpenses(): Promise<BookingExpense[]> {
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const snapshot = await getDocs(bookingExpensesCollection);
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as BookingExpense[];
}

export async function getBookingExpensesByBookingId(bookingId: string): Promise<BookingExpense[]> {
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const q = query(bookingExpensesCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as BookingExpense[];
}

export async function getPaymentsByBookingId(bookingId: string): Promise<Payment[]> {
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const q = query(paymentsCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Payment[];
}


export async function getAllPayments(): Promise<Payment[]> {
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const snapshot = await getDocs(paymentsCollection);
    return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Payment[];
}

export async function getAllPaymentsWithDetails(): Promise<PaymentWithDetails[]> {
    const [payments, bookings, tenants, properties] = await Promise.all([
        getAllPayments(),
        getDocs(getRootCollectionRef('bookings')).then(snap => snap.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Booking[]),
        getTenants(),
        getProperties(),
    ]);

    const bookingsMap = new Map(bookings.map(b => [b.id, b]));
    const tenantsMap = new Map(tenants.map(t => [t.id, t.name]));
    const propertiesMap = new Map(properties.map(p => [p.id, p.name]));

    const detailedPayments = payments.map(payment => {
        const booking = bookingsMap.get(payment.bookingId);
        if (!booking) return { ...payment, propertyName: 'Reserva eliminada' };
        return {
            ...payment,
            propertyId: booking.propertyId,
            propertyName: propertiesMap.get(booking.propertyId) || 'N/A',
            tenantId: booking.tenantId,
            tenantName: tenantsMap.get(booking.tenantId) || 'N/A',
        };
    });

    detailedPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return detailedPayments;
}


export async function getFinancialSummaryByProperty(options?: { startDate?: string; endDate?: string }): Promise<FinancialSummaryByCurrency> {
    const startDate = options?.startDate;
    const endDate = options?.endDate;
    const fromDate = startDate ? new Date(startDate) : null;
    if (fromDate) fromDate.setUTCHours(0, 0, 0, 0);
    
    const toDate = endDate ? new Date(endDate) : null;
    if (toDate) toDate.setUTCHours(23, 59, 59, 999);

    const [allProperties, allBookings, allPropertyExpenses, allBookingExpenses, allPayments] = await Promise.all([
        getProperties(),
        getDocs(getRootCollectionRef('bookings')).then(s => s.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Booking[]),
        getAllPropertyExpenses(),
        getAllBookingExpenses(),
        getAllPayments(),
    ]);

    const isWithinDateRange = (dateStr: string) => {
        if (!dateStr || (!fromDate && !toDate)) return true;
        const itemDate = new Date(dateStr);
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
    };

    const getAverageExchangeRate = (): number => {
        const allTransactionsWithRate = [...allPayments.filter(p => p.exchangeRate), ...allPropertyExpenses.filter(e => e.exchangeRate), ...allBookingExpenses.filter(e => e.exchangeRate)];
        const validTransactions = allTransactionsWithRate.filter(t => isWithinDateRange(t.date));
        if (validTransactions.length === 0) return 1000;
        const totalRate = validTransactions.reduce((acc, t) => acc + t.exchangeRate!, 0);
        return totalRate / validTransactions.length;
    };

    const avgExchangeRate = getAverageExchangeRate();

    const createSummaryForARS = (): FinancialSummary[] => {
        return allProperties.map(property => {
            const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate));
            const incomeInArsFromArsBookings = propertyBookings.filter(b => b.currency === 'ARS').reduce((acc, b) => acc + b.amount, 0);
            const incomeInArsFromUsdBookings = propertyBookings.filter(b => b.currency === 'USD').reduce((acc, b) => acc + (b.amount * avgExchangeRate), 0);
            const totalIncome = incomeInArsFromArsBookings + incomeInArsFromUsdBookings;

            const propertyBookingIds = new Set(propertyBookings.map(b => b.id));
            const propertyPayments = allPayments.filter(p => propertyBookingIds.has(p.bookingId) && isWithinDateRange(p.date));
            const totalPayments = propertyPayments.reduce((acc, p) => acc + (p.originalArsAmount ?? (p.amount * avgExchangeRate)), 0);

            const propertyExpenses = allPropertyExpenses.filter(e => e.propertyId === property.id && isWithinDateRange(e.date));
            const totalPropertyExpenses = propertyExpenses.reduce((acc, e) => acc + e.amount, 0);

            const relevantBookingIds = new Set(allBookings.filter(b => b.propertyId === property.id).map(b => b.id));
            const relevantBookingExpenses = allBookingExpenses.filter(e => relevantBookingIds.has(e.bookingId) && isWithinDateRange(e.date));
            const totalBookingExpenses = relevantBookingExpenses.reduce((acc, e) => acc + e.amount, 0);

            const netResult = totalPayments - totalPropertyExpenses - totalBookingExpenses;

            return { propertyId: property.id, propertyName: property.name, totalIncome, totalPayments, balance: totalIncome - totalPayments, totalPropertyExpenses, totalBookingExpenses, netResult };
        });
    };

    const createSummaryForUSD = (): FinancialSummary[] => {
        return allProperties.map(property => {
            const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate));
            const incomeInUsdFromUsdBookings = propertyBookings.filter(b => b.currency === 'USD').reduce((acc, b) => acc + b.amount, 0);
            const safeAvgExchangeRate = avgExchangeRate || 1;
            const incomeInUsdFromArsBookings = propertyBookings.filter(b => b.currency === 'ARS').reduce((acc, b) => acc + (b.amount / (b.exchangeRate || safeAvgExchangeRate)), 0);
            const totalIncome = incomeInUsdFromUsdBookings + incomeInUsdFromArsBookings;

            const propertyBookingIds = new Set(propertyBookings.map(b => b.id));
            const propertyPayments = allPayments.filter(p => propertyBookingIds.has(p.bookingId) && isWithinDateRange(p.date));
            const totalPayments = propertyPayments.reduce((acc, p) => acc + p.amount, 0);

            const propertyExpenses = allPropertyExpenses.filter(e => e.propertyId === property.id && isWithinDateRange(e.date));
            const totalPropertyExpensesInUSD = propertyExpenses.reduce((acc, e) => acc + (e.originalUsdAmount ?? (e.amount / (e.exchangeRate || safeAvgExchangeRate))), 0);

            const relevantBookingIds = new Set(allBookings.filter(b => b.propertyId === property.id).map(b => b.id));
            const relevantBookingExpenses = allBookingExpenses.filter(e => relevantBookingIds.has(e.bookingId) && isWithinDateRange(e.date));
            const totalBookingExpensesInUSD = relevantBookingExpenses.reduce((acc, e) => acc + (e.originalUsdAmount ?? (e.amount / (e.exchangeRate || safeAvgExchangeRate))), 0);
            
            const netResult = totalPayments - totalPropertyExpensesInUSD - totalBookingExpensesInUSD;
            
            return { propertyId: property.id, propertyName: property.name, totalIncome, totalPayments, balance: totalIncome - totalPayments, totalPropertyExpenses: totalPropertyExpensesInUSD, totalBookingExpenses: totalBookingExpensesInUSD, netResult };
        });
    };

    return { ars: createSummaryForARS(), usd: createSummaryForUSD() };
}

export async function getAllExpensesUnified(): Promise<UnifiedExpense[]> {
    const [properties, bookings, tenants, propertyExpenses, bookingExpenses, categories] = await Promise.all([
        getProperties(),
        getDocs(getRootCollectionRef('bookings')).then(snap => snap.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as Booking[]),
        getTenants(),
        getAllPropertyExpenses(),
        getAllBookingExpenses(),
        getExpenseCategories(),
    ]);

    const propertiesMap = new Map(properties.map(p => [p.id, p.name]));
    const tenantsMap = new Map(tenants.map(t => [t.id, t.name]));
    const bookingsMap = new Map(bookings.map(b => [b.id, b]));
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));

    const getAverageExchangeRate = (): number => {
        const allExpensesWithRate = [...propertyExpenses, ...bookingExpenses].filter(e => e.exchangeRate);
        if (allExpensesWithRate.length === 0) return 1000;
        const totalRate = allExpensesWithRate.reduce((acc, e) => acc + e.exchangeRate!, 0);
        return totalRate / allExpensesWithRate.length;
    };
    const avgExchangeRate = getAverageExchangeRate();

    const unifiedList: UnifiedExpense[] = [];

    propertyExpenses.forEach(expense => {
        unifiedList.push({
            ...expense,
            type: 'Propiedad',
            amountARS: expense.amount,
            amountUSD: expense.originalUsdAmount ?? (expense.amount / (expense.exchangeRate || avgExchangeRate || 1)),
            propertyName: propertiesMap.get(expense.propertyId) || 'N/A',
            categoryName: expense.categoryId ? categoriesMap.get(expense.categoryId) : undefined,
        });
    });

    bookingExpenses.forEach(expense => {
        const booking = bookingsMap.get(expense.bookingId);
        if (booking) {
            unifiedList.push({
                ...expense,
                type: 'Reserva',
                amountARS: expense.amount,
                amountUSD: expense.originalUsdAmount ?? (expense.amount / (expense.exchangeRate || avgExchangeRate || 1)),
                propertyName: propertiesMap.get(booking.propertyId) || 'N/A',
                tenantName: tenantsMap.get(booking.tenantId) || 'N_A',
                categoryName: expense.categoryId ? categoriesMap.get(expense.categoryId) : undefined,
            });
        }
    });

    unifiedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return unifiedList;
}

export async function getBookingWithDetails(bookingId: string): Promise<BookingWithDetails | null> {
    const booking = await getBookingById(bookingId);
    if (!booking) return null;
    return getBookingDetails(booking);
}


export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  await initializeDefaultData();
  const emailTemplatesCollection = getRootCollectionRef<EmailTemplate>('emailTemplates');
  const snapshot = await getDocs(query(emailTemplatesCollection, orderBy('name')));
  return snapshot.docs.map(doc => processDoc({id: doc.id, data: doc.data})) as EmailTemplate[];
}

export async function getEmailSettings(): Promise<EmailSettings | null> {
    const settingsCollection = getRootCollectionRef<EmailSettings>('settings');
    const docRef = doc(settingsCollection, 'email');
    let docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
        await setDoc(docRef, { replyToEmail: '' });
        docSnap = await getDoc(docRef);
    }
    return processDoc({id: docSnap.id, data: docSnap.data}) as EmailSettings;
}

    