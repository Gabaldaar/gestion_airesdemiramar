
"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "./session";
import { db } from './firebase-admin'; // Admin SDK for server-side
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
    writeBatch,
} from 'firebase-admin/firestore';
import { addEventToCalendar, deleteEventFromCalendar, updateEventInCalendar } from "./google-calendar";
import { Booking, ContractStatus, ExpenseCategory, GuaranteeStatus, Property, Tenant, Payment, PropertyExpense, BookingExpense, EmailTemplate, EmailSettings, getPropertyById as clientGetPropertyById, getTenantById as clientGetTenantById, getBookingById as clientGetBookingById } from "./data";


// --- TYPE DEFINITIONS for Firestore data without ID ---
type NewProperty = Omit<Property, 'id'>;
type NewTenant = Omit<Tenant, 'id'>;
type NewBooking = Omit<Booking, 'id'>;
type NewPayment = Omit<Payment, 'id'>;
type NewPropertyExpense = Omit<PropertyExpense, 'id'>;
type NewBookingExpense = Omit<BookingExpense, 'id'>;
type NewExpenseCategory = Omit<ExpenseCategory, 'id'>;
type NewEmailTemplate = Omit<EmailTemplate, 'id'>;


// --- Helper function to get collection references ---
const getCollectionRef = <T>(collectionName: string) => {
    return collection(db, collectionName) as FirebaseFirestore.CollectionReference<T>;
};

// --- DATA WRITE FUNCTIONS (MOVED FROM data.ts) ---

