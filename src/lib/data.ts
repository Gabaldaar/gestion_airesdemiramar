
import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  collectionGroup
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

export type PropertyExpense = {
    id: string;
    propertyId: string;
    description: string;
    amount: number; // Always in ARS
    date: string;
    currency: 'ARS'; // Always ARS
    exchangeRate?: number; // Stores the USD to ARS rate if original expense was in USD
    originalUsdAmount?: number; // Stores the original amount if paid in USD
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
}

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

// --- DATA ACCESS FUNCTIONS ---

const propertiesCollection = collection(db, 'properties');
const tenantsCollection = collection(db, 'tenants');
const bookingsCollection = collection(db, 'bookings');
const propertyExpensesCollection = collection(db, 'propertyExpenses');
const bookingExpensesCollection = collection(db, 'bookingExpenses');
const paymentsCollection = collection(db, 'payments');


export async function getProperties(): Promise<Property[]> {
  const snapshot = await getDocs(query(propertiesCollection, orderBy('name')));
  return snapshot.docs.map(processDoc) as Property[];
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  if (!id) return undefined;
  const docRef = doc(db, 'properties', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? processDoc(docSnap) as Property : undefined;
}

export async function addProperty(property: Omit<Property, 'id'>): Promise<Property> {
    const docRef = await addDoc(propertiesCollection, property);
    return { id: docRef.id, ...property };
}

export async function updateProperty(updatedProperty: Property): Promise<Property | null> {
    const { id, ...data } = updatedProperty;
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, data);
    return updatedProperty;
}


export async function getTenants(): Promise<Tenant[]> {
    const snapshot = await getDocs(query(tenantsCollection, orderBy('name')));
    return snapshot.docs.map(processDoc) as Tenant[];
}

export async function getTenantById(id: string): Promise<Tenant | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'tenants', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc(docSnap) as Tenant : undefined;
}

export async function addTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
    const docRef = await addDoc(tenantsCollection, tenant);
    return { id: docRef.id, ...tenant };
}

export async function updateTenant(updatedTenant: Tenant): Promise<Tenant | null> {
    const { id, ...data } = updatedTenant;
    const docRef = doc(db, 'tenants', id);
    await updateDoc(docRef, data);
    return updatedTenant;
}

export async function deleteTenant(id: string): Promise<boolean> {
    const docRef = doc(db, 'tenants', id);
    await deleteDoc(docRef);
    return true;
}


async function getBookingDetails(booking: Booking, allPayments: Payment[]): Promise<BookingWithDetails> {
    const [tenant, property] = await Promise.all([
        getTenantById(booking.tenantId),
        getPropertyById(booking.propertyId)
    ]);

    const paymentsForBooking = allPayments.filter(p => p.bookingId === booking.id);
    const totalPaidInUSD = paymentsForBooking.reduce((acc, payment) => acc + payment.amount, 0);

    const bookingAmountInUSD = booking.currency === 'ARS' ? (booking.amount / (booking.exchangeRate || 1)) : booking.amount;
    const balance = booking.currency === booking.currency ? booking.amount - totalPaidInUSD : bookingAmountInUSD - totalPaidInUSD;


    return { ...booking, tenant, property, totalPaid: totalPaidInUSD, balance };
}


export async function getBookings(): Promise<BookingWithDetails[]> {
    const snapshot = await getDocs(query(bookingsCollection, orderBy('startDate', 'desc')));
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
             const lastPaymentRate = paymentsForBooking[paymentsForBooking.length - 1]?.exchangeRate;
             if (lastPaymentRate) {
                balance = booking.amount - (totalPaid * lastPaymentRate);
             } else {
                balance = booking.amount;
             }
        }

        return { ...booking, tenant, property, totalPaid, balance };
    }));

    return detailedBookings;
}

export async function getBookingsByPropertyId(propertyId: string): Promise<BookingWithDetails[]> {
    const q = query(bookingsCollection, where('propertyId', '==', propertyId), orderBy('startDate', 'desc'));
    const snapshot = await getDocs(q);
    const propertyBookings = snapshot.docs.map(processDoc) as Booking[];
    const allPayments = await getAllPayments();
    return Promise.all(propertyBookings.map(booking => getBookingDetails(booking, allPayments)));
}

export async function addBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const docRef = await addDoc(bookingsCollection, booking);
    return { id: docRef.id, ...booking };
}

export async function updateBooking(updatedBooking: Booking): Promise<Booking | null> {
    const { id, ...data } = updatedBooking;
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, data);
    return updatedBooking;
}

