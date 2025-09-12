
"use server";

import { revalidatePath } from "next/cache";
import { db } from './firebase';
import {
    Booking,
    ContractStatus,
    ExpenseCategory,
    GuaranteeStatus,
    Property,
    Tenant
} from "./data";
import { addEventToCalendar, deleteEventFromCalendar, updateEventInCalendar } from "./google-calendar";
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, where, getDocs, getDoc } from "firebase/firestore";


const propertiesCollection = collection(db, 'properties');
const tenantsCollection = collection(db, 'tenants');
const bookingsCollection = collection(db, 'bookings');
const propertyExpensesCollection = collection(db, 'propertyExpenses');
const bookingExpensesCollection = collection(db, 'bookingExpenses');
const paymentsCollection = collection(db, 'payments');
const expenseCategoriesCollection = collection(db, 'expenseCategories');
const emailTemplatesCollection = collection(db, 'emailTemplates');
const settingsCollection = collection(db, 'settings');


export async function getPropertyById(id: string): Promise<Property | undefined> {
  if (!id) return undefined;
  const docRef = doc(db, 'properties', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Property : undefined;
}

export async function getTenantById(id: string): Promise<Tenant | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'tenants', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Tenant : undefined;
}

export async function getBookingById(id: string): Promise<Booking | undefined> {
    if (!id) return undefined;
    const docRef = doc(db, 'bookings', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Booking : undefined;
}


export async function addProperty(previousState: any, formData: FormData) {
  const newPropertyData = {
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
    await addDoc(propertiesCollection, newPropertyData);
    revalidatePath("/settings");
    revalidatePath("/properties");
    revalidatePath("/");
    return { success: true, message: "Propiedad añadida correctamente." };
  } catch (error) {
    console.error("Error adding property:", error);
    return { success: false, message: "Error al añadir la propiedad." };
  }
}


export async function updateProperty(previousState: any, formData: FormData) {
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
    const { id, ...data } = propertyData;
    await updateDoc(doc(db, 'properties', id), data);
    revalidatePath("/settings");
    revalidatePath("/properties");
    revalidatePath(`/properties/${propertyData.id}`);
    revalidatePath("/");
    revalidatePath("/bookings");
    revalidatePath("/expenses");
    revalidatePath("/payments");
    revalidatePath("/reports");
    return { success: true, message: "Propiedad actualizada." };
  } catch (error) {
     console.error("Error updating property:", error);
    return { success: false, message: "Error al actualizar la propiedad." };
  }
}