export async function addProperty(previousState: any, formData: FormData) {
    await getSession();
    const newPropertyData: NewProperty = {
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        googleCalendarId: formData.get("googleCalendarId") as string,
        imageUrl: formData.get("imageUrl") as string,
        notes: formData.get("notes") as string || "",
        contractTemplate: formData.get("contractTemplate") as string || "",
    };

    if (!newPropertyData.name || !newPropertyData.address) {
        return { success: false, message: "El nombre y la dirección son obligatorios." };
    }

    try {
        const propertiesCollection = getCollectionRef<NewProperty>('properties');
        await addDoc(propertiesCollection, newPropertyData);
        revalidatePath("/settings");
        revalidatePath("/properties");
        revalidatePath("/");
        return { success: true, message: "Propiedad añadida correctamente." };
    } catch (error: any) {
        console.error("Error adding property:", error);
        return { success: false, message: `Error al añadir la propiedad: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function updateProperty(previousState: any, formData: FormData) {
    await getSession();
    const propertyData: Property = {
        id: formData.get("id") as string,
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        googleCalendarId: formData.get("googleCalendarId") as string,
        imageUrl: formData.get("imageUrl") as string,
        notes: formData.get("notes") as string,
        contractTemplate: formData.get("contractTemplate") as string,
    };

    if (!propertyData.id || !propertyData.name || !propertyData.address) {
        return { success: false, message: "Faltan datos para actualizar la propiedad." };
    }

    try {
        const propertiesCollection = getCollectionRef<Property>('properties');
        const { id, ...data } = propertyData;
        const docRef = doc(propertiesCollection, id);
        await updateDoc(docRef, data);
        revalidatePath("/settings");
        revalidatePath("/properties");
        revalidatePath(`/properties/${propertyData.id}`);
        revalidatePath("/");
        revalidatePath("/bookings");
        revalidatePath("/expenses");
        revalidatePath("/payments");
        revalidatePath("/reports");
        return { success: true, message: "Propiedad actualizada." };
    } catch (error: any) {
        console.error("Error updating property:", error);
        return { success: false, message: `Error al actualizar la propiedad: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function deleteProperty(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get("id") as string;
    const confirmation = formData.get("confirmation") as string;

    if (!id) {
        return { success: false, message: "ID de propiedad no válido." };
    }
    if (confirmation !== "Eliminar") {
        return { success: false, message: "La confirmación no es correcta." };
    }

    try {
        const batch = db.batch();
        const propertyRef = doc(getCollectionRef('properties'), id);
        batch.delete(propertyRef);

        const bookingsQuery = query(getCollectionRef('bookings'), where('propertyId', '==', id));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookingIds = bookingsSnapshot.docs.map(d => d.id);

        if (bookingIds.length > 0) {
            const paymentsQuery = query(getCollectionRef('payments'), where('bookingId', 'in', bookingIds));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

            const bookingExpensesQuery = query(getCollectionRef('bookingExpenses'), where('bookingId', 'in', bookingIds));
            const bookingExpensesSnapshot = await getDocs(bookingExpensesQuery);
            bookingExpensesSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        bookingsSnapshot.forEach(doc => batch.delete(doc.ref));

        const propertyExpensesQuery = query(getCollectionRef('propertyExpenses'), where('propertyId', '==', id));
        const propertyExpensesSnapshot = await getDocs(propertyExpensesQuery);
        propertyExpensesSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        revalidatePath("/settings");
        revalidatePath("/properties");
        revalidatePath("/");
        revalidatePath("/bookings");
        revalidatePath("/expenses");
        revalidatePath("/payments");
        revalidatePath("/reports");
        return { success: true, message: "Propiedad eliminada correctamente." };
    } catch (error: any) {
        console.error("Error deleting property:", error);
        return { success: false, message: `Error al eliminar la propiedad: 7 PERMISSION_DENIED: ${error.message}` };
    }
}


export async function addTenant(previousState: any, formData: FormData) {
  await getSession();
  const newTenant: NewTenant = {
    name: formData.get("name") as string,
    dni: (formData.get("dni") as string) || "",
    email: (formData.get("email") as string) || "",
    phone: (formData.get("phone") as string) || "",
    address: (formData.get("address") as string) || "",
    city: (formData.get("city") as string) || "",
    country: (formData.get("country") as string) || "Argentina",
    notes: (formData.get("notes") as string) || "",
  };

  try {
    const tenantsCollection = getCollectionRef<NewTenant>('tenants');
    await addDoc(tenantsCollection, newTenant);
    revalidatePath("/tenants");
    return { success: true, message: "Inquilino añadido correctamente." };
  } catch (error: any) {
    console.error("Error in addTenant action:", error);
    return { success: false, message: `Error al añadir inquilino: 7 PERMISSION_DENIED: ${error.message}` };
  }
}

export async function updateTenant(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;

    if (!id || !name) {
        return { success: false, message: "El ID y el nombre del inquilino son obligatorios." };
    }

    const updatedTenant: Tenant = {
        id,
        name,
        dni: (formData.get("dni") as string) ?? '',
        email: (formData.get("email") as string) ?? '',
        phone: (formData.get("phone") as string) ?? '',
        address: (formData.get("address") as string) ?? '',
        city: (formData.get("city") as string) ?? '',
        country: (formData.get("country") as string) ?? 'Argentina',
        notes: (formData.get("notes") as string) ?? '',
    };
    
    try {
        const tenantsCollection = getCollectionRef<Tenant>('tenants');
        const { id: tenantId, ...dataToUpdate } = updatedTenant;
        const tenantRef = doc(tenantsCollection, tenantId);
        await updateDoc(tenantRef, dataToUpdate);
        revalidatePath("/tenants");
        revalidatePath("/bookings");
        revalidatePath("/");
        revalidatePath(`/properties/${id}`);
        return { success: true, message: "Inquilino actualizado correctamente." };
    } catch (error: any) {
        console.error("Error in updateTenant action:", error);
        return { success: false, message: `Error al actualizar inquilino: 7 PERMISSION_DENIED: ${error.message}` };
    }
}


export async function deleteTenant(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get("id") as string;
  
    if (!id) {
      return { success: false, message: "ID de inquilino no válido." };
    }
  
    try {
      const tenantsCollection = getCollectionRef<Tenant>('tenants');
      const docRef = doc(tenantsCollection, id);
      await deleteDoc(docRef);
      revalidatePath("/tenants");
      return { success: true, message: "Inquilino eliminado correctamente." };
    } catch (error: any) {
      return { success: false, message: `Error al eliminar el inquilino: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function addBooking(previousState: any, formData: FormData) {
    await getSession();
    const propertyId = formData.get("propertyId") as string;
    const tenantId = formData.get("tenantId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const notes = formData.get("notes") as string || "";

    if (!propertyId || !tenantId || !startDate || !endDate || !amount || !currency) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }

    const newBookingData: NewBooking = {
        propertyId,
        tenantId,
        startDate,
        endDate,
        amount,
        currency,
        notes,
        contractStatus: 'not_sent' as ContractStatus,
        guaranteeStatus: 'not_solicited' as GuaranteeStatus,
    };
    
    try {
        const bookingsCollection = getCollectionRef<NewBooking>('bookings');
        const docRef = await addDoc(bookingsCollection, newBookingData);
        const newBooking = { id: docRef.id, ...newBookingData };
        
        const property = await clientGetPropertyById(propertyId);
        const tenant = await clientGetTenantById(tenantId);

        if (property && property.googleCalendarId && tenant) {
            try {
                const eventId = await addEventToCalendar(property.googleCalendarId, {
                    startDate,
                    endDate,
                    tenantName: tenant.name,
                    notes,
                });
                if (eventId) {
                    const bookingDocRef = doc(getCollectionRef('bookings'), newBooking.id);
                    await updateDoc(bookingDocRef, { googleCalendarEventId: eventId });
                }
            } catch (calendarError: any) {
                 console.error("Calendar sync failed on booking creation:", calendarError);
                 return { success: true, message: `Reserva creada, pero falló la sincronización con el calendario: ${calendarError.message}` };
            }
        }
    
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/');
        return { success: true, message: "Reserva creada correctamente." };

    } catch (dbError: any) {
        console.error("Error creating booking in DB:", dbError);
        return { success: false, message: `Error al guardar la reserva: 7 PERMISSION_DENIED: ${dbError.message}` };
    }
}

export async function updateBooking(previousState: any, formData: FormData): Promise<{ success: boolean; message: string; }> {
    await getSession();
    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID de reserva no proporcionado." };

    try {
        const oldBooking = await clientGetBookingById(id);
        if (!oldBooking) return { success: false, message: "No se encontró la reserva para actualizar." };
        
        const updatedBookingData: Partial<Booking> & { id: string } = {
            id,
            propertyId: formData.get("propertyId") as string || oldBooking.propertyId,
            tenantId: formData.get("tenantId") as string || oldBooking.tenantId,
            startDate: formData.get("startDate") as string || oldBooking.startDate,
            endDate: formData.get("endDate") as string || oldBooking.endDate,
            amount: parseFloat(formData.get("amount") as string) || oldBooking.amount,
            currency: formData.get("currency") as 'USD' | 'ARS' || oldBooking.currency,
            notes: formData.get("notes") as string ?? oldBooking.notes,
            contractStatus: formData.get("contractStatus") as ContractStatus || oldBooking.contractStatus,
            googleCalendarEventId: formData.get("googleCalendarEventId") as string ?? oldBooking.googleCalendarEventId,
            guaranteeStatus: formData.get("guaranteeStatus") as GuaranteeStatus || oldBooking.guaranteeStatus,
            guaranteeCurrency: formData.get("guaranteeCurrency") as 'USD' | 'ARS' || oldBooking.guaranteeCurrency,
        };

        const guaranteeAmountStr = formData.get("guaranteeAmount") as string;
        if (guaranteeAmountStr && guaranteeAmountStr !== '') updatedBookingData.guaranteeAmount = parseFloat(guaranteeAmountStr); else updatedBookingData.guaranteeAmount = null;

        const guaranteeReceivedDateStr = formData.get("guaranteeReceivedDate") as string;
        if (guaranteeReceivedDateStr && guaranteeReceivedDateStr !== '') updatedBookingData.guaranteeReceivedDate = guaranteeReceivedDateStr; else updatedBookingData.guaranteeReceivedDate = null;
        
        const guaranteeReturnedDateStr = formData.get("guaranteeReturnedDate") as string;
        if (guaranteeReturnedDateStr && guaranteeReturnedDateStr !== '') updatedBookingData.guaranteeReturnedDate = guaranteeReturnedDateStr; else updatedBookingData.guaranteeReturnedDate = null;
        

        const { id: bookingId, ...dataToUpdate } = updatedBookingData;
        const docRef = doc(getCollectionRef('bookings'), bookingId);
        await updateDoc(docRef, dataToUpdate);

        const calendarFieldsChanged = dataToUpdate.startDate !== oldBooking.startDate || dataToUpdate.endDate !== oldBooking.endDate || dataToUpdate.tenantId !== oldBooking.tenantId || dataToUpdate.notes !== oldBooking.notes;
        if (calendarFieldsChanged) {
            const property = await clientGetPropertyById(dataToUpdate.propertyId!);
            const tenant = await clientGetTenantById(dataToUpdate.tenantId!);
            
            if (property && property.googleCalendarId && tenant) {
                 try {
                    const eventDetails = { startDate: dataToUpdate.startDate!, endDate: dataToUpdate.endDate!, tenantName: tenant.name, notes: dataToUpdate.notes };
                    if (dataToUpdate.googleCalendarEventId) {
                        await updateEventInCalendar(property.googleCalendarId, dataToUpdate.googleCalendarEventId, eventDetails);
                    } else {
                        const newEventId = await addEventToCalendar(property.googleCalendarId, eventDetails);
                        if (newEventId) await updateDoc(docRef, { googleCalendarEventId: newEventId });
                    }
                } catch (calendarError: any) {
                    console.error(`Calendar sync failed for booking ${id}:`, calendarError);
                    return { success: true, message: `Reserva actualizada, pero falló la sincronización con el calendario: ${calendarError.message}` };
                }
            }
        }

        revalidatePath(`/properties/${dataToUpdate.propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/');
        return { success: true, message: "Reserva actualizada correctamente." };

    } catch (dbError: any) {
         console.error("Error updating booking in DB:", dbError);
         return { success: false, message: `Error al actualizar la reserva: 7 PERMISSION_DENIED: ${dbError.message}` };
    }
}


export async function deleteBooking(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get("id") as string;
    const propertyId = formData.get("propertyId") as string;
    const confirmation = formData.get("confirmation") as string;

    if (!id || !propertyId) return { success: false, message: "ID de reserva o propiedad no válido." };
    if (confirmation !== "Eliminar") return { success: false, message: "La confirmación no es correcta." };

    try {
        const bookingToDelete = await clientGetBookingById(id);

        if (bookingToDelete && bookingToDelete.googleCalendarEventId) {
            try {
                const property = await clientGetPropertyById(bookingToDelete.propertyId);
                if (property && property.googleCalendarId) {
                    await deleteEventFromCalendar(property.googleCalendarId, bookingToDelete.googleCalendarEventId);
                }
            } catch(calendarError: any) {
                 console.error(`Failed to delete calendar event for booking ${id}:`, calendarError);
            }
        }

        const batch = db.batch();
        const bookingRef = doc(getCollectionRef('bookings'), id);
        batch.delete(bookingRef);

        const paymentsQuery = query(getCollectionRef('payments'), where('bookingId', '==', id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

        const expensesQuery = query(getCollectionRef('bookingExpenses'), where('bookingId', '==', id));
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.forEach(doc => batch.delete(doc.ref));
        
        await batch.commit();

        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/');
        return { success: true, message: "Reserva eliminada correctamente." };

    } catch (dbError: any) {
        console.error("Error deleting booking from DB:", dbError);
        return { success: false, message: `Error al eliminar la reserva: 7 PERMISSION_DENIED: ${dbError.message}` };
    }
}


const handleExpenseData = (formData: FormData) => {
    const originalAmount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const description = formData.get("description") as string;
    const exchangeRateStr = formData.get("exchangeRate") as string;
    const categoryId = formData.get("categoryId") as string;

    const expensePayload: any = { description };

    if (currency === 'USD') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) throw new Error("El valor del USD es obligatorio y debe ser mayor a cero para gastos en USD.");
        expensePayload.exchangeRate = rate;
        expensePayload.amount = originalAmount * rate;
        expensePayload.originalUsdAmount = originalAmount;
        const autoDesc = `Gasto en USD - Total: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(originalAmount)} - Valor USD: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(expensePayload.exchangeRate)}`;
        expensePayload.description = description ? `${description} | ${autoDesc}` : autoDesc;
    } else {
        expensePayload.amount = originalAmount;
    }

    expensePayload.categoryId = (categoryId && categoryId !== 'none') ? categoryId : null;
    
    return expensePayload;
}


export async function addPropertyExpense(previousState: any, formData: FormData) {
    await getSession();
    try {
        const propertyId = formData.get("propertyId") as string;
        const date = formData.get("date") as string;
        if (!propertyId || !date) return { success: false, message: "La propiedad y la fecha son obligatorias." };

        const expenseData = handleExpenseData(formData);
        const newExpense: NewPropertyExpense = { propertyId, date, currency: 'ARS', ...expenseData };

        await addDoc(getCollectionRef('propertyExpenses'), newExpense);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto añadido correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al añadir el gasto: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function updatePropertyExpense(previousState: any, formData: FormData) {
    await getSession();
    try {
        const id = formData.get("id") as string;
        const propertyId = formData.get("propertyId") as string;
        const date = formData.get("date") as string;
        if (!id || !propertyId || !date) return { success: false, message: "Faltan datos para actualizar el gasto." };
        
        const expenseData = handleExpenseData(formData);
        const updatedExpense = { date, ...expenseData };

        await updateDoc(doc(getCollectionRef('propertyExpenses'), id), updatedExpense);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto actualizado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al actualizar el gasto: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function deletePropertyExpense(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get("id") as string;
    const propertyId = formData.get("propertyId") as string;
    if (!id || !propertyId) return { success: false, message: "ID de gasto o propiedad no válido." };

    try {
        await deleteDoc(doc(getCollectionRef('propertyExpenses'), id));
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto eliminado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al eliminar el gasto: 7 PERMISSION_DENIED: ${error.message}` };
    }
}


export async function addBookingExpense(previousState: any, formData: FormData) {
    await getSession();
    try {
        const bookingId = formData.get("bookingId") as string;
        const date = formData.get("date") as string;
        if (!bookingId || !date) return { success: false, message: "La reserva y la fecha son obligatorias." };
        
        const expenseData = handleExpenseData(formData);
        const newExpense: NewBookingExpense = { bookingId, date, currency: 'ARS', ...expenseData };

        await addDoc(getCollectionRef('bookingExpenses'), newExpense);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto de reserva añadido correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al añadir el gasto de reserva: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function updateBookingExpense(previousState: any, formData: FormData) {
    await getSession();
    try {
        const id = formData.get("id") as string;
        const bookingId = formData.get("bookingId") as string;
        const date = formData.get("date") as string;
        if (!id || !bookingId || !date) return { success: false, message: "Faltan datos para actualizar el gasto." };
        
        const expenseData = handleExpenseData(formData);
        const updatedExpense = { date, ...expenseData };

        await updateDoc(doc(getCollectionRef('bookingExpenses'), id), updatedExpense);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto de reserva actualizado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al actualizar el gasto de reserva: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function deleteBookingExpense(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID de gasto no válido." };

    try {
        await deleteDoc(doc(getCollectionRef('bookingExpenses'), id));
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto de reserva eliminado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al eliminar el gasto de reserva: 7 PERMISSION_DENIED: ${error.message}` };
    }
}


export async function addPayment(previousState: any, formData: FormData) {
    await getSession();
    const bookingId = formData.get("bookingId") as string;
    const originalAmount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const exchangeRateStr = formData.get("exchangeRate") as string;

    if (!bookingId || !originalAmount || !currency || !date) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }
    
    const paymentPayload: Partial<NewPayment> = { bookingId, date, description, currency: 'USD' };

    if (currency === 'ARS') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) return { success: false, message: "El valor del USD es obligatorio para pagos en ARS." };
        paymentPayload.exchangeRate = rate;
        paymentPayload.amount = originalAmount / rate;
        paymentPayload.originalArsAmount = originalAmount;
        const autoDesc = `Pago en ARS - Total: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(originalAmount)} - Valor USD: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rate)}`;
        paymentPayload.description = description ? `${description} | ${autoDesc}` : autoDesc;
    } else {
        paymentPayload.amount = originalAmount;
    }

    try {
        await addDoc(getCollectionRef('payments'), paymentPayload as NewPayment);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
        revalidatePath(`/payments`);
        return { success: true, message: "Pago añadido correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al añadir el pago: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function updatePayment(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get("id") as string;
    const bookingId = formData.get("bookingId") as string;
    const originalAmount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const exchangeRateStr = formData.get("exchangeRate") as string;

    if (!id || !bookingId || !originalAmount || !currency || !date) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }

    const paymentPayload: Partial<Payment> = { date, description };

    if (currency === 'ARS') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) return { success: false, message: "El valor del USD es obligatorio para pagos en ARS." };
        paymentPayload.exchangeRate = rate;
        paymentPayload.amount = originalAmount / rate;
        paymentPayload.originalArsAmount = originalAmount;
        const autoDesc = `Pago en ARS - Total: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(originalAmount)} - Valor USD: ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rate)}`;
        paymentPayload.description = description ? `${description} | ${autoDesc}` : autoDesc;
    } else {
        paymentPayload.amount = originalAmount;
        paymentPayload.exchangeRate = undefined;
        paymentPayload.originalArsAmount = undefined;
    }

    try {
        await updateDoc(doc(getCollectionRef('payments'), id), paymentPayload);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
        revalidatePath(`/payments`);
        return { success: true, message: "Pago actualizado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al actualizar el pago: 7 PERMISSION_DENIED: ${error.message}` };
    }
}

export async function deletePayment(previousState: any, formData: FormData) {
    await getSession();
    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID de pago no válido." };

    try {
        await deleteDoc(doc(getCollectionRef('payments'), id));
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
        revalidatePath(`/payments`);
        return { success: true, message: "Pago eliminado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error al eliminar el pago: 7 PERMISSION_DENIED: ${error.message}` };
    }
}


export async function addExpenseCategory(previousState: any, formData: FormData) {
  await getSession();
  const name = formData.get('name') as string;
  if (!name) return { success: false, message: 'El nombre de la categoría es obligatorio.' };
  try {
    await addDoc(getCollectionRef('expenseCategories'), { name });
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error al añadir la categoría: 7 PERMISSION_DENIED: ${error.message}` };
  }
}

export async function updateExpenseCategory(previousState: any, formData: FormData) {
  await getSession();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  if (!id || !name) return { success: false, message: 'Faltan datos para actualizar la categoría.' };
  try {
    await updateDoc(doc(getCollectionRef('expenseCategories'), id), { name });
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error al actualizar la categoría: 7 PERMISSION_DENIED: ${error.message}` };
  }
}

export async function deleteExpenseCategory(previousState: any, formData: FormData) {
  await getSession();
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'ID de categoría no válido.' };
  try {
    await deleteDoc(doc(getCollectionRef('expenseCategories'), id));
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría eliminada.' };
  } catch (error: any) {
    return { success: false, message: `Error al eliminar la categoría: 7 PERMISSION_DENIED: ${error.message}` };
  }
}


export async function addEmailTemplate(previousState: any, formData: FormData) {
  await getSession();
  const name = formData.get('name') as string;
  const subject = formData.get('subject') as string;
  const body = formData.get('body') as string;
  if (!name || !subject || !body) return { success: false, message: 'Todos los campos son obligatorios.' };
  try {
    await addDoc(getCollectionRef('emailTemplates'), { name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error al añadir la plantilla: 7 PERMISSION_DENIED: ${error.message}` };
  }
}

export async function updateEmailTemplate(previousState: any, formData: FormData) {
  await getSession();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const subject = formData.get('subject') as string;
  const body = formData.get('body') as string;

  if (!id || !name || !subject || !body) return { success: false, message: 'Faltan datos para actualizar la plantilla.' };
  try {
    await updateDoc(doc(getCollectionRef('emailTemplates'), id), { name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error al actualizar la plantilla: 7 PERMISSION_DENIED: ${error.message}` };
  }
}

export async function deleteEmailTemplate(previousState: any, formData: FormData) {
  await getSession();
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'ID de plantilla no válido.' };
  try {
    await deleteDoc(doc(getCollectionRef('emailTemplates'), id));
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla eliminada.' };
  } catch (error: any) {
    return { success: false, message: `Error al eliminar la plantilla: 7 PERMISSION_DENIED: ${error.message}` };
  }
}


export async function updateEmailSettings(previousState: any, formData: FormData) {
    await getSession();
    const replyToEmail = formData.get('replyToEmail') as string;
    if (replyToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToEmail)) {
        return { success: false, message: 'Por favor, introduce una dirección de email válida.' };
    }
    try {
        const settingsRef = doc(getCollectionRef('settings'), 'email');
        await updateDoc(settingsRef, { replyToEmail });
        revalidatePath('/settings');
        return { success: true, message: 'Configuración de email guardada.' };
    } catch (error: any) {
        return { success: false, message: `Error al guardar la configuración de email: 7 PERMISSION_DENIED: ${error.message}` };
    }
}