export async function deleteBooking(id: string): Promise<boolean> {
    const batch = writeBatch(db);
    
    const bookingRef = doc(db, 'bookings', id);
    batch.delete(bookingRef);

    const paymentsQuery = query(paymentsCollection, where('bookingId', '==', id));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

    const expensesQuery = query(bookingExpensesCollection, where('bookingId', '==', id));
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return true;
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

export async function addPropertyExpense(expense: Omit<PropertyExpense, 'id'>): Promise<PropertyExpense> {
    const docRef = await addDoc(propertyExpensesCollection, { ...expense, currency: 'ARS' });
    return { id: docRef.id, ...expense, currency: 'ARS' };
}

export async function updatePropertyExpense(updatedExpense: PropertyExpense): Promise<PropertyExpense | null> {
    const { id, ...data } = updatedExpense;
    const docRef = doc(db, 'propertyExpenses', id);
    await updateDoc(docRef, { ...data, currency: 'ARS' });
    return { ...updatedExpense, currency: 'ARS' };
}

export async function deletePropertyExpense(id: string): Promise<boolean> {
    const docRef = doc(db, 'propertyExpenses', id);
    await deleteDoc(docRef);
    return true;
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

export async function addBookingExpense(expense: Omit<BookingExpense, 'id'>): Promise<BookingExpense> {
    const docRef = await addDoc(bookingExpensesCollection, { ...expense, currency: 'ARS' });
    return { id: docRef.id, ...expense, currency: 'ARS' };
}

export async function updateBookingExpense(updatedExpense: BookingExpense): Promise<BookingExpense | null> {
    const { id, ...data } = updatedExpense;
    const docRef = doc(db, 'bookingExpenses', id);
await updateDoc(docRef, { ...data, currency: 'ARS' });
    return { ...updatedExpense, currency: 'ARS' };
}

export async function deleteBookingExpense(id: string): Promise<boolean> {
    const docRef = doc(db, 'bookingExpenses', id);
    await deleteDoc(docRef);
    return true;
}

export async function getPaymentsByBookingId(bookingId: string): Promise<Payment[]> {
    const q = query(paymentsCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as Payment[];
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const docRef = await addDoc(paymentsCollection, { ...payment, currency: 'USD' });
    return { id: docRef.id, ...payment, currency: 'USD' };
}

export async function updatePayment(updatedPayment: Payment): Promise<Payment | null> {
    const { id, ...data } = updatedPayment;
    const docRef = doc(db, 'payments', id);
    await updateDoc(docRef, { ...data, currency: 'USD' });
    return { ...updatedPayment, currency: 'USD' };
}

export async function deletePayment(id: string): Promise<boolean> {
    const docRef = doc(db, 'payments', id);
    await deleteDoc(docRef);
    return true;
}

export async function getAllPayments(): Promise<Payment[]> {
    const snapshot = await getDocs(paymentsCollection);
    return snapshot.docs.map(processDoc) as Payment[];
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
      if (!fromDate && !toDate) return true;
      const itemDate = new Date(dateStr);
      if (fromDate && itemDate < fromDate) return false;
      if (toDate && itemDate > toDate) return false;
      return true;
  };
  
  const getAverageExchangeRate = (): number => {
    const allTransactionsWithRate = [
        ...allPayments.filter(p => p.exchangeRate), 
        ...allPropertyExpenses.filter(e => e.exchangeRate),
        ...allBookingExpenses.filter(e => e.exchangeRate)
    ];

    const validTransactions = allTransactionsWithRate.filter(t => isWithinDateRange(t.date));

    if (validTransactions.length === 0) return 1000; // Default fallback
    
    const totalRate = validTransactions.reduce((acc, t) => acc + t.exchangeRate!, 0);
    return totalRate / validTransactions.length;
  }

  const avgExchangeRate = getAverageExchangeRate();

  const createSummaryForARS = (): FinancialSummary[] => {
    return allProperties.map(property => {
      const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate));
      
      const incomeInArsFromArsBookings = propertyBookings
        .filter(b => b.currency === 'ARS')
        .reduce((acc, b) => acc + b.amount, 0);
      
      const incomeInArsFromUsdBookings = propertyBookings
        .filter(b => b.currency === 'USD')
        .reduce((acc, b) => acc + (b.amount * avgExchangeRate), 0);

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
          .reduce((acc, b) => acc + (b.amount / (b.exchangeRate || avgExchangeRate)), 0);

      const totalIncome = incomeInUsdFromUsdBookings + incomeInUsdFromArsBookings;

      const propertyBookingIds = new Set(propertyBookings.map(b => b.id));
      const propertyPayments = allPayments.filter(p => propertyBookingIds.has(p.bookingId) && isWithinDateRange(p.date));
      const totalPayments = propertyPayments.reduce((acc, p) => acc + p.amount, 0);

      const propertyExpenses = allPropertyExpenses.filter(e => e.propertyId === property.id && isWithinDateRange(e.date));
      const totalPropertyExpensesInUSD = propertyExpenses.reduce((acc, e) => acc + (e.originalUsdAmount ?? (e.amount / avgExchangeRate)), 0);

      const relevantBookingIds = new Set(allBookings.filter(b => b.propertyId === property.id).map(b => b.id));
      const relevantBookingExpenses = allBookingExpenses.filter(e => relevantBookingIds.has(e.bookingId) && isWithinDateRange(e.date));
      const totalBookingExpensesInUSD = relevantBookingExpenses.reduce((acc, e) => acc + (e.originalUsdAmount ?? (e.amount / avgExchangeRate)), 0);
      
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


    
