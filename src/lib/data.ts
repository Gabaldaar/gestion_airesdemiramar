

'use server';

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
  setDoc,
  documentId,
} from 'firebase/firestore';


// --- TYPE DEFINITIONS ---

// Helper to convert Firestore Timestamps to ISO strings.
const processDoc = (doc: any) => {
    const data = doc.data();
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            // Convert timestamp to Date, then get YYYY-MM-DD in UTC,
            // to avoid timezone shifts during conversion.
            const d = data[key].toDate();
            const year = d.getUTCFullYear();
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            data[key] = `${year}-${month}-${day}`;
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
  priceSheetName?: string;
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
  countryCode?: string;
  email: string;
  phone: string;
  notes?: string;
  originId?: string | null;
  rating?: number;
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

export type DateBlock = {
    id: string;
    propertyId: string;
    startDate: string;
    endDate: string;
    reason?: string;
};


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

export type Expense = {
    id: string;
    assignment: TaskAssignment;
    description: string;
    amount: number; // Always in ARS
    date: string;
    currency: 'ARS'; // Always ARS
    exchangeRate?: number; // Stores the USD to ARS rate if original expense was in USD
    originalUsdAmount?: number; // Stores the original amount if paid in USD
    categoryId?: string | null;
    taskId?: string | null;
    providerId?: string | null;
}

export type ExpenseWithDetails = Expense & {
    assignmentName: string;
    assignmentColor?: string;
    categoryName?: string;
    providerName?: string;
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

export type PushSubscription = {
    id: string; // Using endpoint as ID for simplicity
    endpoint: string;
    expirationTime?: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}


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

// Type definition for the pricing rules coming from Google App Script
export type PriceRange = {
  desde: string; // "YYYY-MM-DD"
  hasta: string; // "YYYY-MM-DD"
  precio: number;
};

export type MinimumStay = {
  desde: string; // "YYYY-MM-DD"
  hasta: string; // "YYYY-MM-DD"
  minimo: number;
};

export type Discount = {
  noches: number;
  porcentaje: number;
};

export type PriceConfig = {
  base: number;
  minimoNoches: number;
  rangos: PriceRange[];
  minimos: MinimumStay[];
  descuentos: Discount[];
  propiedad: string;
};

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskCategory = {
    id: string;
    name: string;
};

export type ProviderCategory = {
    id: string;
    name: string;
};

export type ProviderManagementType = 'tasks' | 'liquidations';
export type ProviderBillingType = 'hourly' | 'per_visit' | 'hourly_or_visit' | 'other';


export type Provider = {
    id: string;
    name: string;
    categoryId?: string | null;
    email?: string | null;
    phone?: string | null;
    countryCode?: string | null;
    address?: string | null;
    notes?: string;
    rating?: number;
    // New fields
    managementType: ProviderManagementType;
    billingType?: ProviderBillingType | null;
    rateCurrency?: 'ARS' | 'USD' | null;
    hourlyRate?: number | null;
    perVisitRate?: number | null;
};

// New types for flexible task assignment
export type TaskScope = {
    id: string;
    name: string;
    color: string;
};

export type TaskAssignment = {
    type: 'property' | 'scope';
    id: string;
};

export type Task = {
    id: string;
    assignment?: TaskAssignment; // New flexible assignment
    propertyId?: string; // Legacy field for backwards compatibility
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    estimatedCost?: number;
    actualCost?: number;
    costCurrency?: 'ARS' | 'USD';
    dueDate?: string | null;
    categoryId?: string | null;
    notes?: string;
    providerId?: string | null;
};

export type TaskWithDetails = Task & {
    assignmentName: string;
    assignmentColor?: string;
    categoryName?: string;
    providerName?: string;
}

// LIQUIDATIONS MODULE
export type WorkLog = {
    id: string;
    providerId: string;
    assignment: TaskAssignment;
    date: string;
    activityType: 'hourly' | 'per_visit';
    quantity: number;
    description: string;
    costCurrency: 'ARS' | 'USD';
    calculatedCost: number;
    status: 'pending_liquidation' | 'liquidated';
    liquidationId?: string;
}

export type ManualAdjustment = {
    id: string;
    providerId: string;
    assignment: TaskAssignment;
    date: string;
    amount: number; // Can be negative for deductions
    currency: 'ARS' | 'USD';
    description: string;
    status: 'pending_liquidation' | 'liquidated';
    liquidationId?: string;
}

export type Liquidation = {
    id: string;
    providerId: string;
    dateGenerated: string;
    totalAmount: number;
    currency: 'ARS' | 'USD';
    status: 'pending_payment' | 'partially_paid' | 'paid';
    amountPaid: number;
    balance: number;
}


// --- DATA ACCESS FUNCTIONS ---

const propertiesCollection = collection(db, 'properties');
const tenantsCollection = collection(db, 'tenants');
const bookingsCollection = collection(db, 'bookings');
const expensesCollection = collection(db, 'expenses');
const paymentsCollection = collection(db, 'payments');
const expenseCategoriesCollection = collection(db, 'expenseCategories');
const emailTemplatesCollection = collection(db, 'emailTemplates');
const settingsCollection = collection(db, 'settings');
const originsCollection = collection(db, 'origins');
const pushSubscriptionsCollection = collection(db, 'pushSubscriptions');
const tasksCollection = collection(db, 'tasks');
const taskCategoriesCollection = collection(db, 'taskCategories');
const providersCollection = collection(db, 'providers');
const providerCategoriesCollection = collection(db, 'providerCategories');
const taskScopesCollection = collection(db, 'taskScopes');
const dateBlocksCollection = collection(db, 'dateBlocks');
const workLogsCollection = collection(db, 'workLogs');
const manualAdjustmentsCollection = collection(db, 'manualAdjustments');
const liquidationsCollection = collection(db, 'liquidations');


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

    const propertyRef = doc(db, 'properties', propertyId);
    batch.delete(propertyRef);

    const bookingsQuery = query(bookingsCollection, where('propertyId', '==', propertyId));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    const bookingIds = bookingsSnapshot.docs.map(d => d.id);

    if (bookingIds.length > 0) {
        const paymentsQuery = query(paymentsCollection, where('bookingId', 'in', bookingIds));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));
    }

    bookingsSnapshot.forEach(doc => batch.delete(doc.ref));

    const expensesQuery = query(expensesCollection, where('assignment.type', '==', 'property'), where('assignment.id', '==', propertyId));
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.forEach(doc => batch.delete(doc.ref));
    
    const tasksQuery = query(tasksCollection, where('assignment.id', '==', propertyId), where('assignment.type', '==', 'property'));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));

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

