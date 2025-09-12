
'use server';

import { db as clientDb } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';

// --- TYPE DEFINITIONS ---

// Helper to convert Firestore Timestamps to ISO strings
const processDoc = (doc: any) => {
    const data = doc.data();
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
  // New Guarantee Fields
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
  amount: number; // Always in USD now
  date: string;
  currency: 'USD'; // Always USD, but kept for potential future use.
  description?: string;
  exchangeRate?: number; // Stores the ARS to USD rate if original payment was in ARS
  originalArsAmount?: number; // Stores the original amount if paid in ARS
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
    currency: 'ARS'; // Always ARS
    exchangeRate?: number; // Stores the USD to ARS rate if original expense was in USD
    originalUsdAmount?: number; // Stores the original amount if paid in USD
    categoryId?: string;
}

export type BookingExpense = {
    id: string;
    bookingId: string;
    description: string;
    amount: number; // Always in ARS
    date: string;
    currency: 'ARS'; // Always ARS
    exchangeRate?: number; 
    originalUsdAmount?: number;
    categoryId?: string;
}

// Extend unified expense to include all original fields for editing
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
  body: string; // Will store HTML content
};

export type EmailSettings = {
    id: 'email';
    replyToEmail?: string;
}


// --- DATA ACCESS FUNCTIONS ---

// READ operations use the client DB instance for use in client components
const propertiesCollection = collection(clientDb, 'properties');
const tenantsCollection = collection(clientDb, 'tenants');
const bookingsCollection = collection(clientDb, 'bookings');
const propertyExpensesCollection = collection(clientDb, 'propertyExpenses');
const bookingExpensesCollection = collection(clientDb, 'bookingExpenses');
const paymentsCollection = collection(clientDb, 'payments');
const expenseCategoriesCollection = collection(clientDb, 'expenseCategories');
const emailTemplatesCollection = collection(clientDb, 'emailTemplates');
const settingsCollection = collection(clientDb, 'settings');

