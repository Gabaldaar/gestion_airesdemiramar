
'use server';

import { db } from './firebase';
import { 
    collection, 
    getDocs, 
    getDoc, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    writeBatch,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot,
} from "firebase/firestore";
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

// --- Type Definitions ---

export interface Property {
    id: string;
    name: string;
    address: string;
    imageUrl?: string;
    googleCalendarId?: string;
    notes?: string;
    contractTemplate?: string;
}

export interface Tenant {
    id: string;
    name: string;
    dni?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    notes?: string;
    imageUrl?: string;
}

export interface Booking {
    id: string;
    propertyId: string;
    tenantId: string;
    startDate: string; // ISO 8601 format
    endDate: string; // ISO 8601 format
    amount: number;
    currency: 'USD' | 'ARS';
    status: 'pending' | 'confirmed' | 'cancelled';
    contractStatus: 'pending' | 'sent' | 'signed' | 'not_applicable';
    googleEventId?: string;
}

export interface BookingWithDetails extends Booking {
    property?: Property;
    tenant?: Tenant;
    payments: Payment[];
    balance: number;
}

export interface Payment {
    id: string;
    bookingId: string;
    date: string; // ISO 8601 format
    amount: number;
    currency: 'USD' | 'ARS';
    usdToArsRate?: number;
    description?: string;
}

export interface PaymentWithDetails extends Payment {
    booking?: Booking & { property?: Property, tenant?: Tenant };
}

export interface ExpenseCategory {
    id: string;
    name: string;
    description?: string;
}

export interface PropertyExpense {
    id: string;
    propertyId: string;
    categoryId: string;
    date: string; // ISO 8601 format
    amount: number;
    currency: 'USD' | 'ARS';
    description: string;
}

export interface GeneralExpense {
    id: string;
    categoryId: string;
    date: string; // ISO 8601 format
    amount: number;
    currency: 'USD' | 'ARS';
    description: string;
}

export type UnifiedExpense = (PropertyExpense | GeneralExpense) & { 
    type: 'property' | 'general';
    category?: ExpenseCategory;
    property?: Property;
};


export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
}

export interface EmailSettings {
    id: string; // Should be a singleton document, e.g., 'default'
    senderName?: string;
    senderEmail?: string;
}

export interface FinancialSummary {
    propertyId: string;
    propertyName: string;
    totalIncome: number;
    totalExpenses: number;
    netResult: number;
}

export interface FinancialSummaryByCurrency {
    ars: FinancialSummary[];
    usd: FinancialSummary[];
}


// --- Helper Functions ---

function snapshotToDoc<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
    const data = snapshot.data();
    // Convert Firestore Timestamps to ISO strings for serializability
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { ...data, id: snapshot.id } as T;
}

// --- Generic Firestore Functions ---

async function getCollection<T>(collectionName: string): Promise<T[]> {
    try {
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.docs.map(doc => snapshotToDoc<T>(doc));
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        throw new Error(`Could not fetch ${collectionName}.`);
    }
}

async function getDocumentById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return snapshotToDoc<T>(docSnap as QueryDocumentSnapshot<DocumentData>);
        }
        return null;
    } catch (error) {
        console.error(`Error fetching document ${id} from ${collectionName}:`, error);
        throw new Error(`Could not fetch document from ${collectionName}.`);
    }
}

async function addDocument<T extends object>(collectionName: string, data: T, googleCalendarEvent?: any): Promise<T> {
    try {
        if ('googleCalendarId' in data && (data as any).googleCalendarId && googleCalendarEvent) {
             const event = await createGoogleCalendarEvent((data as any).googleCalendarId, googleCalendarEvent);
             (data as any).googleEventId = event.id;
        }

        const docRef = await addDoc(collection(db, collectionName), data);
        return { ...data, id: docRef.id };
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw new Error(`Could not add document to ${collectionName}.`);
    }
}

