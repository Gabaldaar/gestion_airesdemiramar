
import { db } from './firebase-admin'; // Use Admin SDK for server-side operations
import { getSession } from './session';
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
  setDoc
} from 'firebase-admin/firestore';


// --- TYPE DEFINITIONS ---

// Helper to convert Firestore Timestamps to ISO strings
const processDoc = (doc: FirebaseFirestore.DocumentSnapshot) => {
    const data = doc.data()!;
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

const getCollectionRef = async <T>(collectionName: string) => {
    const { uid } = await getSession();
    return collection(db, 'users', uid, collectionName) as FirebaseFirestore.CollectionReference<T>;
}

// --- DATA ACCESS FUNCTIONS ---

const getRootCollectionRef = <T>(collectionName: string) => {
    return collection(db, collectionName) as FirebaseFirestore.CollectionReference<T>;
};

// Helper function to add default data only if the collection is empty
const addDefaultData = async (collRef: FirebaseFirestore.CollectionReference<any>, data: any[]) => {
    const querySnapshot = await getDocs(collRef);
    if (querySnapshot.empty) {
        const batch = db.batch();
        data.forEach(item => {
            const docRef = doc(collRef);
            batch.set(docRef, item);
        });
        await batch.commit();
        console.log(`Default data added to ${collRef.path}.`);
    }
};

// Function to initialize default data for the app
const initializeDefaultData = async () => {
    const { uid } = await getSession();
    const emailTemplatesCollection = getRootCollectionRef<Omit<EmailTemplate, 'id'>>('emailTemplates');

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
  return snapshot.docs.map(processDoc) as Property[];
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  if (!id) return undefined;
  const propertiesCollection = getRootCollectionRef<Property>('properties');
  const docRef = doc(propertiesCollection, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists ? processDoc(docSnap) as Property : undefined;
}

export async function addProperty(property: Omit<Property, 'id'>): Promise<Property> {
    await getSession();
    const propertiesCollection = getRootCollectionRef<Omit<Property, 'id'>>('properties');
    const docRef = await addDoc(propertiesCollection, property);
    return { id: docRef.id, ...property };
}

export async function updateProperty(updatedProperty: Property): Promise<Property | null> {
    await getSession();
    const propertiesCollection = getRootCollectionRef<Property>('properties');
    const { id, ...data } = updatedProperty;
    const docRef = doc(propertiesCollection, id);
    await updateDoc(docRef, data);
    return updatedProperty;
}

export async function deleteProperty(propertyId: string): Promise<void> {
    await getSession();
    const batch = db.batch();

    const propertiesCollection = getRootCollectionRef<Property>('properties');
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');

    const propertyRef = doc(propertiesCollection, propertyId);
    batch.delete(propertyRef);

    const bookingsQuery = query(bookingsCollection, where('propertyId', '==', propertyId));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    const bookingIds = bookingsSnapshot.docs.map(d => d.id);

    if (bookingIds.length > 0) {
        const paymentsQuery = query(paymentsCollection, where('bookingId', 'in', bookingIds));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

        const bookingExpensesQuery = query(bookingExpensesCollection, where('bookingId', 'in', bookingIds));
        const bookingExpensesSnapshot = await getDocs(bookingExpensesQuery);
        bookingExpensesSnapshot.forEach(doc => batch.delete(doc.ref));
    }

    bookingsSnapshot.forEach(doc => batch.delete(doc.ref));

    const propertyExpensesQuery = query(propertyExpensesCollection, where('propertyId', '==', propertyId));
    const propertyExpensesSnapshot = await getDocs(propertyExpensesQuery);
    propertyExpensesSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
}


export async function getTenants(): Promise<Tenant[]> {
    const tenantsCollection = getRootCollectionRef<Tenant>('tenants');
    const snapshot = await getDocs(query(tenantsCollection, orderBy('name')));
    return snapshot.docs.map(processDoc) as Tenant[];
}

export async function getTenantById(id: string): Promise<Tenant | undefined> {
    if (!id) return undefined;
    const tenantsCollection = getRootCollectionRef<Tenant>('tenants');
    const docRef = doc(tenantsCollection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists ? processDoc(docSnap) as Tenant : undefined;
}

export async function addTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
    await getSession();
    const tenantsCollection = getRootCollectionRef<Omit<Tenant, 'id'>>('tenants');
    const docRef = await addDoc(tenantsCollection, tenant);
    return { id: docRef.id, ...tenant };
}

export async function updateTenant(tenantData: Tenant): Promise<Tenant> {
    await getSession();
    const tenantsCollection = getRootCollectionRef<Tenant>('tenants');
    const { id, ...dataToUpdate } = tenantData;
    if (!id) {
        throw new Error("Tenant ID is required for updates.");
    }
    const tenantRef = doc(tenantsCollection, id);
    await updateDoc(tenantRef, dataToUpdate);
    return tenantData;
}

export async function deleteTenant(id: string): Promise<boolean> {
    await getSession();
    const tenantsCollection = getRootCollectionRef<Tenant>('tenants');
    const docRef = doc(tenantsCollection, id);
    await deleteDoc(docRef);
    return true;
}

async function getBookingDetails(booking: Booking): Promise<BookingWithDetails> {
    const [tenant, property, allPayments] = await Promise.all([
        getTenantById(booking.tenantId),
        getPropertyById(booking.propertyId),
        getPaymentsByBookingId(booking.id)
    ]);

    const totalPaidInUSD = allPayments.reduce((acc, payment) => acc + payment.amount, 0);

    let balance = 0;
    if (booking.currency === 'USD') {
        balance = booking.amount - totalPaidInUSD;
    } else { 
        const totalPaidInArs = allPayments.reduce((acc, p) => {
            if (p.originalArsAmount) {
                return acc + p.originalArsAmount;
            }
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
    const allBookings = snapshot.docs.map(processDoc) as Booking[];
    
    return Promise.all(allBookings.map(booking => getBookingDetails(booking)));
}

export async function getBookingsByPropertyId(propertyId: string): Promise<BookingWithDetails[]> {
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const q = query(bookingsCollection, where('propertyId', '==', propertyId));
    const snapshot = await getDocs(q);
    const propertyBookings = snapshot.docs.map(processDoc) as Booking[];
    
    const detailedBookings = await Promise.all(propertyBookings.map(booking => getBookingDetails(booking)));
    
    detailedBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return detailedBookings;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
    if (!id) return undefined;
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const docRef = doc(bookingsCollection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists ? processDoc(docSnap) as Booking : undefined;
}


export async function addBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    await getSession();
    const bookingsCollection = getRootCollectionRef<Omit<Booking, 'id'>>('bookings');
    const docRef = await addDoc(bookingsCollection, booking);
    return { id: docRef.id, ...booking };
}

export async function updateBooking(updatedBooking: Partial<Booking>): Promise<Booking | null> {
    await getSession();
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const { id, ...data } = updatedBooking;
    if (!id) throw new Error("Update booking requires an ID.");
    const docRef = doc(bookingsCollection, id);
    await updateDoc(docRef, data);
    const newDoc = await getDoc(docRef);
    return newDoc.exists ? processDoc(newDoc) as Booking : null;
}

export async function deleteBooking(id: string): Promise<boolean> {
    await getSession();
    const batch = db.batch();
    
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');

    const bookingRef = doc(bookingsCollection, id);
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

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
    const expenseCategoriesCollection = getRootCollectionRef<ExpenseCategory>('expenseCategories');
    const snapshot = await getDocs(query(expenseCategoriesCollection, orderBy('name')));
    return snapshot.docs.map(processDoc) as ExpenseCategory[];
}

export async function addExpenseCategory(category: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> {
    await getSession();
    const expenseCategoriesCollection = getRootCollectionRef<Omit<ExpenseCategory, 'id'>>('expenseCategories');
    const docRef = await addDoc(expenseCategoriesCollection, category);
    return { id: docRef.id, ...category };
}

export async function updateExpenseCategory(updatedCategory: ExpenseCategory): Promise<ExpenseCategory> {
    await getSession();
    const expenseCategoriesCollection = getRootCollectionRef<ExpenseCategory>('expenseCategories');
    const { id, ...data } = updatedCategory;
    const docRef = doc(expenseCategoriesCollection, id);
    await updateDoc(docRef, data);
    return updatedCategory;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
    await getSession();
    const expenseCategoriesCollection = getRootCollectionRef<ExpenseCategory>('expenseCategories');
    const docRef = doc(expenseCategoriesCollection, id);
    await deleteDoc(docRef);
}

export async function getAllPropertyExpenses(): Promise<PropertyExpense[]> {
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');
    const snapshot = await getDocs(propertyExpensesCollection);
    return snapshot.docs.map(processDoc) as PropertyExpense[];
}

export async function getPropertyExpensesByPropertyId(propertyId: string): Promise<PropertyExpense[]> {
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');
    const q = query(propertyExpensesCollection, where('propertyId', '==', propertyId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as PropertyExpense[];
}

export async function addPropertyExpense(expense: Omit<PropertyExpense, 'id'>): Promise<PropertyExpense> {
    await getSession();
    const propertyExpensesCollection = getRootCollectionRef<Omit<PropertyExpense, 'id'>>('propertyExpenses');
    const docRef = await addDoc(propertyExpensesCollection, { ...expense, currency: 'ARS' });
    return { id: docRef.id, ...expense, currency: 'ARS' };
}

export async function updatePropertyExpense(updatedExpense: PropertyExpense): Promise<PropertyExpense | null> {
    await getSession();
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');
    const { id, ...data } = updatedExpense;
    const docRef = doc(propertyExpensesCollection, id);
    await updateDoc(docRef, { ...data, currency: 'ARS' });
    return { ...updatedExpense, currency: 'ARS' };
}

export async function deletePropertyExpense(id: string): Promise<boolean> {
    await getSession();
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');
    const docRef = doc(propertyExpensesCollection, id);
    await deleteDoc(docRef);
    return true;
}

export async function getAllBookingExpenses(): Promise<BookingExpense[]> {
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const snapshot = await getDocs(bookingExpensesCollection);
    return snapshot.docs.map(processDoc) as BookingExpense[];
}

export async function getBookingExpensesByBookingId(bookingId: string): Promise<BookingExpense[]> {
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const q = query(bookingExpensesCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as BookingExpense[];
}

export async function addBookingExpense(expense: Omit<BookingExpense, 'id'>): Promise<BookingExpense> {
    await getSession();
    const bookingExpensesCollection = getRootCollectionRef<Omit<BookingExpense, 'id'>>('bookingExpenses');
    const docRef = await addDoc(bookingExpensesCollection, { ...expense, currency: 'ARS' });
    return { id: docRef.id, ...expense, currency: 'ARS' };
}

export async function updateBookingExpense(updatedExpense: BookingExpense): Promise<BookingExpense | null> {
    await getSession();
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const { id, ...data } = updatedExpense;
    const docRef = doc(bookingExpensesCollection, id);
    await updateDoc(docRef, { ...data, currency: 'ARS' });
    return { ...updatedExpense, currency: 'ARS' };
}

export async function deleteBookingExpense(id: string): Promise<boolean> {
    await getSession();
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const docRef = doc(bookingExpensesCollection, id);
    await deleteDoc(docRef);
    return true;
}

export async function getPaymentsByBookingId(bookingId: string): Promise<Payment[]> {
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const q = query(paymentsCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as Payment[];
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    await getSession();
    const paymentsCollection = getRootCollectionRef<Omit<Payment, 'id'>>('payments');
    const docRef = await addDoc(paymentsCollection, { ...payment, currency: 'USD' });
    return { id: docRef.id, ...payment, currency: 'USD' };
}

export async function updatePayment(updatedPayment: Payment): Promise<Payment | null> {
    await getSession();
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const { id, ...data } = updatedPayment;
    const docRef = doc(paymentsCollection, id);
    await updateDoc(docRef, { ...data, currency: 'USD' });
    return { ...updatedPayment, currency: 'USD' };
}

export async function deletePayment(id: string): Promise<boolean> {
    await getSession();
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const docRef = doc(paymentsCollection, id);
    await deleteDoc(docRef);
    return true;
}

export async function getAllPayments(): Promise<Payment[]> {
    const paymentsCollection = getRootCollectionRef<Payment>('payments');
    const snapshot = await getDocs(paymentsCollection);
    return snapshot.docs.map(processDoc) as Payment[];
}

export async function getAllPaymentsWithDetails(): Promise<PaymentWithDetails[]> {
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
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
            return { ...payment, propertyName: 'Reserva eliminada' };
        }
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
    const { uid } = await getSession();

    const propertiesCollection = getRootCollectionRef<Property>('properties');
    const bookingsCollection = getRootCollectionRef<Booking>('bookings');
    const propertyExpensesCollection = getRootCollectionRef<PropertyExpense>('propertyExpenses');
    const bookingExpensesCollection = getRootCollectionRef<BookingExpense>('bookingExpenses');
    const paymentsCollection = getRootCollectionRef<Payment>('payments');

  const startDate = options?.startDate;
  const endDate = options?.endDate;
  const fromDate = startDate ? new Date(startDate) : null;
  if (fromDate) fromDate.setUTCHours(0, 0, 0, 0);
  
  const toDate = endDate ? new Date(endDate) : null;
  if (toDate) toDate.setUTCHours(23, 59, 59, 999);

  const [allProperties, allBookingsData, allPropertyExpenses, allBookingExpenses, allPayments] = await Promise.all([
    getDocs(query(propertiesCollection)).then(s => s.docs.map(processDoc)) as Promise<Property[]>,
    getDocs(query(bookingsCollection)).then(s => s.docs.map(processDoc)) as Promise<Booking[]>,
    getDocs(query(propertyExpensesCollection)).then(s => s.docs.map(processDoc)) as Promise<PropertyExpense[]>,
    getDocs(query(bookingExpensesCollection)).then(s => s.docs.map(processDoc)) as Promise<BookingExpense[]>,
    getDocs(query(paymentsCollection)).then(s => s.docs.map(processDoc)) as Promise<Payment[]>,
  ]);

  const isWithinDateRange = (dateStr: string) => {
      if (!dateStr || (!fromDate && !toDate)) return true;
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

      const safeAvgExchangeRate = avgExchangeRate || 1;
      const incomeInUsdFromArsBookings = propertyBookings
          .filter(b => b.currency === 'ARS')
          .reduce((acc, b) => acc + (b.amount / (b.exchangeRate || safeAvgExchangeRate)), 0);

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
        getDocs(getRootCollectionRef('bookings')).then(snap => snap.docs.map(processDoc) as Booking[]),
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
        if (allExpensesWithRate.length === 0) return 1000; // Fallback
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
  await getSession();
  await initializeDefaultData();
  const emailTemplatesCollection = getRootCollectionRef<EmailTemplate>('emailTemplates');
  const snapshot = await getDocs(query(emailTemplatesCollection, orderBy('name')));
  return snapshot.docs.map(processDoc) as EmailTemplate[];
}

export async function addEmailTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
  await getSession();
  const emailTemplatesCollection = getRootCollectionRef<Omit<EmailTemplate, 'id'>>('emailTemplates');
  const docRef = await addDoc(emailTemplatesCollection, template);
  return { id: docRef.id, ...template };
}

export async function updateEmailTemplate(updatedTemplate: EmailTemplate): Promise<EmailTemplate> {
  await getSession();
  const emailTemplatesCollection = getRootCollectionRef<EmailTemplate>('emailTemplates');
  const { id, ...data } = updatedTemplate;
  const docRef = doc(emailTemplatesCollection, id);
  await updateDoc(docRef, data);
  return updatedTemplate;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await getSession();
  const emailTemplatesCollection = getRootCollectionRef<EmailTemplate>('emailTemplates');
  const docRef = doc(emailTemplatesCollection, id);
  await deleteDoc(docRef);
}


export async function getEmailSettings(): Promise<EmailSettings | null> {
    await getSession();
    const settingsCollection = getRootCollectionRef<EmailSettings>('settings');
    const docRef = doc(settingsCollection, 'email');
    let docSnap = await getDoc(docRef);
    
    if (!docSnap.exists) {
        await setDoc(docRef, { replyToEmail: '' });
        docSnap = await getDoc(docRef);
    }

    return processDoc(docSnap) as EmailSettings;
}

export async function updateEmailSettings(settings: Omit<EmailSettings, 'id'>): Promise<EmailSettings> {
    await getSession();
    const settingsCollection = getRootCollectionRef<Omit<EmailSettings, 'id'>>('settings');
    const docRef = doc(settingsCollection, 'email');
    await setDoc(docRef, settings, { merge: true });
    return { id: 'email', ...settings };
}
