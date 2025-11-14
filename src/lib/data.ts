

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
  collectionGroup,
  setDoc
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
  imageUrl: string;
  propertyUrl?: string;
  notes?: string;
  contractTemplate?: string;
  contractLogoUrl?: string;
  contractSignatureUrl?: string;
  customField1Label?: string;
  customField1Value?: string;
  customField2Label?: string;
  customField2Value?: string;
  customField3Label?: string;
  customField3Value?: string;
  customField4Label?: string;
  customField4Value?: string;
  customField5Label?: string;
  customField5Value?: string;
  customField6Label?: string;
  customField6Value?: string;
};

export type Origin = {
  id: string;
  name: string;
  color: string;
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
  originId?: string | null;
};

export type ContractStatus = 'not_sent' | 'sent' | 'signed' | 'not_required';
export type GuaranteeStatus = 'not_solicited' | 'solicited' | 'received' | 'returned' | 'not_applicable';
export type BookingStatus = 'active' | 'cancelled' | 'pending';


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
  originId?: string | null;
  status?: BookingStatus;
  // New Guarantee Fields
  guaranteeStatus?: GuaranteeStatus;
  guaranteeAmount?: number;
  guaranteeCurrency?: 'USD' | 'ARS';
  guaranteeReceivedDate?: string | null;
  guaranteeReturnedDate?: string | null;
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
    categoryId?: string | null;
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
    categoryId?: string | null;
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
};

export type AlertSettings = {
    id: 'alerts';
    checkInDays: number;
    checkOutDays: number;
};

export type TenantsByOriginSummary = {
  name: string;
  count: number;
  percentage: number;
  fill: string;
};

export type BookingsByOriginSummary = {
  name: string;
  count: number;
  percentage: number;
  fill: string;
};

export type ExpensesByCategorySummary = {
  name: string;
  totalAmountUSD: number;
  percentage: number;
  fill: string;
};

export type ExpensesByPropertySummary = {
  name: string;
  totalAmountUSD: number;
  percentage: number;
  fill: string;
};

export type BookingStatusSummary = {
  name: string;
  count: number;
  fill: string;
};

// --- DATA ACCESS FUNCTIONS ---

const propertiesCollection = collection(db, 'properties');
const tenantsCollection = collection(db, 'tenants');
const bookingsCollection = collection(db, 'bookings');
const propertyExpensesCollection = collection(db, 'propertyExpenses');
const bookingExpensesCollection = collection(db, 'bookingExpenses');
const paymentsCollection = collection(db, 'payments');
const expenseCategoriesCollection = collection(db, 'expenseCategories');
const emailTemplatesCollection = collection(db, 'emailTemplates');
const settingsCollection = collection(db, 'settings');
const originsCollection = collection(db, 'origins');


// Helper function to add default data only if the collection is empty
const addDefaultData = async (collRef: any, data: any[]) => {
    try {
        const querySnapshot = await getDocs(collRef);
        if (querySnapshot.empty) {
            const batch = writeBatch(db);
            data.forEach(item => {
                const docRef = doc(collRef);
                batch.set(docRef, item);
            });
            await batch.commit();
            console.log(`Default data added to ${collRef.path}.`);
        }
    } catch(e) {
        console.log(`Could not check for default data for ${collRef.path}. Probably offline.`)
    }
};


// Function to initialize default data for the app
const initializeDefaultData = async () => {
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
  const q = query(propertiesCollection, orderBy("name"));
  const snapshot = await getDocs(q);
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

export async function updateProperty(updatedProperty: Partial<Property>): Promise<Property | null> {
    const { id, ...data } = updatedProperty;
    if (!id) throw new Error("Update property requires an ID.");
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, data);
    const newDoc = await getDoc(docRef);
    return newDoc.exists() ? processDoc(newDoc) as Property : null;
}