export async function deleteProperty(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const confirmation = formData.get("confirmation") as string;

    if (!id) {
        return { success: false, message: "ID de propiedad no válido." };
    }

    if (confirmation !== "Eliminar") {
        return { success: false, message: "La confirmación no es correcta." };
    }

    try {
        const batch = writeBatch(db);

        const propertyRef = doc(db, 'properties', id);
        batch.delete(propertyRef);

        const bookingsQuery = query(collection(db, 'bookings'), where('propertyId', '==', id));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        const bookingIds = bookingsSnapshot.docs.map(d => d.id);

        if (bookingIds.length > 0) {
            const paymentsQuery = query(collection(db, 'payments'), where('bookingId', 'in', bookingIds));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

            const bookingExpensesQuery = query(collection(db, 'bookingExpenses'), where('bookingId', 'in', bookingIds));
            const bookingExpensesSnapshot = await getDocs(bookingExpensesQuery);
            bookingExpensesSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        bookingsSnapshot.forEach(doc => batch.delete(doc.ref));

        const propertyExpensesQuery = query(collection(db, 'propertyExpenses'), where('propertyId', '==', id));
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
    } catch (error) {
        console.error("Error deleting property:", error);
        return { success: false, message: "Error al eliminar la propiedad." };
    }
}


export async function addTenant(previousState: any, formData: FormData) {
  const newTenant = {
    name: formData.get("name") as string,
    dni: formData.get("dni") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    country: (formData.get("country") as string) || "Argentina",
    notes: formData.get("notes") as string || "",
  };

  try {
    await addDoc(tenantsCollection, newTenant);
    revalidatePath("/tenants");
    return { success: true, message: "Inquilino añadido correctamente." };
  } catch (error) {
    return { success: false, message: "Error al añadir inquilino." };
  }
}

export async function updateTenant(previousState: any, formData: FormData) {
  const updatedTenant: Omit<Tenant, 'id'> = {
    name: formData.get("name") as string,
    dni: formData.get("dni") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    country: formData.get("country") as string,
    notes: formData.get("notes") as string,
  };
  const id = formData.get("id") as string;

  try {
    await updateDoc(doc(db, 'tenants', id), updatedTenant);
    revalidatePath("/tenants");
    revalidatePath("/bookings");
    revalidatePath("/");
    return { success: true, message: "Inquilino actualizado correctamente." };
  } catch (error) {
    console.error("Error updating tenant:", error);
    return { success: false, message: "Error al actualizar inquilino." };
  }
}


export async function deleteTenant(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
  
    if (!id) {
      return { success: false, message: "ID de inquilino no válido." };
    }
  
    try {
      await deleteDoc(doc(db, 'tenants', id));
      revalidatePath("/tenants");
      return { success: true, message: "Inquilino eliminado correctamente." };
    } catch (error) {
      return { success: false, message: "Error al eliminar el inquilino." };
    }
  }

export async function addBooking(previousState: any, formData: FormData) {
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

    const newBookingData:Omit<Booking, 'id'> = {
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
        const docRef = await addDoc(bookingsCollection, newBookingData);
        const newBooking = { id: docRef.id, ...newBookingData };
        
        const property = await getPropertyById(propertyId);
        const tenant = await getTenantById(tenantId);

        if (property && property.googleCalendarId && tenant) {
            try {
                const eventId = await addEventToCalendar(property.googleCalendarId, {
                    startDate,
                    endDate,
                    tenantName: tenant.name,
                    notes,
                });
                if (eventId) {
                    await updateDoc(doc(db, 'bookings', newBooking.id), { googleCalendarEventId: eventId });
                }
            } catch (calendarError) {
                 console.error("Calendar sync failed on booking creation, but the booking was saved:", calendarError);
                 return { success: true, message: "Reserva creada, pero falló la sincronización con el calendario. Revise las credenciales." };
            }
        }
    
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/');
        return { success: true, message: "Reserva creada correctamente." };

    } catch (dbError) {
        console.error("Error creating booking in DB:", dbError);
        return { success: false, message: "Error al guardar la reserva en la base de datos." };
    }
}

export async function updateBooking(previousState: any, formData: FormData): Promise<{ success: boolean; message: string; }> {
    const id = formData.get("id") as string;
    if (!id) {
        return { success: false, message: "ID de reserva no proporcionado." };
    }

    try {
        const oldBooking = await getBookingById(id);
        if (!oldBooking) {
            return { success: false, message: "No se encontró la reserva para actualizar." };
        }
        
        const updatedBookingData: Partial<Booking> = {
            propertyId: formData.get("propertyId") as string || oldBooking.propertyId,
            tenantId: formData.get("tenantId") as string || oldBooking.tenantId,
            startDate: formData.get("startDate") as string || oldBooking.startDate,
            endDate: formData.get("endDate") as string || oldBooking.endDate,
            amount: parseFloat(formData.get("amount") as string) || oldBooking.amount,
            currency: formData.get("currency") as 'USD' | 'ARS' || oldBooking.currency,
            notes: formData.get("notes") as string ?? oldBooking.notes,
            contractStatus: formData.get("contractStatus") as ContractStatus || oldBooking.contractStatus,
            googleCalendarEventId: formData.get("googleCalendarEventId") as string ?? oldBooking.googleCalendarEventId,
        };

        // Only process guarantee fields if they are submitted (i.e., not from the main booking edit form)
        if (formData.has("guaranteeStatus")) {
            const guaranteeStatus = formData.get("guaranteeStatus") as GuaranteeStatus;
            const guaranteeAmountStr = formData.get("guaranteeAmount") as string;
            const guaranteeCurrency = formData.get("guaranteeCurrency") as 'USD' | 'ARS';
            const guaranteeReceivedDateStr = formData.get("guaranteeReceivedDate") as string;
            const guaranteeReturnedDateStr = formData.get("guaranteeReturnedDate") as string;

            updatedBookingData.guaranteeStatus = guaranteeStatus;
            updatedBookingData.guaranteeCurrency = guaranteeCurrency;

            if (guaranteeAmountStr && guaranteeAmountStr !== '') {
                updatedBookingData.guaranteeAmount = parseFloat(guaranteeAmountStr);
            } else {
                updatedBookingData.guaranteeAmount = null;
            }

            if (guaranteeReceivedDateStr && guaranteeReceivedDateStr !== '') {
                updatedBookingData.guaranteeReceivedDate = guaranteeReceivedDateStr;
            } else {
                updatedBookingData.guaranteeReceivedDate = null;
            }

            if (guaranteeReturnedDateStr && guaranteeReturnedDateStr !== '') {
                updatedBookingData.guaranteeReturnedDate = guaranteeReturnedDateStr;
            } else {
                updatedBookingData.guaranteeReturnedDate = null;
            }

            // Validation logic only for guarantee form
            if ((guaranteeStatus === 'solicited' || guaranteeStatus === 'received' || guaranteeStatus === 'returned') && (!updatedBookingData.guaranteeAmount || updatedBookingData.guaranteeAmount <= 0)) {
                return { success: false, message: "El 'Monto' de la garantía es obligatorio y debe ser mayor a 0 para el estado seleccionado." };
            }
            if (guaranteeStatus === 'received' && !updatedBookingData.guaranteeReceivedDate) {
                return { success: false, message: "La 'Fecha Recibida' es obligatoria para el estado 'Recibida'." };
            }
            if (guaranteeStatus === 'returned' && !updatedBookingData.guaranteeReturnedDate) {
                return { success: false, message: "La 'Fecha Devuelta' es obligatoria para el estado 'Devuelta'." };
            }
        }


        await updateDoc(doc(db, 'bookings', id), updatedBookingData);
        
        const finalBookingState = { ...oldBooking, ...updatedBookingData };

        const calendarFieldsChanged = updatedBookingData.startDate !== oldBooking.startDate || 
                                     updatedBookingData.endDate !== oldBooking.endDate || 
                                     updatedBookingData.tenantId !== oldBooking.tenantId ||
                                     updatedBookingData.notes !== oldBooking.notes;

        if (calendarFieldsChanged) {
            const property = await getPropertyById(finalBookingState.propertyId);
            const tenant = await getTenantById(finalBookingState.tenantId);
            
            if (property && property.googleCalendarId && tenant) {
                 try {
                    const eventDetails = { 
                        startDate: finalBookingState.startDate, 
                        endDate: finalBookingState.endDate, 
                        tenantName: tenant.name, 
                        notes: finalBookingState.notes 
                    };
                    
                    if (finalBookingState.googleCalendarEventId) {
                        await updateEventInCalendar(property.googleCalendarId, finalBookingState.googleCalendarEventId, eventDetails);
                    } else {
                        const newEventId = await addEventToCalendar(property.googleCalendarId, eventDetails);
                        if (newEventId) {
                            await updateDoc(doc(db, 'bookings', id), { googleCalendarEventId: newEventId });
                        }
                    }
                } catch (calendarError) {
                    console.error(`Calendar sync failed for booking ${id}, but the booking was updated:`, calendarError);
                    return { success: true, message: "Reserva actualizada, pero falló la sincronización con el calendario. Revise las credenciales." };
                }
            }
        }

        revalidatePath(`/properties/${finalBookingState.propertyId}`);
        revalidatePath(`/properties`);
        revalidatePath('/bookings');
        revalidatePath('/');
        return { success: true, message: "Reserva actualizada correctamente." };

    } catch (dbError) {
         console.error("Error updating booking in DB:", dbError);
         return { success: false, message: "Error al actualizar la reserva en la base de datos." };
    }
}


export async function deleteBooking(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const propertyId = formData.get("propertyId") as string;
    const confirmation = formData.get("confirmation") as string;

    if (!id || !propertyId) {
        return { success: false, message: "ID de reserva o propiedad no válido." };
    }
    
    if (confirmation !== "Eliminar") {
        return { success: false, message: "La confirmación no es correcta." };
    }

    try {
        const bookingToDelete = await getBookingById(id);
        
        if (bookingToDelete && bookingToDelete.googleCalendarEventId) {
            try {
                const property = await getPropertyById(bookingToDelete.propertyId);
                if (property && property.googleCalendarId) {
                    await deleteEventFromCalendar(property.googleCalendarId, bookingToDelete.googleCalendarEventId);
                }
            } catch(calendarError) {
                 console.error(`Failed to delete calendar event for booking ${id}, but deleting booking from DB anyway:`, calendarError);
            }
        }

        const batch = writeBatch(db);
    
        const bookingRef = doc(db, 'bookings', id);
        batch.delete(bookingRef);

        const paymentsQuery = query(collection(db, 'payments'), where('bookingId', '==', id));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

        const expensesQuery = query(collection(db, 'bookingExpenses'), where('bookingId', '==', id));
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.forEach(doc => batch.delete(doc.ref));
    
        await batch.commit();

        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/');
        return { success: true, message: "Reserva eliminada correctamente." };

    } catch (dbError) {
        console.error("Error deleting booking from DB:", dbError);
        return { success: false, message: "Error al eliminar la reserva de la base de datos." };
    }
}


const handleExpenseData = (formData: FormData) => {
    const originalAmount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const description = formData.get("description") as string;
    const exchangeRateStr = formData.get("exchangeRate") as string;
    const categoryId = formData.get("categoryId") as string;

    const expensePayload: {
        amount: number;
        description: string;
        exchangeRate?: number;
        originalUsdAmount?: number;
        categoryId?: string | null;
        currency: 'USD' | 'ARS'; // Add currency to the payload
    } = {
        amount: originalAmount,
        description: description,
        currency: currency, // Set the currency from the form
    };

    if (currency === 'USD') {
        // If currency is USD, `amount` is already in USD. We just need to save it.
        // No conversion needed, but we might want to store it as `originalUsdAmount` for consistency.
        expensePayload.originalUsdAmount = originalAmount;
        // The main `amount` field in Firestore for expenses should ideally be in a consistent currency (e.g., ARS).
        // Let's establish that `amount` will be ARS.
        const rate = parseFloat(exchangeRateStr);
         if (!rate || rate <= 0) {
            throw new Error("El valor del USD es obligatorio y debe ser mayor a cero para gastos en USD.");
        }
        expensePayload.exchangeRate = rate;
        expensePayload.amount = originalAmount * rate; // Convert USD to ARS for storage

        const usdFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(originalAmount);
        const rateFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(expensePayload.exchangeRate);
        const autoDescription = `Gasto en USD - Total: ${usdFormatted} - Valor USD: ${rateFormatted}`;
        expensePayload.description = description ? `${description} | ${autoDescription}` : autoDescription;

    } else { // currency is 'ARS'
        // If currency is ARS, `amount` is already in ARS.
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) {
            throw new Error("El valor del USD es obligatorio y debe ser mayor a cero para gastos en ARS.");
        }
        expensePayload.exchangeRate = rate;
    }


    if (categoryId && categoryId !== 'none') {
        expensePayload.categoryId = categoryId;
    } else {
        expensePayload.categoryId = null;
    }
    
    // We will store all expense amounts in ARS in the `amount` field.
    // We remove the `currency` from the final payload as it will always be ARS.
    const { currency: formCurrency, ...finalPayload } = expensePayload;


    return finalPayload;
}


