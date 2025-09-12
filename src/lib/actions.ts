
"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from './firebase-admin';
import {
    getBookingById,
    getPropertyById,
    getTenantById,
    Tenant,
    Booking,
    PropertyExpense,
    BookingExpense,
    Payment,
    Property,
    ContractStatus,
    ExpenseCategory,
    GuaranteeStatus,
    EmailTemplate,
    EmailSettings
} from "./data";
import { addEventToCalendar, deleteEventFromCalendar, updateEventInCalendar } from "./google-calendar";

const propertiesCollectionAdmin = adminDb.collection('properties');
const tenantsCollectionAdmin = adminDb.collection('tenants');
const bookingsCollectionAdmin = adminDb.collection('bookings');
const propertyExpensesCollectionAdmin = adminDb.collection('propertyExpenses');
const bookingExpensesCollectionAdmin = adminDb.collection('bookingExpenses');
const paymentsCollectionAdmin = adminDb.collection('payments');
const expenseCategoriesCollectionAdmin = adminDb.collection('expenseCategories');
const emailTemplatesCollectionAdmin = adminDb.collection('emailTemplates');
const settingsCollectionAdmin = adminDb.collection('settings');


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
    await propertiesCollectionAdmin.add(newPropertyData);
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
    await propertiesCollectionAdmin.doc(id).update(data);
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
        const batch = adminDb.batch();

        const propertyRef = propertiesCollectionAdmin.doc(id);
        batch.delete(propertyRef);

        const bookingsQuery = adminDb.collection('bookings').where('propertyId', '==', id);
        const bookingsSnapshot = await bookingsQuery.get();
        
        const bookingIds = bookingsSnapshot.docs.map(d => d.id);

        if (bookingIds.length > 0) {
            const paymentsQuery = adminDb.collection('payments').where('bookingId', 'in', bookingIds);
            const paymentsSnapshot = await paymentsQuery.get();
            paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

            const bookingExpensesQuery = adminDb.collection('bookingExpenses').where('bookingId', 'in', bookingIds);
            const bookingExpensesSnapshot = await bookingExpensesQuery.get();
            bookingExpensesSnapshot.forEach(doc => batch.delete(doc.ref));
        }

        bookingsSnapshot.forEach(doc => batch.delete(doc.ref));

        const propertyExpensesQuery = adminDb.collection('propertyExpenses').where('propertyId', '==', id);
        const propertyExpensesSnapshot = await propertyExpensesQuery.get();
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
    await tenantsCollectionAdmin.add(newTenant);
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
    await tenantsCollectionAdmin.doc(id).update(updatedTenant);
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
      await tenantsCollectionAdmin.doc(id).delete();
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
        const docRef = await bookingsCollectionAdmin.add(newBookingData);
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
                    await bookingsCollectionAdmin.doc(newBooking.id).update({ googleCalendarEventId: eventId });
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
        const oldBookingDoc = await bookingsCollectionAdmin.doc(id).get();
        if (!oldBookingDoc.exists) {
            return { success: false, message: "No se encontró la reserva para actualizar." };
        }
        const oldBooking = oldBookingDoc.data() as Booking;
        
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
            guaranteeStatus: formData.get("guaranteeStatus") as GuaranteeStatus || oldBooking.guaranteeStatus,
            guaranteeCurrency: formData.get("guaranteeCurrency") as 'USD' | 'ARS' || oldBooking.guaranteeCurrency,
        };

        const guaranteeStatus = updatedBookingData.guaranteeStatus;
        const guaranteeAmountStr = formData.get("guaranteeAmount") as string;
        const guaranteeReceivedDateStr = formData.get("guaranteeReceivedDate") as string;
        const guaranteeReturnedDateStr = formData.get("guaranteeReturnedDate") as string;

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

        if ((guaranteeStatus === 'solicited' || guaranteeStatus === 'received' || guaranteeStatus === 'returned') && (updatedBookingData.guaranteeAmount === null || updatedBookingData.guaranteeAmount <= 0)) {
            return { success: false, message: "El 'Monto' de la garantía es obligatorio y debe ser mayor a 0 para el estado seleccionado." };
        }
        if (guaranteeStatus === 'received' && !updatedBookingData.guaranteeReceivedDate) {
            return { success: false, message: "La 'Fecha Recibida' es obligatoria para el estado 'Recibida'." };
        }
        if (guaranteeStatus === 'returned' && !updatedBookingData.guaranteeReturnedDate) {
            return { success: false, message: "La 'Fecha Devuelta' es obligatoria para el estado 'Devuelta'." };
        }

        await bookingsCollectionAdmin.doc(id).update(updatedBookingData);
        
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
                            await bookingsCollectionAdmin.doc(id).update({ googleCalendarEventId: newEventId });
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
        const bookingDoc = await bookingsCollectionAdmin.doc(id).get();
        const bookingToDelete = bookingDoc.data() as Booking;

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

        const batch = adminDb.batch();
    
        const bookingRef = bookingsCollectionAdmin.doc(id);
        batch.delete(bookingRef);

        const paymentsQuery = adminDb.collection('payments').where('bookingId', '==', id);
        const paymentsSnapshot = await paymentsQuery.get();
        paymentsSnapshot.forEach(doc => batch.delete(doc.ref));

        const expensesQuery = adminDb.collection('bookingExpenses').where('bookingId', '==', id);
        const expensesSnapshot = await expensesQuery.get();
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
    } = {
        amount: originalAmount,
        description: description,
    };

    if (currency === 'USD') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) {
            throw new Error("El valor del USD es obligatorio y debe ser mayor a cero para gastos en USD.");
        }
        expensePayload.exchangeRate = rate;
        expensePayload.amount = originalAmount * expensePayload.exchangeRate;
        expensePayload.originalUsdAmount = originalAmount;

        const usdFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(originalAmount);
        const rateFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(expensePayload.exchangeRate);
        const autoDescription = `Gasto en USD - Total: ${usdFormatted} - Valor USD: ${rateFormatted}`;
        expensePayload.description = description ? `${description} | ${autoDescription}` : autoDescription;
    }

    if (categoryId && categoryId !== 'none') {
        expensePayload.categoryId = categoryId;
    } else {
        expensePayload.categoryId = null;
    }
    
    if (expensePayload.exchangeRate === undefined) delete expensePayload.exchangeRate;
    if (expensePayload.originalUsdAmount === undefined) delete expensePayload.originalUsdAmount;
    
    return expensePayload;
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

        await propertyExpensesCollectionAdmin.add(newExpense);
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
            ...expenseData,
        };

        await propertyExpensesCollectionAdmin.doc(id).update(updatedExpense);
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
        await propertyExpensesCollectionAdmin.doc(id).delete();
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

        await bookingExpensesCollectionAdmin.add(newExpense);
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
            ...expenseData,
        };

        await bookingExpensesCollectionAdmin.doc(id).update(updatedExpense);
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
        await bookingExpensesCollectionAdmin.doc(id).delete();
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
        await paymentsCollectionAdmin.add(paymentPayload);
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
        await paymentsCollectionAdmin.doc(id).update({
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
        await paymentsCollectionAdmin.doc(id).delete();
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
    await expenseCategoriesCollectionAdmin.add({ name });
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
    await expenseCategoriesCollectionAdmin.doc(id).update({ name });
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
    await expenseCategoriesCollectionAdmin.doc(id).delete();
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
    await emailTemplatesCollectionAdmin.add({ name, subject, body });
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
    await emailTemplatesCollectionAdmin.doc(id).update({ name, subject, body });
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
    await emailTemplatesCollectionAdmin.doc(id).delete();
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
        await settingsCollectionAdmin.doc('email').set({ replyToEmail }, { merge: true });
        revalidatePath('/settings');
        return { success: true, message: 'Configuración de email guardada.' };
    } catch (error) {
        return { success: false, message: 'Error al guardar la configuración de email.' };
    }
}
