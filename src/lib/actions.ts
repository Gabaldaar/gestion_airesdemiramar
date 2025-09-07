

"use server";

import { revalidatePath } from "next/cache";
import { 
    addTenant as dbAddTenant, 
    updateTenant as dbUpdateTenant,
    deleteTenant as dbDeleteTenant,
    addBooking as dbAddBooking,
    updateBooking as dbUpdateBooking,
    deleteBooking as dbDeleteBooking,
    addPropertyExpense as dbAddPropertyExpense,
    updatePropertyExpense as dbUpdatePropertyExpense,
    deletePropertyExpense as dbDeletePropertyExpense,
    addBookingExpense as dbAddBookingExpense,
    updateBookingExpense as dbUpdateBookingExpense,
    deleteBookingExpense as dbDeleteBookingExpense,
    addPayment as dbAddPayment,
    updatePayment as dbUpdatePayment,
    deletePayment as dbDeletePayment,
    addProperty as dbAddProperty,
    updateProperty as dbUpdateProperty,
    deleteProperty as dbDeleteProperty,
    addExpenseCategory as dbAddExpenseCategory,
    updateExpenseCategory as dbUpdateExpenseCategory,
    deleteExpenseCategory as dbDeleteExpenseCategory,
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
} from "./data";
import { addEventToCalendar, deleteEventFromCalendar, updateEventInCalendar } from "./google-calendar";


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
    await dbAddProperty(newPropertyData);
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
    await dbUpdateProperty(propertyData);
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
        await dbDeleteProperty(id);
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
    await dbAddTenant(newTenant);
    revalidatePath("/tenants");
    return { success: true, message: "Inquilino añadido correctamente." };
  } catch (error) {
    return { success: false, message: "Error al añadir inquilino." };
  }
}

export async function updateTenant(previousState: any, formData: FormData) {
  const updatedTenant: Tenant = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    dni: formData.get("dni") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    country: formData.get("country") as string,
    notes: formData.get("notes") as string,
  };

  try {
    await dbUpdateTenant(updatedTenant);
    revalidatePath("/tenants");
    revalidatePath("/bookings");
    revalidatePath("/");
    return { success: true, message: "Inquilino actualizado correctamente." };
  } catch (error) {
    return { success: false, message: "Error al actualizar inquilino." };
  }
}


export async function deleteTenant(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
  
    if (!id) {
      return { success: false, message: "ID de inquilino no válido." };
    }
  
    try {
      await dbDeleteTenant(id);
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

    const newBookingData = {
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
        // First, save the booking to our database.
        const newBooking = await dbAddBooking(newBookingData);
        
        // Then, try to sync with Google Calendar.
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
                // If the event is created successfully, update our booking with the event ID.
                if (eventId) {
                    await dbUpdateBooking({ ...newBooking, googleCalendarEventId: eventId });
                }
            } catch (calendarError) {
                 // Log the calendar error, but don't block the user. The booking is already saved.
                 // We show a more generic error message to the user now.
                 console.error("Calendar sync failed on booking creation, but the booking was saved:", calendarError);
                 return { success: true, message: "Reserva creada, pero falló la sincronización con el calendario. Revise las credenciales." };
            }
        }
    
        // Revalidate paths to update the UI.
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/'); // Revalidate dashboard
        return { success: true, message: "Reserva creada correctamente." };

    } catch (dbError) {
        console.error("Error creating booking in DB:", dbError);
        return { success: false, message: "Error al guardar la reserva en la base de datos." };
    }
}