export async function getBookingWithDetails(id: string): Promise<BookingWithDetails | undefined> {
    const booking = await getBookingById(id);
    if (!booking) return undefined;
    return getBookingDetails(booking);
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
    
    await batch.commit();
    return true;
}

export async function getPaymentsByBookingId(bookingId: string): Promise<Payment[]> {
    const q = query(paymentsCollection, where('bookingId', '==', bookingId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    // Reverse the array to get ascending order for display
    return (snapshot.docs.map(processDoc) as Payment[]).reverse();
}

export async function getAllPaymentsWithDetails(): Promise<PaymentWithDetails[]> {
    const q = query(paymentsCollection, orderBy("date", "desc"));
    const paymentsSnapshot = await getDocs(q);
    const payments = paymentsSnapshot.docs.map(processDoc) as Payment[];

    // This can be slow if there are many payments. Consider optimizing if needed.
    const paymentDetails = await Promise.all(payments.map(async (payment) => {
        const booking = await getBookingById(payment.bookingId);
        if (!booking) return { ...payment };
        
        const tenant = await getTenantById(booking.tenantId);
        const property = await getPropertyById(booking.propertyId);
        
        return {
            ...payment,
            propertyId: property?.id,
            propertyName: property?.name,
            tenantId: tenant?.id,
            tenantName: tenant?.name
        };
    }));

    return paymentDetails;
}


export async function addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const docRef = await addDoc(paymentsCollection, payment);
    return { id: docRef.id, ...payment };
}

export async function updatePayment(updatedPayment: Payment): Promise<Payment> {
    const { id, ...data } = updatedPayment;
    const docRef = doc(db, 'payments', id);
    await updateDoc(docRef, data);
    return updatedPayment;
}

export async function deletePayment(id: string): Promise<void> {
    const docRef = doc(db, 'payments', id);
    await deleteDoc(docRef);
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

export async function getExpensesByAssignmentId(assignmentId: string): Promise<ExpenseWithDetails[]> {
    const q = query(expensesCollection, where('assignment.id', '==', assignmentId));
    const snapshot = await getDocs(q);
    const expenses = snapshot.docs.map(processDoc) as Expense[];
    const enrichedExpenses = await enrichExpenses(expenses);
    return enrichedExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const docRef = await addDoc(expensesCollection, expense);
    return { id: docRef.id, ...expense, currency: 'ARS' };
}

export async function updateExpense(updatedExpense: Expense): Promise<Expense> {
    const { id, ...data } = updatedExpense;
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, data);
    return updatedExpense;
}

export async function deleteExpense(id: string): Promise<void> {
    const docRef = doc(db, 'expenses', id);
    await deleteDoc(docRef);
}


async function enrichExpenses(expenses: Expense[]): Promise<ExpenseWithDetails[]> {
    const [properties, scopes, categories, providers] = await Promise.all([
        getProperties(),
        getTaskScopes(),
        getExpenseCategories(),
        getProviders(),
    ]);

    const propertiesMap = new Map(properties.map(p => [p.id, p.name]));
    const scopesMap = new Map(scopes.map(s => [s.id, { name: s.name, color: s.color }]));
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));
    const providersMap = new Map(providers.map(p => [p.id, p.name]));

    const detailedExpenses = expenses.map(expense => {
        let assignmentName = 'N/A';
        let assignmentColor: string | undefined;

        if (expense.assignment) {
            if (expense.assignment.type === 'property') {
                assignmentName = propertiesMap.get(expense.assignment.id) || 'Propiedad Desconocida';
            } else if (expense.assignment.type === 'scope') {
                const scope = scopesMap.get(expense.assignment.id);
                assignmentName = scope?.name || 'Ámbito Desconocido';
                assignmentColor = scope?.color;
            }
        }

        return {
            ...expense,
            amountARS: expense.amount,
            amountUSD: expense.originalUsdAmount || (expense.exchangeRate ? expense.amount / expense.exchangeRate : 0),
            assignmentName,
            assignmentColor,
            categoryName: expense.categoryId ? categoriesMap.get(expense.categoryId) : undefined,
            providerName: expense.providerId ? providersMap.get(expense.providerId) : undefined,
        };
    });

    return detailedExpenses;
}