export async function deleteProperty(propertyId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Delete the property itself
    const propertyRef = doc(db, 'properties', propertyId);
    batch.delete(propertyRef);

    // 2. Find and delete all bookings for the property
    const bookingsQuery = query(bookingsCollection, where('propertyId', '==', propertyId));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    const bookingIds = bookingsSnapshot.docs.map(d => d.id);

    if (bookingIds.length > 0) {
        // 3. Find and delete all payments for those bookings
        const paymentsQuery = query(paymentsCollection, where('bookingId', 'in', bookingIds));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

        // 4. Find and delete all booking expenses for those bookings
        const bookingExpensesQuery = query(bookingExpensesCollection, where('bookingId', 'in', bookingIds));
        const bookingExpensesSnapshot = await getDocs(bookingExpensesQuery);
        bookingExpensesSnapshot.forEach(doc => batch.delete(doc.ref));
    }

    // Delete the bookings themselves
    bookingsSnapshot.forEach(doc => batch.delete(doc.ref));

    // 5. Find and delete all property expenses
    const propertyExpensesQuery = query(propertyExpensesCollection, where('propertyId', '==', propertyId));
    const propertyExpensesSnapshot = await getDocs(propertyExpensesQuery);
    propertyExpensesSnapshot.forEach(doc => batch.delete(doc.ref));

    // Commit the batch
    await batch.commit();
}


export async function getTenants(): Promise<Tenant[]> {
    const q = query(tenantsCollection, orderBy("name"));
    const snapshot = await getDocs(q);
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
    const q = query(bookingsCollection, orderBy("startDate", "desc"));
    const snapshot = await getDocs(q);
    const allBookings = snapshot.docs.map(processDoc) as Booking[];
    
    const detailedBookings = await Promise.all(allBookings.map(booking => getBookingDetails(booking)));

    return detailedBookings;
}

export async function getBookingsByPropertyId(propertyId: string): Promise<BookingWithDetails[]> {
    const q = query(bookingsCollection, where('propertyId', '==', propertyId));
    const snapshot = await getDocs(q);
    const propertyBookings = snapshot.docs.map(processDoc) as Booking[];
    
    const detailedBookings = await Promise.all(propertyBookings.map(booking => getBookingDetails(booking)));
    detailedBookings.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return detailedBookings;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'bookings', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc(docSnap) as Booking : undefined;
}


export async function addBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const docRef = await addDoc(bookingsCollection, { ...booking, status: 'active' });
    return { id: docRef.id, ...booking, status: 'active' };
}

export async function updateBooking(updatedBooking: Partial<Booking>): Promise<Booking | null> {
    const { id, ...data } = updatedBooking;
    if (!id) throw new Error("Update booking requires an ID.");
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, data);
    const newDoc = await getDoc(docRef);
    return newDoc.exists() ? processDoc(newDoc) as Booking : null;
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

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
    const q = query(expenseCategoriesCollection, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as ExpenseCategory[];
}