export async function addPropertyExpense(previousState: any, formData: FormData) {
    try {
        const propertyId = formData.get("propertyId") as string;
        const date = formData.get("date") as string;

        if (!propertyId || !date) {
             return { success: false, message: "La propiedad y la fecha son obligatorias." };
        }

        const expenseData = handleExpenseData(formData);
        const newExpense = {
            propertyId,
            date,
            currency: 'ARS',
            ...expenseData
        };

        await addDoc(propertyExpensesCollection, newExpense);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto añadido correctamente." };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al añadir el gasto." };
    }
}

export async function updatePropertyExpense(previousState: any, formData: FormData) {
    try {
        const id = formData.get("id") as string;
        const propertyId = formData.get("propertyId") as string;
        const date = formData.get("date") as string;

        if (!id || !propertyId || !date) {
            return { success: false, message: "Faltan datos para actualizar el gasto." };
        }
        
        const expenseData = handleExpenseData(formData);
        const updatedExpense = {
            date,
            currency: 'ARS',
            ...expenseData,
        };

        await updateDoc(doc(db, 'propertyExpenses', id), updatedExpense);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto actualizado correctamente." };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al actualizar el gasto." };
    }
}

export async function deletePropertyExpense(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const propertyId = formData.get("propertyId") as string;

     if (!id || !propertyId) {
        return { success: false, message: "ID de gasto o propiedad no válido." };
    }

    try {
        await deleteDoc(doc(db, 'propertyExpenses', id));
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto eliminado correctamente." };
    } catch (error) {
        return { success: false, message: "Error al eliminar el gasto." };
    }
}