export async function getAllExpensesUnified(): Promise<ExpenseWithDetails[]> {
    const q = query(expensesCollection, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const allExpenses = snapshot.docs.map(processDoc) as Expense[];
    return await enrichExpenses(allExpenses);
}


// --- FINANCIAL SUMMARY ---

export async function getFinancialSummaryByProperty(options?: { startDate?: string; endDate?: string }): Promise<FinancialSummaryByCurrency> {
    const [properties, bookings, allExpenses, payments] = await Promise.all([
        getProperties(),
        getDocs(bookingsCollection).then(snap => snap.docs.map(processDoc) as Booking[]),
        getDocs(expensesCollection).then(snap => snap.docs.map(processDoc) as Expense[]),
        getDocs(paymentsCollection).then(snap => snap.docs.map(processDoc) as Payment[])
    ]);
    
    const startDate = options?.startDate;
    const endDate = options?.endDate;

    const fromDate = startDate ? new Date(startDate.replace(/-/g, '/')) : null;
    if (fromDate) fromDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day
    
    const toDate = endDate ? new Date(endDate.replace(/-/g, '/')) : null;
    if (toDate) toDate.setUTCHours(23, 59, 59, 999); // Normalize to end of day

    const isWithinDateRange = (dateStr: string) => {
        if (!dateStr || (!fromDate && !toDate)) return true;
        const itemDate = new Date(dateStr.replace(/-/g, '/'));
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
    };

    const bookingsWithPaymentDate = bookings.filter(b => {
        const firstPaymentForBooking = payments.find(p => p.bookingId === b.id);
        if(firstPaymentForBooking) return isWithinDateRange(firstPaymentForBooking.date);
        return isWithinDateRange(b.startDate); // Fallback to booking start date if no payment
    });

    const activeBookings = bookingsWithPaymentDate.filter(b => b.status === 'active');
    
    const summaryByProperty: { [key: string]: FinancialSummary } = {};
    const summaryByPropertyArs: { [key: string]: FinancialSummary } = {};
    const bookingsMap = new Map(bookings.map(b => [b.id, b]));


    const initializeSummary = (propertyId: string, propertyName: string) => ({
        propertyId,
        propertyName,
        totalIncome: 0,
        totalPayments: 0,
        balance: 0,
        totalPropertyExpenses: 0,
        totalBookingExpenses: 0, // This will now be 0, as expenses are tied to properties/scopes
        netResult: 0
    });

    properties.forEach(p => {
        summaryByProperty[p.id] = initializeSummary(p.id, p.name);
        summaryByPropertyArs[p.id] = initializeSummary(p.id, p.name);
    });

    activeBookings.forEach(booking => {
        const propId = booking.propertyId;
        if (booking.currency === 'USD') {
            if (summaryByProperty[propId]) {
                summaryByProperty[propId].totalIncome += booking.amount;
            }
        } else { // ARS
            if (summaryByPropertyArs[propId]) {
                summaryByPropertyArs[propId].totalIncome += booking.amount;
            }
        }
    });

    payments.filter(p => isWithinDateRange(p.date)).forEach(payment => {
        const booking = bookingsMap.get(payment.bookingId);
        if (booking) {
            const propId = booking.propertyId;
            if (booking.currency === 'USD') {
                if (summaryByProperty[propId]) {
                    summaryByProperty[propId].totalPayments += payment.amount;
                }
            } else { // ARS
                 if (summaryByPropertyArs[propId]) {
                     summaryByPropertyArs[propId].totalPayments += payment.originalArsAmount || 0;
                 }
            }
        }
    });
    
    allExpenses.filter(e => isWithinDateRange(e.date)).forEach(expense => {
        if (expense.assignment.type === 'property') {
            const propId = expense.assignment.id;
            if (summaryByProperty[propId]) {
                summaryByProperty[propId].totalPropertyExpenses += expense.originalUsdAmount || (expense.exchangeRate ? expense.amount / expense.exchangeRate : 0);
            }
             if (summaryByPropertyArs[propId]) {
                summaryByPropertyArs[propId].totalPropertyExpenses += expense.amount;
            }
        }
    });
    
    Object.values(summaryByProperty).forEach(summary => {
        summary.balance = summary.totalIncome - summary.totalPayments;
        summary.netResult = summary.totalIncome - (summary.totalPropertyExpenses + summary.totalBookingExpenses);
    });

    Object.values(summaryByPropertyArs).forEach(summary => {
        summary.balance = summary.totalIncome - summary.totalPayments;
        summary.netResult = summary.totalIncome - (summary.totalPropertyExpenses + summary.totalBookingExpenses);
    });

    return {
        ars: Object.values(summaryByPropertyArs),
        usd: Object.values(summaryByProperty)
    };
}


// --- EMAIL TEMPLATES ---
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const q = query(emailTemplatesCollection, orderBy("name"));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
      await initializeDefaultData();
      const newSnapshot = await getDocs(q);
      return newSnapshot.docs.map(processDoc) as EmailTemplate[];
  }

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