export async function addExpenseCategory(category: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> {
    const docRef = await addDoc(expenseCategoriesCollection, category);
    return { id: docRef.id, ...category };
}

export async function updateExpenseCategory(updatedCategory: ExpenseCategory): Promise<ExpenseCategory> {
    const { id, ...data } = updatedCategory;
    const docRef = doc(db, 'expenseCategories', id);
    await updateDoc(docRef, data);
    return updatedCategory;
}

export async function deleteExpenseCategory(id: string): Promise<void> {
    const docRef = doc(db, 'expenseCategories', id);
    await deleteDoc(docRef);
}


export async function getAllPropertyExpenses(): Promise<PropertyExpense[]> {
    const q = query(propertyExpensesCollection, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
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
    const q = query(bookingExpensesCollection, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
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
    const q = query(paymentsCollection, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
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
    getDocs(bookingsCollection).then(snap => snap.docs.map(processDoc) as Booking[]),
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
      const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate) && (!b.status || b.status === 'active'));
      
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
      const propertyBookings = allBookings.filter(b => b.propertyId === property.id && isWithinDateRange(b.startDate) && (!b.status || b.status === 'active'));
      
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

    // Sort by date descending
    unifiedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return unifiedList;
}

export async function getBookingWithDetails(bookingId: string): Promise<BookingWithDetails | null> {
    const booking = await getBookingById(bookingId);
    if (!booking) return null;
    
    return getBookingDetails(booking);
}


// --- Email Template Functions ---

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  await initializeDefaultData();
  const q = query(emailTemplatesCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(processDoc) as EmailTemplate[];
}

export async function addEmailTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
  const docRef = await addDoc(emailTemplatesCollection, template);
  return { id: docRef.id, ...template };
}

export async function updateEmailTemplate(updatedTemplate: EmailTemplate): Promise<EmailTemplate> {
  const { id, ...data } = updatedTemplate;
  const docRef = doc(db, 'emailTemplates', id);
  await updateDoc(docRef, data);
  return updatedTemplate;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  const docRef = doc(db, 'emailTemplates', id);
  await deleteDoc(docRef);
}


// --- App Settings Functions ---

async function getSetting<T extends {id: string}>(id: 'email' | 'alerts'): Promise<T | null> {
    const docRef = doc(db, 'settings', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        return processDoc(docSnap) as T;
    }
    
    // If setting doesn't exist, create it with defaults
    let defaults: any = {};
    if (id === 'email') defaults = { replyToEmail: '' };
    if (id === 'alerts') defaults = { checkInDays: 7, checkOutDays: 3 };
    
    await setDoc(docRef, defaults);
    return { id, ...defaults } as T;
}


export async function getEmailSettings(): Promise<EmailSettings | null> {
    return getSetting<'email' | any>('email');
}

export async function updateEmailSettings(settings: Omit<EmailSettings, 'id'>): Promise<EmailSettings> {
    const docRef = doc(db, 'settings', 'email');
    await setDoc(docRef, settings, { merge: true });
    return { id: 'email', ...settings };
}

export async function getAlertSettings(): Promise<AlertSettings | null> {
    return getSetting<'alerts' | any>('alerts');
}

export async function updateAlertSettings(settings: Omit<AlertSettings, 'id'>): Promise<AlertSettings> {
    const docRef = doc(db, 'settings', 'alerts');
    await setDoc(docRef, settings, { merge: true });
    return { id: 'alerts', ...settings };
}


// --- Origin Functions ---

export async function getOrigins(): Promise<Origin[]> {
  const q = query(originsCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(processDoc) as Origin[];
}

export async function addOrigin(origin: Omit<Origin, 'id'>): Promise<Origin> {
  const docRef = await addDoc(originsCollection, origin);
  return { id: docRef.id, ...origin };
}

export async function updateOrigin(updatedOrigin: Origin): Promise<Origin> {
  const { id, ...data } = updatedOrigin;
  const docRef = doc(db, 'origins', id);
  await updateDoc(docRef, data);
  return updatedOrigin;
}

export async function deleteOrigin(id: string): Promise<void> {
  // Find tenants with this originId and unset it
  const tenantsToUpdateQuery = query(tenantsCollection, where('originId', '==', id));
  const tenantsSnapshot = await getDocs(tenantsToUpdateQuery);
  
  const batch = writeBatch(db);
  tenantsSnapshot.forEach(tenantDoc => {
    const tenantRef = doc(db, 'tenants', tenantDoc.id);
    batch.update(tenantRef, { originId: null });
  });

  // Also unset it in bookings
  const bookingsToUpdateQuery = query(bookingsCollection, where('originId', '==', id));
  const bookingsSnapshot = await getDocs(bookingsToUpdateQuery);
  bookingsSnapshot.forEach(bookingDoc => {
      const bookingRef = doc(db, 'bookings', bookingDoc.id);
      batch.update(bookingRef, { originId: null });
  });

  // Delete the origin itself
  const originRef = doc(db, 'origins', id);
  batch.delete(originRef);

  await batch.commit();
}


export async function getTenantsByOriginSummary(): Promise<TenantsByOriginSummary[]> {
  const [tenants, origins] = await Promise.all([
    getTenants(),
    getOrigins(),
  ]);

  const totalTenants = tenants.length;
  if (totalTenants === 0) {
    return [];
  }

  const originsMap = new Map(origins.map(o => [o.id, o]));
  const summaryMap = new Map<string, number>();

  // Initialize map with all existing origins to include those with 0 tenants
  origins.forEach(origin => {
    summaryMap.set(origin.id, 0);
  });

  // Add a "Sin Origen" category
  summaryMap.set('none', 0);

  // Count tenants for each origin
  tenants.forEach(tenant => {
    const originId = tenant.originId || 'none';
    summaryMap.set(originId, (summaryMap.get(originId) || 0) + 1);
  });
  
  const summary: TenantsByOriginSummary[] = [];
  
  summaryMap.forEach((count, originId) => {
    if (count > 0) {
        let name = "Sin Origen";
        let color = "#808080"; // Grey for 'none'

        if (originId !== 'none') {
            const origin = originsMap.get(originId);
            if (origin) {
                name = origin.name;
                color = origin.color;
            } else {
                name = "Origen Desconocido"
            }
        }
        
        summary.push({
            name: name,
            count: count,
            percentage: (count / totalTenants) * 100,
            fill: color,
        });
    }
  });

  return summary.sort((a,b) => b.count - a.count);
}


// --- New Expense Summary Functions ---

// Generates a color from a string. Simple hash function.
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

export async function getExpensesByCategorySummary(options?: { startDate?: string; endDate?: string }): Promise<ExpensesByCategorySummary[]> {
    const [allExpenses, categories] = await Promise.all([
        getAllExpensesUnified(),
        getExpenseCategories()
    ]);
    
    const startDate = options?.startDate;
    const endDate = options?.endDate;
    const fromDate = startDate ? new Date(startDate) : null;
    if (fromDate) fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = endDate ? new Date(endDate) : null;
    if (toDate) toDate.setUTCHours(23, 59, 59, 999);

    const isWithinDateRange = (dateStr: string) => {
        if (!dateStr || (!fromDate && !toDate)) return true;
        const itemDate = new Date(dateStr);
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
    };

    const filteredExpenses = allExpenses.filter(e => isWithinDateRange(e.date));

    if (filteredExpenses.length === 0) return [];

    const summaryMap = new Map<string, number>();
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));
    summaryMap.set('Sin Categoría', 0); // Initialize uncategorized

    filteredExpenses.forEach(expense => {
        const categoryName = expense.categoryId ? categoriesMap.get(expense.categoryId) || 'Sin Categoría' : 'Sin Categoría';
        const currentTotal = summaryMap.get(categoryName) || 0;
        summaryMap.set(categoryName, currentTotal + expense.amountUSD);
    });

    const totalExpenses = Array.from(summaryMap.values()).reduce((acc, val) => acc + val, 0);
    if (totalExpenses === 0) return [];

    const result = Array.from(summaryMap.entries()).map(([name, totalAmountUSD]) => ({
        name,
        totalAmountUSD,
        percentage: (totalAmountUSD / totalExpenses) * 100,
        fill: stringToColor(name)
    })).filter(item => item.totalAmountUSD > 0).sort((a,b) => b.totalAmountUSD - a.totalAmountUSD);

    return result;
}

