
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

const propertiesCollection = collection(db, 'properties');
const tenantsCollection = collection(db, 'tenants');
const bookingsCollection = collection(db, 'bookings');
const propertyExpensesCollection = collection(db, 'propertyExpenses');
const bookingExpensesCollection = collection(db, 'bookingExpenses');
const paymentsCollection = collection(db, 'payments');
const expenseCategoriesCollection = collection(db, 'expenseCategories');
const emailTemplatesCollection = collection(db, 'emailTemplates');
const settingsCollection = collection(db, 'settings');


// Helper function to add default data only if the collection is empty
const addDefaultData = async (collRef: any, data: any[]) => {
    const querySnapshot = await getDocs(collRef);
    if (querySnapshot.empty) {
        const batch = writeBatch(db);
        data.forEach(item => {
            const docRef = doc(collRef);
            batch.set(docRef, item);
        });
        await batch.commit();
        console.log(`Default data added to ${collRef.path}.`);
    } else {
        // console.log(`Collection ${collRef.path} already has data. Skipping default data.`);
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

export async function updateTenant(tenantData: Tenant): Promise<Tenant> {
    const { id, ...dataToUpdate } = tenantData;
    if (!id) {
        throw new Error("Tenant ID is required for updates.");
    }
    const tenantRef = doc(db, 'tenants', id);
    console.log(`[data.ts] Attempting to update tenant ${id} with data:`, dataToUpdate);
    try {
        await updateDoc(tenantRef, dataToUpdate);
        console.log(`[data.ts] Successfully updated tenant ${id}.`);
        return tenantData;
    } catch (error) {
        console.error(`[data.ts] Firestore update failed for tenant ${id}:`, error);
        throw error; // Re-throw the error to be caught by the server action
    }
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
    const docRef = doc(db, 'bookings', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc(docSnap) as Booking : undefined;
}


export async function addBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const docRef = await addDoc(bookingsCollection, booking);
    return { id: docRef.id, ...booking };
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
    const snapshot = await getDocs(query(expenseCategoriesCollection, orderBy('name')));
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
    // TODO: We might need to handle what happens to expenses that have this categoryId
    const docRef = doc(db, 'expenseCategories', id);
    await deleteDoc(docRef);
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
    
    // This now returns a more robust object, preventing crashes.
    return getBookingDetails(booking);
}


// --- Email Template Functions ---

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  // Try to add default templates if they don't exist
  await initializeDefaultData();
  const snapshot = await getDocs(query(emailTemplatesCollection, orderBy('name')));
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

export async function getEmailSettings(): Promise<EmailSettings | null> {
    const docRef = doc(db, 'settings', 'email');
    let docSnap = await getDoc(docRef);
    
    // If the document doesn't exist, create it with default empty values
    if (!docSnap.exists()) {
        await setDoc(docRef, { replyToEmail: '' });
        docSnap = await getDoc(docRef); // Re-fetch the newly created document
    }

    return processDoc(docSnap) as EmailSettings;
}

export async function updateEmailSettings(settings: Omit<EmailSettings, 'id'>): Promise<EmailSettings> {
    const docRef = doc(db, 'settings', 'email');
    // Use setDoc with merge:true to create or update the document
    await setDoc(docRef, settings, { merge: true });
    return { id: 'email', ...settings };
}