export async function getProperties(): Promise<Property[]> {
  const snapshot = await getDocs(query(propertiesCollection, orderBy('name')));
  return snapshot.docs.map(processDoc) as Property[];
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  if (!id) return undefined;
  const docRef = doc(clientDb, 'properties', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? processDoc(docSnap) as Property : undefined;
}

export async function getTenants(): Promise<Tenant[]> {
    const snapshot = await getDocs(query(tenantsCollection, orderBy('name')));
    return snapshot.docs.map(processDoc) as Tenant[];
}

export async function getTenantById(id: string): Promise<Tenant | undefined> {
    if (!id) return undefined;
    const docRef = doc(clientDb, 'tenants', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc(docSnap) as Tenant : undefined;
}

async function getBookingDetails(booking: Booking): Promise<BookingWithDetails> {
    const tenant = await getTenantById(booking.tenantId);
    const property = await getPropertyById(booking.propertyId);

    const allPayments = await getPaymentsByBookingId(booking.id);
    const totalPaidInUSD = allPayments.reduce((acc, payment) => acc + payment.amount, 0);

    let balance = 0;
    if (booking.currency === 'USD') {
        balance = booking.amount - totalPaidInUSD;
    } else { // currency is ARS
        const totalPaidInArs = allPayments.reduce((acc, p) => {
            if (p.originalArsAmount) {
                return acc + p.originalArsAmount;
            }
            // Fallback: if a USD payment has no rate, we can't convert it accurately
            // For now, we'll assume it doesn't contribute to the ARS balance in that edge case
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
    const snapshot = await getDocs(query(bookingsCollection, orderBy('startDate', 'asc')));
    const allBookings = snapshot.docs.map(processDoc) as Booking[];
    const allPayments = await getAllPayments();
    
    const detailedBookings = await Promise.all(allBookings.map(async (booking) => {
        const [tenant, property] = await Promise.all([
            getTenantById(booking.tenantId),
            getPropertyById(booking.propertyId)
        ]);
        const paymentsForBooking = allPayments.filter(p => p.bookingId === booking.id);
        const totalPaid = paymentsForBooking.reduce((acc, payment) => acc + payment.amount, 0);
        
        let balance;
        if (booking.currency === 'USD') {
             balance = booking.amount - totalPaid;
        } else {
             // For ARS bookings, the balance is best represented in ARS.
             // Here we assume payments are converted to ARS at some rate for a true balance,
             // but for simplicity, we just show the remaining ARS amount.
             // A more complex system would track payments in both currencies or convert at payment time.
             // For now, let's just subtract the USD payments converted at *some* rate.
             const lastPaymentRate = paymentsForBooking.find(p => p.exchangeRate)?.exchangeRate || booking.exchangeRate;
             if (lastPaymentRate) {
                const totalPaidInArs = totalPaid * lastPaymentRate;
                balance = booking.amount - totalPaidInArs;
             } else {
                // If no exchange rate, we can't calculate a meaningful mixed-currency balance.
                // Show the original amount as the balance.
                balance = booking.amount;
             }
        }

        return { ...booking, tenant, property, totalPaid, balance };
    }));

    return detailedBookings;
}

export async function getBookingsByPropertyId(propertyId: string): Promise<BookingWithDetails[]> {
    const q = query(bookingsCollection, where('propertyId', '==', propertyId));
    const snapshot = await getDocs(q);
    const propertyBookings = snapshot.docs.map(processDoc) as Booking[];
    
    const detailedBookings = await Promise.all(propertyBookings.map(booking => getBookingDetails(booking)));
    
    // Sort in application code to avoid needing a composite index
    detailedBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return detailedBookings;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
    if (!id) return undefined;
    const docRef = doc(clientDb, 'bookings', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc(docSnap) as Booking : undefined;
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
    const snapshot = await getDocs(query(expenseCategoriesCollection, orderBy('name')));
    return snapshot.docs.map(processDoc) as ExpenseCategory[];
}

export async function getAllPropertyExpenses(): Promise<PropertyExpense[]> {
    const snapshot = await getDocs(propertyExpensesCollection);
    return snapshot.docs.map(processDoc) as PropertyExpense[];
}

export async function getPropertyExpensesByPropertyId(propertyId: string): Promise<PropertyExpense[]> {
    const q = query(propertyExpensesCollection, where('propertyId', '==', propertyId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as PropertyExpense[];
}

export async function getAllBookingExpenses(): Promise<BookingExpense[]> {
    const snapshot = await getDocs(bookingExpensesCollection);
    return snapshot.docs.map(processDoc) as BookingExpense[];
}

export async function getBookingExpensesByBookingId(bookingId: string): Promise<BookingExpense[]> {
    const q = query(bookingExpensesCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as BookingExpense[];
}

export async function getPaymentsByBookingId(bookingId: string): Promise<Payment[]> {
    const q = query(paymentsCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as Payment[];
}

export async function getAllPayments(): Promise<Payment[]> {
    const snapshot = await getDocs(paymentsCollection);
    return snapshot.docs.map(processDoc) as Payment[];
}

export async function getAllPaymentsWithDetails(): Promise<PaymentWithDetails[]> {
    const [payments, bookings, tenants, properties] = await Promise.all([
        getAllPayments(),
        getDocs(bookingsCollection).then(snap => snap.docs.map(processDoc) as Booking[]),
        getTenants(),
        getProperties(),
    ]);

    const bookingsMap = new Map(bookings.map(b => [b.id, b]));
    const tenantsMap = new Map(tenants.map(t => [t.id, t.name]));
    const propertiesMap = new Map(properties.map(p => [p.id, p.name]));

    const detailedPayments = payments.map(payment => {
        const booking = bookingsMap.get(payment.bookingId);
        if (!booking) {
            return {
                ...payment,
                propertyName: 'Reserva eliminada',
            };
        }
        const tenantName = tenantsMap.get(booking.tenantId);
        const propertyName = propertiesMap.get(booking.propertyId);

        return {
            ...payment,
            propertyId: booking.propertyId,
            propertyName: propertyName || 'N/A',
            tenantId: booking.tenantId,
            tenantName: tenantName || 'N/A',
        };
    });

    // Sort by date descending
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

  const [allProperties, allBookingsData, allPropertyExpenses, allBookingExpenses, allPayments] = await Promise.all([
    getProperties(),
    getDocs(query(bookingsCollection)),
    getAllPropertyExpenses(),
    getAllBookingExpenses(),
    getAllPayments(),
  ]);
  const allBookings = allBookingsData.docs.map(processDoc) as Booking[];


  const isWithinDateRange = (dateStr: string) => {
      if (!dateStr || (!fromDate && !toDate)) return true;
      const itemDate = new Date(dateStr);
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
  };
  
  const getAverageExchangeRateForRange = (): number => {
    const allTransactionsWithRate = [
        ...allPayments.filter(p => p.exchangeRate), 
        ...allPropertyExpenses.filter(e => e.exchangeRate),
        ...allBookingExpenses.filter(e => e.exchangeRate)
    ];

    const validTransactions = allTransactionsWithRate.filter(t => isWithinDateRange(t.date));

    if (validTransactions.length === 0) return 0; // Return 0 if no rates are available
    
    const totalRate = validTransactions.reduce((acc, t) => acc + t.exchangeRate!, 0);
    return totalRate / validTransactions.length;
  }

  const avgExchangeRate = getAverageExchangeRateForRange();

  const createSummaryForARS = (): FinancialSummary[] => {
    return allProperties.map(property => {
      const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate));
      
      const incomeInArsFromArsBookings = propertyBookings
        .filter(b => b.currency === 'ARS')
        .reduce((acc, b) => acc + b.amount, 0);
      
      const incomeInArsFromUsdBookings = propertyBookings
        .filter(b => b.currency === 'USD')
        .reduce((acc, b) => acc + (b.amount * (avgExchangeRate > 0 ? avgExchangeRate : 1)), 0);

      const totalIncome = incomeInArsFromArsBookings + incomeInArsFromUsdBookings;

      const propertyBookingIds = new Set(propertyBookings.map(b => b.id));
      const propertyPayments = allPayments.filter(p => propertyBookingIds.has(p.bookingId) && isWithinDateRange(p.date));
      const totalPayments = propertyPayments.reduce((acc, p) => acc + (p.originalArsAmount ?? (p.amount * (p.exchangeRate || (avgExchangeRate > 0 ? avgExchangeRate : 1)))), 0);

      const propertyExpenses = allPropertyExpenses.filter(e => e.propertyId === property.id && isWithinDateRange(e.date));
      const totalPropertyExpenses = propertyExpenses.reduce((acc, e) => acc + e.amount, 0);
      
      const relevantBookingIds = new Set(allBookings.filter(b => b.propertyId === property.id).map(b => b.id));
      const relevantBookingExpenses = allBookingExpenses.filter(e => relevantBookingIds.has(e.bookingId) && isWithinDateRange(e.date));
      const totalBookingExpenses = relevantBookingExpenses.reduce((acc, e) => acc + e.amount, 0);

      const netResult = totalPayments - totalPropertyExpenses - totalBookingExpenses;

      return {
        propertyId: property.id,
        propertyName: property.name,
        totalIncome,
        totalPayments,
        balance: totalIncome - totalPayments,
        totalPropertyExpenses,
        totalBookingExpenses,
        netResult,
      };
    });
  }

  const createSummaryForUSD = (): FinancialSummary[] => {
    return allProperties.map(property => {
      const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate));
      
      const incomeInUsdFromUsdBookings = propertyBookings
          .filter(b => b.currency === 'USD')
          .reduce((acc, b) => acc + b.amount, 0);

      const incomeInUsdFromArsBookings = propertyBookings
          .filter(b => b.currency === 'ARS')
          .reduce((acc, b) => {
              const rate = b.exchangeRate || (avgExchangeRate > 0 ? avgExchangeRate : 1);
              return acc + (b.amount / rate)
            }, 0);

      const totalIncome = incomeInUsdFromUsdBookings + incomeInUsdFromArsBookings;

      const propertyBookingIds = new Set(propertyBookings.map(b => b.id));
      const propertyPayments = allPayments.filter(p => propertyBookingIds.has(p.bookingId) && isWithinDateRange(p.date));
      const totalPayments = propertyPayments.reduce((acc, p) => acc + p.amount, 0);

      const propertyExpenses = allPropertyExpenses.filter(e => e.propertyId === property.id && isWithinDateRange(e.date));
      const totalPropertyExpensesInUSD = propertyExpenses.reduce((acc, e) => {
          if (e.originalUsdAmount) return acc + e.originalUsdAmount;
          const rate = e.exchangeRate || (avgExchangeRate > 0 ? avgExchangeRate : 1);
          return acc + (e.amount / rate);
      }, 0);

      const relevantBookingIds = new Set(allBookings.filter(b => b.propertyId === property.id).map(b => b.id));
      const relevantBookingExpenses = allBookingExpenses.filter(e => relevantBookingIds.has(e.bookingId) && isWithinDateRange(e.date));
      const totalBookingExpensesInUSD = relevantBookingExpenses.reduce((acc, e) => {
          if (e.originalUsdAmount) return acc + e.originalUsdAmount;
          const rate = e.exchangeRate || (avgExchangeRate > 0 ? avgExchangeRate : 1);
          return acc + (e.amount / rate);
      }, 0);
      
      const netResult = totalPayments - totalPropertyExpensesInUSD - totalBookingExpensesInUSD;
      
      return {
          propertyId: property.id,
          propertyName: property.name,
          totalIncome: totalIncome,
          totalPayments: totalPayments,
          balance: totalIncome - totalPayments,
          totalPropertyExpenses: totalPropertyExpensesInUSD,
          totalBookingExpenses: totalBookingExpensesInUSD,
          netResult: netResult,
      }
    });
  }

  return {
    ars: createSummaryForARS(),
    usd: createSummaryForUSD(),
  };
}


export async function getAllExpensesUnified(): Promise<UnifiedExpense[]> {
    const [properties, bookings, tenants, propertyExpenses, bookingExpenses, categories] = await Promise.all([
        getProperties(),
        getDocs(bookingsCollection).then(snap => snap.docs.map(processDoc) as Booking[]),
        getTenants(),
        getAllPropertyExpenses(),
        getAllBookingExpenses(),
        getExpenseCategories(),
    ]);

    const propertiesMap = new Map(properties.map(p => [p.id, p.name]));
    const tenantsMap = new Map(tenants.map(t => [t.id, t.name]));
    const bookingsMap = new Map(bookings.map(b => [b.id, b]));
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));

    const unifiedList: UnifiedExpense[] = [];

    propertyExpenses.forEach(expense => {
        unifiedList.push({
            ...expense,
            type: 'Propiedad',
            amountARS: expense.amount,
            amountUSD: expense.originalUsdAmount ?? (expense.exchangeRate ? expense.amount / expense.exchangeRate : 0),
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
                amountUSD: expense.originalUsdAmount ?? (expense.exchangeRate ? expense.amount / expense.exchangeRate : 0),
                propertyName: propertiesMap.get(booking.propertyId) || 'N/A',
                tenantName: tenantsMap.get(booking.tenantId) || 'N_A',
                categoryName: expense.categoryId ? categoriesMap.get(expense.categoryId) : undefined,
            });
        }
    });

    // Sort by date descending
    unifiedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return unifiedList;
}

export async function getBookingWithDetails(bookingId: string): Promise<BookingWithDetails | null> {
    const booking = await getBookingById(bookingId);
    if (!booking) return null;
    
    // This now returns a more robust object, preventing crashes.
    return getBookingDetails(booking);
}


// --- Email Template Functions ---

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const snapshot = await getDocs(query(emailTemplatesCollection, orderBy('name')));
  return snapshot.docs.map(processDoc) as EmailTemplate[];
}

// --- App Settings Functions ---

export async function getEmailSettings(): Promise<EmailSettings | null> {
    const docRef = doc(clientDb, 'settings', 'email');
    let docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return processDoc(docSnap) as EmailSettings;
}