export async function addBookingExpense(previousState: any, formData: FormData) {
    try {
        const bookingId = formData.get("bookingId") as string;
        const date = formData.get("date") as string;
        
        if (!bookingId || !date) {
             return { success: false, message: "La reserva y la fecha son obligatorias." };
        }
        
        const expenseData = handleExpenseData(formData);
        const newExpense = {
            bookingId,
            date,
            currency: 'ARS',
            ...expenseData
        };

        await addDoc(bookingExpensesCollection, newExpense);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto de reserva añadido correctamente." };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al añadir el gasto de reserva." };
    }
}

export async function updateBookingExpense(previousState: any, formData: FormData) {
    try {
        const id = formData.get("id") as string;
        const bookingId = formData.get("bookingId") as string;
        const date = formData.get("date") as string;

        if (!id || !bookingId || !date) {
            return { success: false, message: "Faltan datos para actualizar el gasto." };
        }
        
        const expenseData = handleExpenseData(formData);
        const updatedExpense = {
            date,
            currency: 'ARS',
            ...expenseData,
        };

        await updateDoc(doc(db, 'bookingExpenses', id), updatedExpense);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto de reserva actualizado correctamente." };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al actualizar el gasto de reserva." };
    }
}

export async function deleteBookingExpense(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;

     if (!id) {
        return { success: false, message: "ID de gasto no válido." };
    }

    try {
        await deleteDoc(doc(db, 'bookingExpenses', id));
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath('/reports');
        revalidatePath('/expenses');
        return { success: true, message: "Gasto de reserva eliminado correctamente." };
    } catch (error) {
        return { success: false, message: "Error al eliminar el gasto de reserva." };
    }
}