async function updateDocument<T extends object>(collectionName: string, id: string, data: Partial<T>, googleCalendarEvent?: any): Promise<void> {
    try {
        const docRef = doc(db, collectionName, id);

         if ('googleCalendarId' in data && (data as any).googleCalendarId && (data as any).googleEventId && googleCalendarEvent) {
            await updateGoogleCalendarEvent((data as any).googleCalendarId, (data as any).googleEventId, googleCalendarEvent);
        }

        await updateDoc(docRef, data);
    } catch (error) {
        console.error(`Error updating document ${id} in ${collectionName}:`, error);
        throw new Error(`Could not update document in ${collectionName}.`);
    }
}

async function deleteDocument(collectionName: string, id: string, calendarInfo?: { calendarId: string, eventId: string }): Promise<void> {
    try {
        if (calendarInfo && calendarInfo.calendarId && calendarInfo.eventId) {
            await deleteGoogleCalendarEvent(calendarInfo.calendarId, calendarInfo.eventId);
        }

        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error(`Error deleting document ${id} from ${collectionName}:`, error);
        throw new Error(`Could not delete document from ${collectionName}.`);
    }
}

// --- Google Calendar Integration ---

async function getGoogleAuth() {
    const auth = new GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    return auth;
}


async function createGoogleCalendarEvent(calendarId: string, event: any) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn("Google Calendar credentials not set. Skipping event creation.");
        return;
    }
    const auth = await getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    try {
        const createdEvent = await calendar.events.insert({
            calendarId: calendarId,
            requestBody: event,
        });
        return createdEvent.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        // Don't rethrow, as calendar failure shouldn't block app functionality
    }
}

async function updateGoogleCalendarEvent(calendarId: string, eventId: string, event: any) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn("Google Calendar credentials not set. Skipping event update.");
        return;
    }
    const auth = await getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    try {
        await calendar.events.update({
            calendarId: calendarId,
            eventId: eventId,
            requestBody: event,
        });
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
    }
}

async function deleteGoogleCalendarEvent(calendarId: string, eventId: string) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn("Google Calendar credentials not set. Skipping event deletion.");
        return;
    }
    const auth = await getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    try {
        await calendar.events.delete({
            calendarId: calendarId,
            eventId: eventId,
        });
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
    }
}


function createEventFromBooking(booking: BookingWithDetails) {
     if (!booking.tenant || !booking.property) return null;

    const summary = `${booking.tenant.name} (${booking.property.name})`;
    const description = `Inquilino: ${booking.tenant.name}\nMonto: ${booking.currency} ${booking.amount}`;

    return {
        summary: summary,
        description: description,
        start: {
            dateTime: new Date(booking.startDate).toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
        },
        end: {
            dateTime: new Date(booking.endDate).toISOString(),
            timeZone: 'America/Argentina/Buenos_Aires',
        },
    };
}


// --- Properties ---
export const getProperties = async () => getCollection<Property>('properties');
export const getPropertyById = async (id: string) => getDocumentById<Property>('properties', id);
export const addProperty = async (data: Omit<Property, 'id'>) => addDocument('properties', data);
export const updateProperty = async (id: string, data: Partial<Property>) => updateDocument('properties', id, data);
export const deleteProperty = async (id: string) => deleteDocument('properties', id);

// --- Tenants ---
export const getTenants = async () => getCollection<Tenant>('tenants');
export const getTenantById = async (id: string) => getDocumentById<Tenant>('tenants', id);
export const addTenant = async (data: Omit<Tenant, 'id'>) => addDocument('tenants', data);
export const updateTenant = async (id: string, data: Partial<Tenant>) => updateDocument('tenants', id, data);
export const deleteTenant = async (id: string) => deleteDocument('tenants', id);

// --- Bookings ---
export const getBookings = async () => {
    const bookings = await getCollection<Booking>('bookings');
    const [properties, tenants, payments] = await Promise.all([
        getProperties(),
        getTenants(),
        getPayments(),
    ]);
    
    const propertiesMap = new Map(properties.map(p => [p.id, p]));
    const tenantsMap = new Map(tenants.map(t => [t.id, t]));
    
    return bookings.map(b => {
        const bookingPayments = payments.filter(p => p.bookingId === b.id);
        const totalPaid = bookingPayments.reduce((sum, p) => sum + (p.currency === b.currency ? p.amount : (p.amount / (p.usdToArsRate || 1))), 0);
        const balance = b.amount - totalPaid;

        return {
        ...b,
        property: propertiesMap.get(b.propertyId),
        tenant: tenantsMap.get(b.tenantId),
        payments: bookingPayments,
        balance,
    }});
};