export async function updateBooking(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;

    if (!id) {
        return { success: false, message: "ID de reserva no proporcionado." };
    }

    try {
        const oldBooking = await getBookingById(id);
        if (!oldBooking) {
            return { success: false, message: "No se encontró la reserva para actualizar." };
        }
        
        // Create a mutable copy of the old booking to update
        const updatedBookingData: Booking = { ...oldBooking };

        // Helper to update a field if it exists in formData
        const updateField = (key: keyof Booking, value: any) => {
            if (value !== null && value !== undefined) {
                (updatedBookingData as any)[key] = value;
            }
        };

        // Update all fields from the form
        updateField("propertyId", formData.get("propertyId") as string);
        updateField("tenantId", formData.get("tenantId") as string);
        updateField("startDate", formData.get("startDate") as string);
        updateField("endDate", formData.get("endDate") as string);
        updateField("amount", parseFloat(formData.get("amount") as string));
        updateField("currency", formData.get("currency") as 'USD' | 'ARS');
        updateField("notes", formData.get("notes") as string);
        updateField("contractStatus", formData.get("contractStatus") as ContractStatus);
        updateField("guaranteeStatus", formData.get("guaranteeStatus") as GuaranteeStatus);
        updateField("guaranteeCurrency", formData.get("guaranteeCurrency") as 'USD' | 'ARS');
        
        const guaranteeAmountStr = formData.get("guaranteeAmount") as string;
        if (guaranteeAmountStr) {
            updateField("guaranteeAmount", parseFloat(guaranteeAmountStr));
        } else {
            // Handle case where amount is cleared
            delete updatedBookingData.guaranteeAmount;
        }

        const receivedDateStr = formData.get("guaranteeReceivedDate") as string;
        if (receivedDateStr) {
            updateField("guaranteeReceivedDate", receivedDateStr);
        } else {
            delete updatedBookingData.guaranteeReceivedDate;
        }

        const returnedDateStr = formData.get("guaranteeReturnedDate") as string;
        if (returnedDateStr) {
            updateField("guaranteeReturnedDate", returnedDateStr);
        } else {
            delete updatedBookingData.guaranteeReturnedDate;
        }

        // First, update the booking in our database.
        await dbUpdateBooking(updatedBookingData);
        
        // Then, try to sync with Google Calendar.
        const property = await getPropertyById(updatedBookingData.propertyId);
        const tenant = await getTenantById(updatedBookingData.tenantId);
        
        if (property && property.googleCalendarId && tenant) {
             try {
                const eventDetails = { 
                    startDate: updatedBookingData.startDate, 
                    endDate: updatedBookingData.endDate, 
                    tenantName: tenant.name, 
                    notes: updatedBookingData.notes 
                };
                
                if (oldBooking.googleCalendarEventId) {
                    await updateEventInCalendar(property.googleCalendarId, oldBooking.googleCalendarEventId, eventDetails);
                } else {
                    const newEventId = await addEventToCalendar(property.googleCalendarId, eventDetails);
                    if (newEventId) {
                        await dbUpdateBooking({ ...updatedBookingData, googleCalendarEventId: newEventId });
                    }
                }
            } catch (calendarError) {
                console.error(`Calendar sync failed for booking ${id}, but the booking was updated:`, calendarError);
                return { success: true, message: "Reserva actualizada, pero falló la sincronización con el calendario. Revise las credenciales." };
            }
        }

        // Revalidate paths to update the UI.
        revalidatePath(`/properties/${updatedBookingData.propertyId}`);
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

     if (!id || !propertyId) {
        return { success: false, message: "ID de reserva o propiedad no válido." };
    }

    try {
        const bookingToDelete = await getBookingById(id);

        // First, try to delete from Google Calendar.
        if (bookingToDelete && bookingToDelete.googleCalendarEventId) {
            try {
                const property = await getPropertyById(bookingToDelete.propertyId);
                if (property && property.googleCalendarId) {
                    await deleteEventFromCalendar(property.googleCalendarId, bookingToDelete.googleCalendarEventId);
                }
            } catch(calendarError) {
                 console.error(`Failed to delete calendar event for booking ${id}, but deleting booking from DB anyway:`, calendarError);
                 // We don't return here, just log the error and proceed with DB deletion.
            }
        }

        // Then, delete the booking from our database.
        await dbDeleteBooking(id);

        // Revalidate paths.
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/'); // Revalidate dashboard
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
        expensePayload.amount = originalAmount * expensePayload.exchangeRate; // This is now amount in ARS
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
            ...expenseData
        };

        await dbAddPropertyExpense(newExpense as Omit<PropertyExpense, 'id'>);
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
        const updatedExpense: PropertyExpense = {
            id,
            propertyId,
            date,
            ...expenseData,
            currency: 'ARS',
        };

        await dbUpdatePropertyExpense(updatedExpense);
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
        await dbDeletePropertyExpense(id);
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
            ...expenseData
        };

        await dbAddBookingExpense(newExpense as Omit<BookingExpense, 'id'>);
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
        const updatedExpense: BookingExpense = {
            id,
            bookingId,
            date,
            ...expenseData,
            currency: 'ARS',
        };

        await dbUpdateBookingExpense(updatedExpense);
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
        await dbDeleteBookingExpense(id);
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
    
    // Remove undefined fields
    if (paymentPayload.exchangeRate === undefined) delete paymentPayload.exchangeRate;
    if (paymentPayload.originalArsAmount === undefined) delete paymentPayload.originalArsAmount;


    try {
        await dbAddPayment(paymentPayload as Omit<Payment, 'id'>);
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
        id: string;
        bookingId: string;
        amount: number;
        currency: 'USD';
        date: string;
        description?: string;
        exchangeRate?: number;
        originalArsAmount?: number;
    } = {
        id,
        bookingId,
        amount: originalAmount,
        currency: 'USD',
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
    
    // Remove undefined fields
    if (paymentPayload.exchangeRate === undefined) delete paymentPayload.exchangeRate;
    if (paymentPayload.originalArsAmount === undefined) delete paymentPayload.originalArsAmount;

    try {
        await dbUpdatePayment(paymentPayload as Payment);
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
        await dbDeletePayment(id);
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
    await dbAddExpenseCategory({ name });
    revalidatePath('/settings');
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
    await dbUpdateExpenseCategory({ id, name });
    revalidatePath('/settings');
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
    await dbDeleteExpenseCategory(id);
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría eliminada.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar la categoría.' };
  }
}