export async function addPayment(previousState: any, formData: FormData) {
    const bookingId = formData.get("bookingId") as string;
    const originalAmount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const exchangeRateStr = formData.get("exchangeRate") as string;

    if (!bookingId || !originalAmount || !currency || !date) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }
    
    const paymentPayload: {
        bookingId: string;
        amount: number;
        currency: 'USD';
        date: string;
        description?: string;
        exchangeRate?: number;
        originalArsAmount?: number;
    } = {
        bookingId,
        amount: originalAmount,
        currency: 'USD',
        date,
        description,
    };


    if (currency === 'ARS') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) {
            return { success: false, message: "El valor del USD es obligatorio y debe ser mayor a cero para pagos en ARS." };
        }
        paymentPayload.exchangeRate = rate;
        paymentPayload.amount = originalAmount / paymentPayload.exchangeRate;
        paymentPayload.originalArsAmount = originalAmount;
        
        const arsFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(originalAmount);
        const rateFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(paymentPayload.exchangeRate);
        const autoDescription = `El pago se realizó en ARS - Total: ${arsFormatted} - Valor USD: ${rateFormatted}`;
        paymentPayload.description = description ? `${description} | ${autoDescription}` : autoDescription;
    }
    
    if (paymentPayload.exchangeRate === undefined) delete paymentPayload.exchangeRate;
    if (paymentPayload.originalArsAmount === undefined) delete paymentPayload.originalArsAmount;


    try {
        await addDoc(paymentsCollection, paymentPayload);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
        revalidatePath(`/payments`);
        return { success: true, message: "Pago añadido correctamente." };
    } catch (error) {
        console.error(error)
        return { success: false, message: "Error al añadir el pago." };
    }
}