// --- SETTINGS ---
export async function getSetting<T>(settingId: 'email' | 'alerts'): Promise<T | null> {
    const docRef = doc(db, 'settings', settingId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    }
    // Provide default values if settings don't exist
    if (settingId === 'alerts') {
        return { id: 'alerts', checkInDays: 7, checkOutDays: 3 } as T;
    }
    return null;
}

export async function getEmailSettings(): Promise<EmailSettings | null> {
    return getSetting<'email' | any>('email');
}

export async function updateEmailSettings(settings: Omit<EmailSettings, 'id'>): Promise<void> {
    const docRef = doc(db, 'settings', 'email');
    await setDoc(docRef, settings, { merge: true });
}

export async function getAlertSettings(): Promise<AlertSettings | null> {
    return getSetting<'alerts' | any>('alerts');
}

export async function updateAlertSettings(settings: Omit<AlertSettings, 'id'>): Promise<void> {
    const docRef = doc(db, 'settings', 'alerts');
    await setDoc(docRef, settings, { merge: true });
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
    const allExpenses = await getAllExpensesUnified();
    const categories = await getExpenseCategories();
    
    const startDate = options?.startDate;
    const endDate = options?.endDate;
    const fromDate = startDate ? new Date(startDate.replace(/-/g, '/')) : null;
    if (fromDate) fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = endDate ? new Date(endDate.replace(/-/g, '/')) : null;
    if (toDate) toDate.setUTCHours(23, 59, 59, 999);

    const isWithinDateRange = (dateStr: string) => {
        if (!dateStr || (!fromDate && !toDate)) return true;
        const itemDate = new Date(dateStr.replace(/-/g, '/'));
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
    
    const startDate = options?.startDate;
    const endDate = options?.endDate;
    const fromDate = startDate ? new Date(startDate.replace(/-/g, '/')) : null;
    if (fromDate) fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = endDate ? new Date(endDate.replace(/-/g, '/')) : null;
    if (toDate) toDate.setUTCHours(23, 59, 59, 999);

    const isWithinDateRange = (dateStr: string) => {
        if (!dateStr || (!fromDate && !toDate)) return true;
        const itemDate = new Date(dateStr.replace(/-/g, '/'));
        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
    };

    const filteredExpenses = allExpenses.filter(e => isWithinDateRange(e.date) && e.assignment.type === 'property');
    if (filteredExpenses.length === 0) return [];

    const summaryMap = new Map<string, number>();

    filteredExpenses.forEach(expense => {
        const propertyName = expense.assignmentName;
        const currentTotal = summaryMap.get(propertyName) || 0;
        summaryMap.set(propertyName, currentTotal + expense.amountUSD);
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


// --- PUSH NOTIFICATIONS ---

export async function savePushSubscription(subscription: any, safeId: string): Promise<void> {
    const subData: PushSubscription = {
        id: safeId,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        },
    };
    const docRef = doc(db, 'pushSubscriptions', safeId);
    await setDoc(docRef, subData, { merge: true });
}

export async function getPushSubscriptions(): Promise<PushSubscription[]> {
    const snapshot = await getDocs(pushSubscriptionsCollection);
    return snapshot.docs.map(processDoc) as PushSubscription[];
}

export async function deletePushSubscription(id: string): Promise<void> {
    const docRef = doc(db, 'pushSubscriptions', id);
    await deleteDoc(docRef);
}

// --- TASK MANAGEMENT ---

export async function getTaskCategories(): Promise<TaskCategory[]> {
    const q = query(taskCategoriesCollection, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as TaskCategory[];
}

export async function addTaskCategory(category: Omit<TaskCategory, 'id'>): Promise<TaskCategory> {
    const docRef = await addDoc(taskCategoriesCollection, category);
    return { id: docRef.id, ...category };
}

export async function updateTaskCategory(updatedCategory: TaskCategory): Promise<TaskCategory> {
    const { id, ...data } = updatedCategory;
    const docRef = doc(db, 'taskCategories', id);
    await updateDoc(docRef, data);
    return updatedCategory;
}

export async function deleteTaskCategory(id: string): Promise<void> {
    const docRef = doc(db, 'taskCategories', id);
    await deleteDoc(docRef);
}

// Task Scopes
export async function getTaskScopes(): Promise<TaskScope[]> {
    const q = query(taskScopesCollection, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as TaskScope[];
}

export async function addTaskScope(scope: Omit<TaskScope, 'id'>): Promise<TaskScope> {
    const docRef = await addDoc(taskScopesCollection, scope);
    return { id: docRef.id, ...scope };
}

export async function updateTaskScope(updatedScope: TaskScope): Promise<TaskScope> {
    const { id, ...data } = updatedScope;
    const docRef = doc(db, 'taskScopes', id);
    await updateDoc(docRef, data);
    return updatedScope;
}

export async function deleteTaskScope(id: string): Promise<void> {
    const docRef = doc(db, 'taskScopes', id);
    await deleteDoc(docRef);
}


async function getTaskDetails(task: Task, propertiesMap: Map<string, Property>, scopesMap: Map<string, TaskScope>, categoriesMap: Map<string, string>, providersMap: Map<string, string>): Promise<TaskWithDetails> {
    // Re-calculate actualCost on the fly by summing related expenses
    const expensesQuery = query(expensesCollection, where('taskId', '==', task.id));
    const expensesSnapshot = await getDocs(expensesQuery);
    const actualCost = expensesSnapshot.docs.reduce((sum, doc) => {
        const expense = doc.data() as Expense;
        // Sum based on the task's currency
        if (task.costCurrency === 'USD') {
            return sum + (expense.originalUsdAmount || (expense.exchangeRate ? expense.amount / expense.exchangeRate : 0));
        }
        return sum + expense.amount; // Default to ARS
    }, 0);

    let assignmentName = 'Sin Asignar';
    let assignmentColor: string | undefined = undefined;
    let finalAssignment = task.assignment;

    // Compatibility for old tasks that only have propertyId
    if (!finalAssignment && task.propertyId) {
        finalAssignment = {
            type: 'property',
            id: task.propertyId,
        };
    }

    if (finalAssignment) {
        if (finalAssignment.type === 'property') {
            assignmentName = propertiesMap.get(finalAssignment.id)?.name || 'Propiedad Desconocida';
        } else if (finalAssignment.type === 'scope') {
            const scope = scopesMap.get(finalAssignment.id);
            assignmentName = scope?.name || 'Ámbito Desconocido';
            assignmentColor = scope?.color;
        }
    }
    
    const detailedTask: TaskWithDetails = {
        ...task,
        assignment: finalAssignment, // Ensure the normalized assignment is on the object
        actualCost: actualCost,
        assignmentName,
        assignmentColor,
        categoryName: task.categoryId ? categoriesMap.get(task.categoryId) : undefined,
        providerName: task.providerId ? providersMap.get(task.providerId) : undefined,
    };
    
    // Clean up legacy field if it exists
    delete (detailedTask as any).propertyId;

    return detailedTask;
}

export async function getTasks(): Promise<TaskWithDetails[]> {
    const [tasksSnap, properties, scopes, categories, providers] = await Promise.all([
        getDocs(tasksCollection),
        getProperties(),
        getTaskScopes(),
        getTaskCategories(),
        getProviders(),
    ]);

    const propertiesMap = new Map(properties.map(p => [p.id, p]));
    const scopesMap = new Map(scopes.map(s => [s.id, s]));
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));
    const providersMap = new Map(providers.map(p => [p.id, p.name]));
    
    const allTasks = tasksSnap.docs.map(processDoc) as Task[];
    const detailedTasks = await Promise.all(allTasks.map(task => getTaskDetails(task, propertiesMap, scopesMap, categoriesMap, providersMap)));

    return detailedTasks;
}

export async function getTasksByPropertyId(propertyId: string): Promise<TaskWithDetails[]> {
    const [properties, scopes, categories, providers] = await Promise.all([
        getProperties(),
        getTaskScopes(),
        getTaskCategories(),
        getProviders(),
    ]);
    const propertiesMap = new Map(properties.map(p => [p.id, p]));
    const scopesMap = new Map(scopes.map(s => [s.id, s]));
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));
    const providersMap = new Map(providers.map(p => [p.id, p.name]));

    const q = query(tasksCollection, where('assignment.id', '==', propertyId));
    const snapshot = await getDocs(q);
    const propertyTasks = snapshot.docs.map(processDoc).filter(t => t.assignment?.type === 'property') as Task[];
    
    const detailedTasks = await Promise.all(propertyTasks.map(task => getTaskDetails(task, propertiesMap, scopesMap, categoriesMap, providersMap)));
    return detailedTasks;
}

export async function getTasksByProviderId(providerId: string): Promise<TaskWithDetails[]> {
    const [properties, scopes, categories, providers] = await Promise.all([
        getProperties(),
        getTaskScopes(),
        getTaskCategories(),
        getProviders(),
    ]);
    const propertiesMap = new Map(properties.map(p => [p.id, p]));
    const scopesMap = new Map(scopes.map(s => [s.id, s]));
    const categoriesMap = new Map(categories.map(c => [c.id, c.name]));
    const providersMap = new Map(providers.map(p => [p.id, p.name]));

    const q = query(tasksCollection, where('providerId', '==', providerId));
    const snapshot = await getDocs(q);
    const providerTasks = snapshot.docs.map(processDoc) as Task[];
    
    const detailedTasks = await Promise.all(providerTasks.map(task => getTaskDetails(task, propertiesMap, scopesMap, categoriesMap, providersMap)));
    
    // Sort manually to avoid needing a composite index
    detailedTasks.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateB - dateA;
    });

    return detailedTasks;
}


