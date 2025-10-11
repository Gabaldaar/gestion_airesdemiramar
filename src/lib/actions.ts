
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
    addEmailTemplate as dbAddEmailTemplate,
    updateEmailTemplate as dbUpdateEmailTemplate,
    deleteEmailTemplate as dbDeleteEmailTemplate,
    updateEmailSettings as dbUpdateEmailSettings,
    addOrigin as dbAddOrigin,
    updateOrigin as dbUpdateOrigin,
    deleteOrigin as dbDeleteOrigin,
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
    BookingStatus,
    db
} from "./data";


export async function addProperty(previousState: any, formData: FormData) {
  const newPropertyData = {
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    imageUrl: formData.get("imageUrl") as string,
    propertyUrl: formData.get("propertyUrl") as string,
    notes: formData.get("notes") as string || "",
    contractTemplate: formData.get("contractTemplate") as string || "",
    customField1Label: formData.get("customField1Label") as string,
    customField1Value: formData.get("customField1Value") as string,
    customField2Label: formData.get("customField2Label") as string,
    customField2Value: formData.get("customField2Value") as string,
    customField3Label: formData.get("customField3Label") as string,
    customField3Value: formData.get("customField3Value") as string,
    customField4Label: formData.get("customField4Label") as string,
    customField4Value: formData.get("customField4Value") as string,
    customField5Label: formData.get("customField5Label") as string,
    customField5Value: formData.get("customField5Value") as string,
    customField6Label: formData.get("customField6Label") as string,
    customField6Value: formData.get("customField6Value") as string,
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
  const propertyData: Omit<Property, 'googleCalendarId'> = {
    id: formData.get("id") as string,
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    imageUrl: formData.get("imageUrl") as string,
    propertyUrl: formData.get("propertyUrl") as string,
    notes: formData.get("notes") as string,
    contractTemplate: formData.get("contractTemplate") as string,
    customField1Label: formData.get("customField1Label") as string,
    customField1Value: formData.get("customField1Value") as string,
    customField2Label: formData.get("customField2Label") as string,
    customField2Value: formData.get("customField2Value") as string,
    customField3Label: formData.get("customField3Label") as string,
    customField3Value: formData.get("customField3Value") as string,
    customField4Label: formData.get("customField4Label") as string,
    customField4Value: formData.get("customField4Value") as string,
    customField5Label: formData.get("customField5Label") as string,
    customField5Value: formData.get("customField5Value") as string,
    customField6Label: formData.get("customField6Label") as string,
    customField6Value: formData.get("customField6Value") as string,
  };

   if (!propertyData.id || !propertyData.name || !propertyData.address) {
    return { success: false, message: "Faltan datos para actualizar la propiedad." };
  }
  
  try {
    await dbUpdateProperty(propertyData);
    revalidatePath("/settings");
    revalidatePath("/properties");
    revalidatePath(`/properties/${propertyData.id}`);
    revalidatePath(`/api/ical/${propertyData.id}`);
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
  const originIdValue = formData.get("originId") as string;
  const newTenant: Omit<Tenant, 'id'> = {
    name: formData.get("name") as string,
    dni: formData.get("dni") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    country: (formData.get("country") as string) || "Argentina",
    notes: formData.get("notes") as string || "",
    originId: originIdValue === 'none' ? undefined : originIdValue,
  };

  try {
    await dbAddTenant(newTenant);
    revalidatePath("/tenants");
    revalidatePath("/reports");
    return { success: true, message: "Inquilino añadido correctamente." };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateTenant(previousState: any, formData: FormData) {
  const originIdValue = formData.get("originId") as string;
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
    originId: originIdValue === 'none' ? null : originIdValue,
  };

  try {
    await dbUpdateTenant(updatedTenant);
    revalidatePath("/tenants");
    revalidatePath("/bookings");
    revalidatePath("/");
    revalidatePath("/reports");
    return { success: true, message: "Inquilino actualizado correctamente." };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
      revalidatePath("/reports");
      return { success: true, message: "Inquilino eliminado correctamente." };
    } catch (error: any) {
      return { success: false, message: `Error de base de datos: ${error.message}` };
    }
  }

export async function addBooking(previousState: any, formData: FormData) {
    const originIdValue = formData.get("originId") as string;
    const bookingData = {
        propertyId: formData.get("propertyId") as string,
        tenantId: formData.get("tenantId") as string,
        startDate: formData.get("startDate") as string,
        endDate: formData.get("endDate") as string,
        amount: parseFloat(formData.get("amount") as string),
        currency: formData.get("currency") as 'USD' | 'ARS',
        notes: formData.get("notes") as string || "",
        originId: originIdValue === 'none' ? undefined : originIdValue,
        contractStatus: 'not_sent' as ContractStatus,
        guaranteeStatus: 'not_solicited' as GuaranteeStatus,
        status: 'active' as BookingStatus,
    };

    if (!bookingData.propertyId || !bookingData.tenantId || !bookingData.startDate || !bookingData.endDate || !bookingData.amount || !bookingData.currency) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }
    
    // Explicitly remove originId if it's undefined to prevent Firestore error
    if (bookingData.originId === undefined) {
        delete (bookingData as Partial<typeof bookingData>).originId;
    }

    try {
        await dbAddBooking(bookingData);
        revalidatePathsAfterBooking(bookingData.propertyId);
        return { success: true, message: "Reserva creada correctamente." };
    } catch (dbError: any) {
        console.error("Error creating booking in DB:", dbError);
        return { success: false, message: `Error de base de datos: ${dbError.message}` };
    }
}

export async function updateBooking(previousState: any, formData: FormData): Promise<{ success: boolean; message: string; updatedBooking?: Booking; }> {
    const id = formData.get("id") as string;
    if (!id) {
        return { success: false, message: "ID de reserva no proporcionado." };
    }

    try {
        const oldBooking = await getBookingById(id);
        if (!oldBooking) {
            return { success: false, message: "No se encontró la reserva para actualizar." };
        }
        
        const originIdValue = formData.get("originId") as string;
        const updatedBookingData: Partial<Booking> = {
            id,
            propertyId: formData.get("propertyId") as string,
            tenantId: formData.get("tenantId") as string,
            startDate: formData.get("startDate") as string,
            endDate: formData.get("endDate") as string,
            amount: parseFloat(formData.get("amount") as string),
            currency: formData.get("currency") as 'USD' | 'ARS',
            notes: formData.get("notes") as string,
            contractStatus: formData.get("contractStatus") as ContractStatus,
            originId: originIdValue === 'none' ? null : originIdValue,
            guaranteeStatus: formData.get("guaranteeStatus") as GuaranteeStatus,
            guaranteeCurrency: formData.get("guaranteeCurrency") as 'USD' | 'ARS',
            status: formData.get("status") as BookingStatus,
        };

        const guaranteeAmountStr = formData.get("guaranteeAmount") as string;
        updatedBookingData.guaranteeAmount = (guaranteeAmountStr && guaranteeAmountStr !== '') ? parseFloat(guaranteeAmountStr) : null;
        
        const guaranteeReceivedDateStr = formData.get("guaranteeReceivedDate") as string;
        updatedBookingData.guaranteeReceivedDate = (guaranteeReceivedDateStr && guaranteeReceivedDateStr !== '') ? guaranteeReceivedDateStr : null;

        const guaranteeReturnedDateStr = formData.get("guaranteeReturnedDate") as string;
        updatedBookingData.guaranteeReturnedDate = (guaranteeReturnedDateStr && guaranteeReturnedDateStr !== '') ? guaranteeReturnedDateStr : null;

        if ((updatedBookingData.guaranteeStatus === 'solicited' || updatedBookingData.guaranteeStatus === 'received' || updatedBookingData.guaranteeStatus === 'returned') && !updatedBookingData.guaranteeAmount) {
            return { success: false, message: "El 'Monto' de la garantía es obligatorio para este estado." };
        }
        if (updatedBookingData.guaranteeStatus === 'received' && !updatedBookingData.guaranteeReceivedDate) {
            return { success: false, message: "La 'Fecha Recibida' es obligatoria para el estado 'Recibida'." };
        }
        if (updatedBookingData.guaranteeStatus === 'returned' && !updatedBookingData.guaranteeReturnedDate) {
            return { success: false, message: "La 'Fecha Devuelta' es obligatoria para el estado 'Devuelta'." };
        }

        const finalBookingState = { ...oldBooking, ...updatedBookingData };
        
        // Explicitly handle null for originId to avoid 'undefined'
        if (finalBookingState.originId === null) {
            finalBookingState.originId = null;
        } else if (finalBookingState.originId === undefined) {
             delete (finalBookingState as Partial<Booking>).originId;
        }
        
        const updatedBookingFromDb = await dbUpdateBooking(finalBookingState);

        revalidatePathsAfterBooking(finalBookingState.propertyId);
        return { success: true, message: "Reserva actualizada correctamente.", updatedBooking: updatedBookingFromDb };

    } catch (dbError: any) {
         console.error("Error updating booking in DB:", dbError);
         return { success: false, message: `Error de base de datos: ${dbError.message}` };
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
        await dbDeleteBooking(id);
        revalidatePathsAfterBooking(propertyId);
        return { success: true, message: "Reserva eliminada correctamente." };
    } catch (dbError: any) {
        console.error("Error deleting booking from DB:", dbError);
        return { success: false, message: `Error de base de datos: ${dbError.message}` };
    }
}

const revalidatePathsAfterBooking = (propertyId: string) => {
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath(`/api/ical/${propertyId}`);
    revalidatePath('/bookings');
    revalidatePath('/'); // Revalidate dashboard
    revalidatePath('/reports');
    revalidatePath('/payments');
    revalidatePath('/expenses');
}

const handleExpenseData = (formData: FormData) => {
    const originalAmount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const description = formData.get("description") as string;
    const exchangeRateStr = formData.get("exchangeRate") as string;
    const categoryIdValue = formData.get("categoryId") as string;

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

    expensePayload.categoryId = categoryIdValue === 'none' ? null : categoryIdValue;
    
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
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
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
        revalidatePathsAfterBooking((await getBookingById(bookingId))?.propertyId || '');
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
        revalidatePathsAfterBooking((await getBookingById(bookingId))?.propertyId || '');
        return { success: true, message: "Gasto de reserva actualizado correctamente." };
    } catch (error: any) {
        return { success: false, message: error.message || "Error al actualizar el gasto de reserva." };
    }
}

export async function deleteBookingExpense(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const bookingExpense = await db.collection('bookingExpenses').doc(id).get();
    const bookingId = bookingExpense.data()?.bookingId;

     if (!id) {
        return { success: false, message: "ID de gasto no válido." };
    }

    try {
        await dbDeleteBookingExpense(id);
        revalidatePathsAfterBooking((await getBookingById(bookingId))?.propertyId || '');
        return { success: true, message: "Gasto de reserva eliminado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
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
        await dbAddPayment(paymentPayload as Omit<Payment, 'id'>);
        revalidatePathsAfterBooking((await getBookingById(bookingId))?.propertyId || '');
        return { success: true, message: "Pago añadido correctamente." };
    } catch (error: any) {
        console.error(error)
        return { success: false, message: `Error de base de datos: ${error.message}` };
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
    
    if (paymentPayload.exchangeRate === undefined) delete paymentPayload.exchangeRate;
    if (paymentPayload.originalArsAmount === undefined) delete paymentPayload.originalArsAmount;

    try {
        await dbUpdatePayment(paymentPayload as Payment);
        revalidatePathsAfterBooking((await getBookingById(bookingId))?.propertyId || '');
        return { success: true, message: "Pago actualizado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
    }
}

export async function deletePayment(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
    if (!id) {
        return { success: false, message: "ID de pago no válido." };
    }
    
    // Fetch the payment BEFORE deleting to get the bookingId
    const paymentDoc = await db.collection('payments').doc(id).get();
    if (!paymentDoc.exists) {
        return { success: false, message: "No se encontró el pago para eliminar." };
    }
    const bookingId = paymentDoc.data()?.bookingId;

    try {
        await dbDeletePayment(id);
        if (bookingId) {
            const booking = await getBookingById(bookingId);
            if (booking) {
                revalidatePathsAfterBooking(booking.propertyId);
            }
        }
        // Fallback revalidation in case booking was already deleted
        revalidatePath('/payments');
        revalidatePath('/bookings');
        revalidatePath('/reports');
        return { success: true, message: "Pago eliminado correctamente." };
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
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
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
     revalidatePath('/expenses');
    return { success: true, message: 'Categoría actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
    await dbAddEmailTemplate({ name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
    await dbUpdateEmailTemplate({ id, name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteEmailTemplate(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de plantilla no válido.' };
  }
  try {
    await dbDeleteEmailTemplate(id);
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla eliminada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}


export async function updateEmailSettings(previousState: any, formData: FormData) {
    const replyToEmail = formData.get('replyToEmail') as string;
    
    if (replyToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToEmail)) {
        return { success: false, message: 'Por favor, introduce una dirección de email válida.' };
    }

    try {
        await dbUpdateEmailSettings({ replyToEmail });
        revalidatePath('/settings');
        return { success: true, message: 'Configuración de email guardada.' };
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
    }
}

// --- Origin Actions ---

export async function addOrigin(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const color = formData.get('color') as string;
  if (!name || !color) {
    return { success: false, message: 'El nombre y el color son obligatorios.' };
  }
  try {
    await dbAddOrigin({ name, color });
    revalidatePath('/settings');
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/reports');
    return { success: true, message: 'Origen añadido.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateOrigin(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const color = formData.get('color') as string;
  if (!id || !name || !color) {
    return { success: false, message: 'Faltan datos para actualizar el origen.' };
  }
  try {
    await dbUpdateOrigin({ id, name, color });
    revalidatePath('/settings');
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/reports');
    return { success: true, message: 'Origen actualizado.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteOrigin(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de origen no válido.' };
  }
  try {
    await dbDeleteOrigin(id);
    revalidatePath('/settings');
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/reports');
    return { success: true, message: 'Origen eliminado.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}