export async function updatePayment(previousState: any, formData: FormData) {
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

    const paymentPayload: {
        amount: number;
        date: string;
        description?: string;
        exchangeRate?: number;
        originalArsAmount?: number;
    } = {
        amount: originalAmount,
        date,
        description
    };


    if (currency === 'ARS') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) {
            return { success: false, message: "El valor del USD es obligatorio y debe ser mayor a cero para pagos en ARS." };
        }
        paymentPayload.exchangeRate = rate;
        paymentPayload.amount = originalAmount / paymentPayload.exchangeRate;
        paymentPayload.originalArsAmount = originalAmount;

        const arsFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(originalAmount);
        const rateFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(paymentPayload.exchangeRate);
        const autoDescription = `El pago se realizó en ARS - Total: ${arsFormatted} - Valor USD: ${rateFormatted}`;
        paymentPayload.description = description ? `${description} | ${autoDescription}` : autoDescription;
    }
    
    if (paymentPayload.exchangeRate === undefined) delete paymentPayload.exchangeRate;
    if (paymentPayload.originalArsAmount === undefined) delete paymentPayload.originalArsAmount;

    try {
        await updateDoc(doc(db, 'payments', id), {
          ...paymentPayload,
          currency: 'USD'
        });
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
        revalidatePath(`/payments`);
        return { success: true, message: "Pago actualizado correctamente." };
    } catch (error) {
        return { success: false, message: "Error al actualizar el pago." };
    }
}

export async function deletePayment(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;

     if (!id) {
        return { success: false, message: "ID de pago no válido." };
    }

    try {
        await deleteDoc(doc(db, 'payments', id));
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
        revalidatePath(`/payments`);
        return { success: true, message: "Pago eliminado correctamente." };
    } catch (error) {
        return { success: false, message: "Error al eliminar el pago." };
    }
}


export async function addExpenseCategory(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) {
    return { success: false, message: 'El nombre de la categoría es obligatorio.' };
  }
  try {
    await addDoc(expenseCategoriesCollection, { name });
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría añadida.' };
  } catch (error) {
    return { success: false, message: 'Error al añadir la categoría.' };
  }
}

export async function updateExpenseCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  if (!id || !name) {
    return { success: false, message: 'Faltan datos para actualizar la categoría.' };
  }
  try {
    await updateDoc(doc(db, 'expenseCategories', id), { name });
    revalidatePath('/settings');
     revalidatePath('/expenses');
    return { success: true, message: 'Categoría actualizada.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar la categoría.' };
  }
}

export async function deleteExpenseCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de categoría no válido.' };
  }
  try {
    await deleteDoc(doc(db, 'expenseCategories', id));
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría eliminada.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar la categoría.' };
  }
}


export async function addEmailTemplate(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const subject = formData.get('subject') as string;
  const body = formData.get('body') as string;
  
  if (!name || !subject || !body) {
    return { success: false, message: 'Todos los campos son obligatorios.' };
  }
  try {
    await addDoc(emailTemplatesCollection, { name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla añadida.' };
  } catch (error) {
    return { success: false, message: 'Error al añadir la plantilla.' };
  }
}

export async function updateEmailTemplate(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const subject = formData.get('subject') as string;
  const body = formData.get('body') as string;

  if (!id || !name || !subject || !body) {
    return { success: false, message: 'Faltan datos para actualizar la plantilla.' };
  }
  try {
    await updateDoc(doc(db, 'emailTemplates', id), { name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla actualizada.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar la plantilla.' };
  }
}

export async function deleteEmailTemplate(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de plantilla no válido.' };
  }
  try {
    await deleteDoc(doc(db, 'emailTemplates', id));
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla eliminada.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar la plantilla.' };
  }
}


export async function updateEmailSettings(previousState: any, formData: FormData) {
    const replyToEmail = formData.get('replyToEmail') as string;
    
    if (replyToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToEmail)) {
        return { success: false, message: 'Por favor, introduce una dirección de email válida.' };
    }

    try {
        await updateDoc(doc(db, 'settings', 'email'), { replyToEmail });
        revalidatePath('/settings');
        return { success: true, message: 'Configuración de email guardada.' };
    } catch (error) {
        return { success: false, message: 'Error al guardar la configuración de email.' };
    }
}