export async function addTask(task: Omit<Task, 'id'>): Promise<Task> {
    const docRef = await addDoc(tasksCollection, task);
    return { id: docRef.id, ...task };
}

export async function updateTask(updatedTask: Partial<Task>): Promise<Task | null> {
    const { id, ...data } = updatedTask;
    if (!id) throw new Error("Update task requires an ID.");
    const docRef = doc(db, 'tasks', id);
    await updateDoc(docRef, data);
    const newDoc = await getDoc(docRef);
    return newDoc.exists() ? processDoc(newDoc) as Task : null;
}

export async function reassignTaskExpenses(taskId: string, newAssignment: TaskAssignment): Promise<void> {
    if (!taskId || !newAssignment) {
        throw new Error("Task ID and new assignment are required.");
    }
    const expensesQuery = query(expensesCollection, where('taskId', '==', taskId));
    const expensesSnapshot = await getDocs(expensesQuery);
    
    if (expensesSnapshot.empty) {
        return; // No expenses to move
    }

    const batch = writeBatch(db);
    expensesSnapshot.forEach(expenseDoc => {
        const expenseRef = doc(db, 'expenses', expenseDoc.id);
        batch.update(expenseRef, { assignment: newAssignment });
    });
    
    await batch.commit();
}


export async function deleteTask(id: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete the task
    const taskRef = doc(db, 'tasks', id);
    batch.delete(taskRef);

    // Delete associated expenses
    const expensesQuery = query(expensesCollection, where('taskId', '==', id));
    const expensesSnapshot = await getDocs(expensesQuery);
    expensesSnapshot.forEach(expenseDoc => {
        batch.delete(doc(db, 'expenses', expenseDoc.id));
    });

    await batch.commit();
}