export const getBookingsByPropertyId = async (propertyId: string): Promise<BookingWithDetails[]> => {
    const q = query(collection(db, "bookings"), where("propertyId", "==", propertyId));
    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(doc => snapshotToDoc<Booking>(doc));
    
    const [properties, tenants, payments] = await Promise.all([
        getProperties(),
        getTenants(),
        getPayments(),
    ]);

    const propertiesMap = new Map(properties.map(p => [p.id, p]));
    const tenantsMap = new Map(tenants.map(t => [t.id, t]));

    return bookings.map(b => {
        const bookingPayments = payments.filter(p => p.bookingId === b.id);
        const totalPaid = bookingPayments.reduce((sum, p) => {
             if (b.currency === p.currency) {
                return sum + p.amount;
            }
            // Conversion logic (can be improved)
            if (b.currency === 'USD' && p.currency === 'ARS' && p.usdToArsRate) {
                return sum + (p.amount / p.usdToArsRate);
            }
             if (b.currency === 'ARS' && p.currency === 'USD' && p.usdToArsRate) {
                return sum + (p.amount * p.usdToArsRate);
            }
            return sum;
        }, 0);

        const balance = b.amount - totalPaid;

        return {
            ...b,
            property: propertiesMap.get(b.propertyId),
            tenant: tenantsMap.get(b.tenantId),
            payments: bookingPayments,
            balance,
        };
    });
};

export const getBookingWithDetails = async (bookingId: string): Promise<BookingWithDetails | null> => {
    const booking = await getDocumentById<Booking>('bookings', bookingId);
    if (!booking) return null;

    const [property, tenant, payments] = await Promise.all([
        getPropertyById(booking.propertyId),
        getTenantById(booking.tenantId),
        getPaymentsForBooking(bookingId),
    ]);
    
     const totalPaid = payments.reduce((sum, p) => {
         if (booking.currency === p.currency) {
            return sum + p.amount;
        }
        if (booking.currency === 'USD' && p.currency === 'ARS' && p.usdToArsRate) {
            return sum + (p.amount / p.usdToArsRate);
        }
         if (booking.currency === 'ARS' && p.currency === 'USD' && p.usdToArsRate) {
            return sum + (p.amount * p.usdToArsRate);
        }
        return sum;
    }, 0);

    const balance = booking.amount - totalPaid;

    return {
        ...booking,
        property: property || undefined,
        tenant: tenant || undefined,
        payments,
        balance,
    };
};


export const addBooking = async (data: Omit<Booking, 'id'>) => {
    const property = await getPropertyById(data.propertyId);
    const tenant = await getTenantById(data.tenantId);

    if (!property || !tenant) {
        throw new Error('Property or Tenant not found');
    }

    const bookingDetailsForEvent = {
        ...data,
        id: '', // dummy id
        property,
        tenant,
        payments: [],
        balance: data.amount,
        status: data.status,
        contractStatus: data.contractStatus,
    };

    const event = property.googleCalendarId ? createEventFromBooking(bookingDetailsForEvent) : undefined;
    
    return addDocument('bookings', {
        ...data,
        ...(property.googleCalendarId && event ? { googleCalendarId: property.googleCalendarId } : {})
    }, event);
};

export const updateBooking = async (id: string, data: Partial<Booking>) => {
    const bookingToUpdate = await getBookingWithDetails(id);
    if (!bookingToUpdate) throw new Error('Booking not found');

    const updatedBookingData = { ...bookingToUpdate, ...data };
    
    const property = bookingToUpdate.property;
    if (!property) throw new Error('Property not found for booking');

    const event = property.googleCalendarId && bookingToUpdate.googleEventId ? createEventFromBooking(updatedBookingData) : undefined;
    
    const updateData = {
        ...data,
        ...(property.googleCalendarId && bookingToUpdate.googleEventId ? { googleCalendarId: property.googleCalendarId, googleEventId: bookingToUpdate.googleEventId } : {})
    };
    
    return updateDocument('bookings', id, updateData, event);
};