export async function getExpensesByPropertySummary(options?: { startDate?: string; endDate?: string }): Promise<ExpensesByPropertySummary[]> {
    const allExpenses = await getAllExpensesUnified();
    const properties = await getProperties();
    
    const startDate = options?.startDate;
    const endDate = options?.endDate;
    const fromDate = startDate ? new Date(startDate) : null;
    if (fromDate) fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = endDate ? new Date(endDate) : null;
    if (toDate) toDate.setUTCHours(23, 59, 59, 999);

    const isWithinDateRange = (dateStr: string) => {
        if (!dateStr || (!fromDate && !toDate)) return true;
        const itemDate = new Date(dateStr);
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
    };

    const filteredExpenses = allExpenses.filter(e => isWithinDateRange(e.date));
    if (filteredExpenses.length === 0) return [];

    const summaryMap = new Map<string, number>();
    properties.forEach(p => summaryMap.set(p.name, 0)); // Initialize all properties

    filteredExpenses.forEach(expense => {
        if (expense.propertyName !== 'N/A') {
            const currentTotal = summaryMap.get(expense.propertyName) || 0;
            summaryMap.set(expense.propertyName, currentTotal + expense.amountUSD);
        }
    });
    
    const totalExpenses = Array.from(summaryMap.values()).reduce((acc, val) => acc + val, 0);
    if (totalExpenses === 0) return [];
    
    const result = Array.from(summaryMap.entries()).map(([name, totalAmountUSD]) => ({
        name,
        totalAmountUSD,
        percentage: (totalAmountUSD / totalExpenses) * 100,
        fill: stringToColor(name)
    })).filter(item => item.totalAmountUSD > 0).sort((a,b) => b.totalAmountUSD - a.totalAmountUSD);

    return result;
}