// --- PROVIDER CATEGORIES ---
export async function getProviderCategories(): Promise<ProviderCategory[]> {
    const q = query(providerCategoriesCollection, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as ProviderCategory[];
}

export async function addProviderCategory(category: Omit<ProviderCategory, 'id'>): Promise<ProviderCategory> {
    const docRef = await addDoc(providerCategoriesCollection, category);
    return { id: docRef.id, ...category };
}

export async function updateProviderCategory(updatedCategory: ProviderCategory): Promise<ProviderCategory> {
    const { id, ...data } = updatedCategory;
    const docRef = doc(db, 'providerCategories', id);
    await updateDoc(docRef, data);
    return updatedCategory;
}

export async function deleteProviderCategory(id: string): Promise<void> {
    const docRef = doc(db, 'providerCategories', id);
    await deleteDoc(docRef);
}


// --- PROVIDER FUNCTIONS ---

export async function getProviders(): Promise<Provider[]> {
    const q = query(providersCollection, orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as Provider[];
}

export async function getProviderById(id: string): Promise<Provider | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'providers', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc(docSnap) as Provider : undefined;
}


export async function addProvider(provider: Omit<Provider, 'id'>): Promise<Provider> {
    const docRef = await addDoc(providersCollection, provider);
    return { id: docRef.id, ...provider };
}

export async function updateProvider(updatedProvider: Partial<Provider>): Promise<Provider | null> {
    const { id, ...data } = updatedProvider;
    if (!id) throw new Error("Update provider requires an ID.");
    const docRef = doc(db, 'providers', id);
    await updateDoc(docRef, data);
    const newDoc = await getDoc(docRef);
    return newDoc.exists() ? processDoc(newDoc) as Provider : null;
}

export async function deleteProvider(id: string): Promise<void> {
    // Note: This does not handle unlinking from tasks.
    // That logic should be in the server action if needed.
    const docRef = doc(db, 'providers', id);
    await deleteDoc(docRef);
}

export async function updateTenantPartial(id: string, data: Partial<Omit<Tenant, 'id'>>): Promise<void> {
    if (!id) throw new Error("Update tenant requires an ID.");
    const docRef = doc(db, 'tenants', id);
    await updateDoc(docRef, data);
}

export async function updateProviderPartial(id: string, data: Partial<Omit<Provider, 'id'>>): Promise<void> {
    if (!id) throw new Error("Update provider requires an ID.");
    const docRef = doc(db, 'providers', id);
    await updateDoc(docRef, data);
}

// --- DATE BLOCKS ---

export async function getDateBlocks(): Promise<DateBlock[]> {
  const snapshot = await getDocs(dateBlocksCollection);
  return snapshot.docs.map(processDoc) as DateBlock[];
}

export async function getDateBlocksByPropertyId(propertyId: string): Promise<DateBlock[]> {
  const q = query(dateBlocksCollection, where('propertyId', '==', propertyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(processDoc) as DateBlock[];
}

export async function addDateBlockDb(block: Omit<DateBlock, 'id'>): Promise<DateBlock> {
  const docRef = await addDoc(dateBlocksCollection, block);
  return { id: docRef.id, ...block };
}

export async function updateDateBlockDb(block: DateBlock): Promise<DateBlock> {
  const { id, ...data } = block;
  const docRef = doc(db, 'dateBlocks', id);
  await updateDoc(docRef, data);
  return block;
}

export async function deleteDateBlockDb(id: string): Promise<void> {
  const docRef = doc(db, 'dateBlocks', id);
  await deleteDoc(docRef);
}

// --- LIQUIDATIONS ---

export async function getPendingWorkLogs(providerId: string): Promise<WorkLog[]> {
    const q = query(workLogsCollection, where('providerId', '==', providerId), where('status', '==', 'pending_liquidation'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as WorkLog[];
}

export async function getPendingManualAdjustments(providerId: string): Promise<ManualAdjustment[]> {
    const q = query(manualAdjustmentsCollection, where('providerId', '==', providerId), where('status', '==', 'pending_liquidation'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(processDoc) as ManualAdjustment[];
}

export async function addWorkLogDb(workLog: Omit<WorkLog, 'id' | 'calculatedCost' | 'status' | 'costCurrency'>): Promise<WorkLog> {
    const provider = await getProviderById(workLog.providerId);
    if (!provider) throw new Error("Proveedor no encontrado.");

    let calculatedCost = 0;
    const costCurrency = provider.rateCurrency || 'ARS';

    if (workLog.activityType === 'hourly') {
        calculatedCost = workLog.quantity * (provider.hourlyRate || 0);
    } else { // per_visit
        calculatedCost = workLog.quantity * (provider.perVisitRate || 0);
    }

    const newLog: Omit<WorkLog, 'id'> = {
        ...workLog,
        costCurrency,
        calculatedCost,
        status: 'pending_liquidation'
    }

    const docRef = await addDoc(workLogsCollection, newLog);
    return { id: docRef.id, ...newLog };
}

export async function addManualAdjustmentDb(adjustment: Omit<ManualAdjustment, 'id' | 'status'>): Promise<ManualAdjustment> {
    const newAdjustment: Omit<ManualAdjustment, 'id'> = {
        ...adjustment,
        status: 'pending_liquidation'
    };
    const docRef = await addDoc(manualAdjustmentsCollection, newAdjustment);
    return { id: docRef.id, ...newAdjustment };
}

export async function getLiquidationById(id: string): Promise<Liquidation | undefined> {
    const docRef = doc(db, 'liquidations', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? processDoc(docSnap) as Liquidation : undefined;
}
