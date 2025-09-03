
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
};

export type Booking = {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: 'USD' | 'ARS';
  exchangeRate?: number;
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
  amount: number;
  date: string;
  currency: 'USD' | 'ARS';
};

export type PropertyExpense = {
    id: string;
    propertyId: string;
    description: string;
    amount: number;
    date: string;
}

export type BookingExpense = {
    id: string;
    bookingId: string;
    description: string;
    amount: number;
    date: string;
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
    const totalPaid = paymentsForBooking.reduce((acc, payment) => {
        if (payment.currency === booking.currency) {
            return acc + payment.amount;
        }
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
    const snapshot = await getDocs(query(bookingsCollection, orderBy('startDate', 'desc')));
    const allBookings = snapshot.docs.map(processDoc) as Booking[];
    const allPayments = await getAllPayments();
    return Promise.all(allBookings.map(booking => getBookingDetails(booking, allPayments)));
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
    
    // Delete booking
    const bookingRef = doc(db, 'bookings', id);
    batch.delete(bookingRef);

    // Delete associated payments
    const paymentsQuery = query(paymentsCollection, where('bookingId', '==', id));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete associated booking expenses
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
    const docRef = await addDoc(propertyExpensesCollection, expense);
    return { id: docRef.id, ...expense };
}

export async function updatePropertyExpense(updatedExpense: PropertyExpense): Promise<PropertyExpense | null> {
    const { id, ...data } = updatedExpense;
    const docRef = doc(db, 'propertyExpenses', id);
    await updateDoc(docRef, data);
    return updatedExpense;
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
    const docRef = await addDoc(bookingExpensesCollection, expense);
    return { id: docRef.id, ...expense };
}

export async function updateBookingExpense(updatedExpense: BookingExpense): Promise<BookingExpense | null> {
    const { id, ...data } = updatedExpense;
    const docRef = doc(db, 'bookingExpenses', id);
    await updateDoc(docRef, data);
    return updatedExpense;
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
    const docRef = await addDoc(paymentsCollection, payment);
    return { id: docRef.id, ...payment };
}

export async function updatePayment(updatedPayment: Payment): Promise<Payment | null> {
    const { id, ...data } = updatedPayment;
    const docRef = doc(db, 'payments', id);
    await updateDoc(docRef, data);
    return updatedPayment;
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


export async function getFinancialSummaryByProperty(options?: { startDate?: string; endDate?: string }): Promise<FinancialSummary[]> {
  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const fromDate = startDate ? new Date(startDate) : null;
  if (fromDate) fromDate.setUTCHours(0, 0, 0, 0);
  
  const toDate = endDate ? new Date(endDate) : null;
  if (toDate) toDate.setUTCHours(23, 59, 59, 999);

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