export async function getBookingsByOriginSummary(): Promise<BookingsByOriginSummary[]> {
  const [bookings, origins] = await Promise.all([
    getDocs(bookingsCollection).then(snap => snap.docs.map(processDoc) as Booking[]),
    getOrigins(),
  ]);

  const activeBookings = bookings.filter(b => b.status === 'active');

  const totalBookings = activeBookings.length;
  if (totalBookings === 0) {
    return [];
  }

  const originsMap = new Map(origins.map(o => [o.id, o]));
  const summaryMap = new Map<string, number>();

  // Initialize map with all existing origins to include those with 0 bookings
  origins.forEach(origin => {
    summaryMap.set(origin.id, 0);
  });
  summaryMap.set('none', 0); // For bookings without an origin

  // Count bookings for each origin
  activeBookings.forEach(booking => {
    const originId = booking.originId || 'none';
    summaryMap.set(originId, (summaryMap.get(originId) || 0) + 1);
  });
  
  const summary: BookingsByOriginSummary[] = [];
  
  summaryMap.forEach((count, originId) => {
    if (count > 0) {
      let name = "Sin Origen";
      let color = "#808080"; // Grey for 'none'

      if (originId !== 'none') {
        const origin = originsMap.get(originId);
        if (origin) {
          name = origin.name;
          color = origin.color;
        } else {
          name = "Origen Desconocido";
        }
      }
      
      summary.push({
        name: name,
        count: count,
        percentage: (count / totalBookings) * 100,
        fill: color,
      });
    }
  });

  return summary.sort((a,b) => b.count - a.count);
}

export async function getBookingStatusSummary(): Promise<BookingStatusSummary[]> {
  const bookings = await getDocs(bookingsCollection).then(snap => snap.docs.map(processDoc) as Booking[]);

  if (bookings.length === 0) {
    return [];
  }

  let activeCount = 0;
  let cancelledCount = 0;
  let pendingCount = 0;

  bookings.forEach(booking => {
    switch (booking.status) {
        case 'cancelled':
            cancelledCount++;
            break;
        case 'pending':
            pendingCount++;
            break;
        case 'active':
        default:
            activeCount++;
            break;
    }
  });
  
  const summary: BookingStatusSummary[] = [
    { name: 'Activas', count: activeCount, fill: '#22c55e' },
    { name: 'Canceladas', count: cancelledCount, fill: '#ef4444' },
    { name: 'En Espera', count: pendingCount, fill: '#f59e0b' },
  ];

  return summary.filter(item => item.count > 0);
}

    