export const deleteBooking = async (id: string) => {
    const booking = await getBookingWithDetails(id);
    if (!booking) throw new Error('Booking not found');

    const batch = writeBatch(db);

    // Delete associated payments
    const paymentsSnapshot = await getDocs(query(collection(db, 'payments'), where('bookingId', '==', id)));
    paymentsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    // Delete the booking itself
    batch.delete(doc(db, 'bookings', id));

    // Commit batch
    await batch.commit();

     // Delete GCal event after DB operations are successful
    if (booking.property?.googleCalendarId && booking.googleEventId) {
        await deleteGoogleCalendarEvent(booking.property.googleCalendarId, booking.googleEventId);
    }
};

// --- Payments ---
export const getPayments = async () => getCollection<Payment>('payments');
export const getPaymentsForBooking = async (bookingId: string): Promise<Payment[]> => {
    const q = query(collection(db, "payments"), where("bookingId", "==", bookingId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => snapshotToDoc<Payment>(d));
}
export const addPayment = async (data: Omit<Payment, 'id'>) => addDocument('payments', data);
export const updatePayment = async (id: string, data: Partial<Payment>) => updateDocument('payments', id, data);
export const deletePayment = async (id: string) => deleteDocument('payments', id);


export const getAllPaymentsWithDetails = async (): Promise<PaymentWithDetails[]> => {
    const [payments, bookings] = await Promise.all([
        getPayments(),
        getBookings()
    ]);

    const bookingsMap = new Map(bookings.map(b => [b.id, b]));

    return payments.map(payment => ({
        ...payment,
        booking: bookingsMap.get(payment.bookingId),
    }));
};

// --- Expense Categories ---
export const getExpenseCategories = async () => getCollection<ExpenseCategory>('expenseCategories');
export const addExpenseCategory = async (data: Omit<ExpenseCategory, 'id'>) => addDocument('expenseCategories', data);
export const updateExpenseCategory = async (id: string, data: Partial<ExpenseCategory>) => updateDocument('expenseCategories', id, data);
export const deleteExpenseCategory = async (id: string) => deleteDocument('expenseCategories', id);


// --- Property Expenses ---
export const getPropertyExpensesByPropertyId = async (propertyId: string): Promise<PropertyExpense[]> => {
    const q = query(collection(db, "propertyExpenses"), where("propertyId", "==", propertyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => snapshotToDoc<PropertyExpense>(d));
};

export const addPropertyExpense = async (data: Omit<PropertyExpense, 'id'>) => addDocument('propertyExpenses', data);
export const updatePropertyExpense = async (id: string, data: Partial<PropertyExpense>) => updateDocument('propertyExpenses', id, data);
export const deletePropertyExpense = async (id: string) => deleteDocument('propertyExpenses', id);


// --- General Expenses ---
export const getGeneralExpenses = async () => getCollection<GeneralExpense>('generalExpenses');
export const addGeneralExpense = async (data: Omit<GeneralExpense, 'id'>) => addDocument('generalExpenses', data);
export const updateGeneralExpense = async (id: string, data: Partial<GeneralExpense>) => updateDocument('generalExpenses', id, data);
export const deleteGeneralExpense = async (id: string) => deleteDocument('generalExpenses', id);


// --- Unified Expenses ---
export const getAllExpensesUnified = async (): Promise<UnifiedExpense[]> => {
    const [propExpenses, genExpenses, categories, properties] = await Promise.all([
        getCollection<PropertyExpense>('propertyExpenses'),
        getCollection<GeneralExpense>('generalExpenses'),
        getExpenseCategories(),
        getProperties(),
    ]);

    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const propertyMap = new Map(properties.map(p => [p.id, p]));

    const unifiedPropExpenses: UnifiedExpense[] = propExpenses.map(e => ({
        ...e,
        type: 'property',
        category: categoryMap.get(e.categoryId),
        property: propertyMap.get(e.propertyId),
    }));
    
    const unifiedGenExpenses: UnifiedExpense[] = genExpenses.map(e => ({
        ...e,
        type: 'general',
        category: categoryMap.get(e.categoryId),
    }));

    return [...unifiedPropExpenses, ...unifiedGenExpenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- Email Templates ---
export const getEmailTemplates = async () => getCollection<EmailTemplate>('emailTemplates');
export const addEmailTemplate = async (data: Omit<EmailTemplate, 'id'>) => addDocument('emailTemplates', data);
export const updateEmailTemplate = async (id: string, data: Partial<EmailTemplate>) => updateDocument('emailTemplates', id, data);
export const deleteEmailTemplate = async (id: string) => deleteDocument('emailTemplates', id);


// --- Email Settings ---
const EMAIL_SETTINGS_ID = 'default';
export const getEmailSettings = async (): Promise<EmailSettings | null> => getDocumentById<EmailSettings>('emailSettings', EMAIL_SETTINGS_ID);

export const saveEmailSettings = async (settings: Omit<EmailSettings, 'id'>) => {
    // This is an "upsert" operation
    return updateDocument('emailSettings', EMAIL_SETTINGS_ID, settings);
};

// --- Reports ---
export const getFinancialSummaryByProperty = async (filters: { startDate?: string, endDate?: string }): Promise<FinancialSummaryByCurrency> => {
    const { startDate, endDate } = filters;
    const [properties, bookings, allExpenses] = await Promise.all([
        getProperties(),
        getBookings(),
        getAllExpensesUnified(),
    ]);

    const summaryArs: { [key: string]: FinancialSummary } = {};
    const summaryUsd: { [key: string]: FinancialSummary } = {};

    properties.forEach(p => {
        summaryArs[p.id] = { propertyId: p.id, propertyName: p.name, totalIncome: 0, totalExpenses: 0, netResult: 0 };
        summaryUsd[p.id] = { propertyId: p.id, propertyName: p.name, totalIncome: 0, totalExpenses: 0, netResult: 0 };
    });

    const filteredBookings = bookings.filter(b => {
        const bookingDate = new Date(b.startDate);
        if (startDate && bookingDate < new Date(startDate)) return false;
        if (endDate && bookingDate > new Date(endDate)) return false;
        return true;
    });

    for (const booking of filteredBookings) {
        if (!booking.propertyId) continue;
        
        const bookingPayments = booking.payments;
        for (const payment of bookingPayments) {
            const paymentDate = new Date(payment.date);
            if (startDate && paymentDate < new Date(startDate)) continue;
            if (endDate && paymentDate < new Date(endDate)) continue;
        
            if (payment.currency === 'ARS') {
                if(summaryArs[booking.propertyId]) {
                    summaryArs[booking.propertyId].totalIncome += payment.amount;
                }
            } else { // USD
                if(summaryUsd[booking.propertyId]) {
                    summaryUsd[booking.propertyId].totalIncome += payment.amount;
                }
            }
        }
    }
    
    const filteredExpenses = allExpenses.filter(e => {
        const expenseDate = new Date(e.date);
        if (startDate && expenseDate < new Date(startDate)) return false;
        if (endDate && expenseDate < new Date(endDate)) return false;
        return true;
    });

    for (const expense of filteredExpenses) {
        if (expense.type === 'property' && expense.propertyId) {
             if (expense.currency === 'ARS') {
                if(summaryArs[expense.propertyId]) {
                    summaryArs[expense.propertyId].totalExpenses += expense.amount;
                }
            } else { // USD
                if(summaryUsd[expense.propertyId]) {
                    summaryUsd[expense.propertyId].totalExpenses += expense.amount;
                }
            }
        }
    }

    Object.values(summaryArs).forEach(s => s.netResult = s.totalIncome - s.totalExpenses);
    Object.values(summaryUsd).forEach(s => s.netResult = s.totalIncome - s.totalExpenses);

    return {
        ars: Object.values(summaryArs),
        usd: Object.values(summaryUsd),
    };
};
