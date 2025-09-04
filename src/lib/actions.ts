

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
    addExpenseCategory as dbAddExpenseCategory,
    updateExpenseCategory as dbUpdateExpenseCategory,
    deleteExpenseCategory as dbDeleteExpenseCategory,
    Tenant,
    Booking,
    PropertyExpense,
    BookingExpense,
    Payment,
    Property,
    ContractStatus,
    ExpenseCategory,
} from "./data";


export async function addProperty(previousState: any, formData: FormData) {
  const newPropertyData = {
    name: formData.get("name") as string,
    address: formData.get("address") as string,
    googleCalendarId: formData.get("googleCalendarId") as string,
    imageUrl: formData.get("imageUrl") as string,
    notes: formData.get("notes") as string || "",
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
  };

   if (!propertyData.id || !propertyData.name || !propertyData.address) {
    return { success: false, message: "Faltan datos para actualizar la propiedad." };
  }
  
  try {
    await dbUpdateProperty(propertyData);
    revalidatePath("/settings");
    revalidatePath(`/properties/${propertyData.id}`);
    revalidatePath("/properties");
    revalidatePath("/");
    return { success: true, message: "Propiedad actualizada." };
  } catch (error) {
     console.error("Error updating property:", error);
    return { success: false, message: "Error al actualizar la propiedad." };
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

    const newBooking = {
        propertyId,
        tenantId,
        startDate,
        endDate,
        amount,
        currency,
        notes,
        contractStatus: 'not_sent' as ContractStatus,
    };

    try {
        await dbAddBooking(newBooking);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/'); // Revalidate dashboard
        return { success: true, message: "Reserva creada correctamente." };
    } catch (error) {
        console.error("Error adding booking:", error);
        return { success: false, message: "Error al crear la reserva." };
    }
}

export async function updateBooking(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const propertyId = formData.get("propertyId") as string;
    const tenantId = formData.get("tenantId") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const notes = formData.get("notes") as string;
    const contractStatus = formData.get("contractStatus") as ContractStatus;

    if (!id || !propertyId || !tenantId || !startDate || !endDate || !amount || !currency) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }

    const updatedBooking: Booking = {
        id,
        propertyId,
        tenantId,
        startDate,
        endDate,
        amount,
        currency,
        notes,
        contractStatus,
    };

    try {
        await dbUpdateBooking(updatedBooking);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/'); // Revalidate dashboard
        return { success: true, message: "Reserva actualizada correctamente." };
    } catch (error) {
        return { success: false, message: "Error al actualizar la reserva." };
    }
}

export async function deleteBooking(previousState: any, formData: FormData) {
    const id = formData.get("id") as string;
    const propertyId = formData.get("propertyId") as string;

     if (!id || !propertyId) {
        return { success: false, message: "ID de reserva o propiedad no válido." };
    }

    try {
        await dbDeleteBooking(id);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        revalidatePath('/'); // Revalidate dashboard
        return { success: true, message: "Reserva eliminada correctamente." };
    } catch (error) {
        return { success: false, message: "Error al eliminar la reserva." };
    }
}


const handleExpenseData = (formData: FormData) => {
    const originalAmount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';
    const description = formData.get("description") as string;
    const exchangeRateStr = formData.get("exchangeRate") as string;
    const categoryId = formData.get("categoryId") as string | undefined;

    let amountARS = originalAmount;
    let finalDescription = description;
    let exchangeRate: number | undefined = undefined;
    let originalUsdAmount: number | undefined = undefined;

    if (currency === 'USD') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) {
            throw new Error("El valor del USD es obligatorio y debe ser mayor a cero para gastos en USD.");
        }
        exchangeRate = rate;
        amountARS = originalAmount * exchangeRate;
        originalUsdAmount = originalAmount;

        const usdFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(originalAmount);
        const rateFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(exchangeRate);
        const autoDescription = `Gasto en USD - Total: ${usdFormatted} - Valor USD: ${rateFormatted}`;
        finalDescription = description ? `${description} | ${autoDescription}` : autoDescription;
    }
    
    return {
        amount: amountARS,
        description: finalDescription,
        exchangeRate,
        originalUsdAmount,
        categoryId: categoryId || null,
    }
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

    let amountUSD = originalAmount;
    let finalDescription = description;
    let exchangeRate: number | undefined = undefined;
    let originalArsAmount: number | undefined = undefined;

    if (currency === 'ARS') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) {
            return { success: false, message: "El valor del USD es obligatorio y debe ser mayor a cero para pagos en ARS." };
        }
        exchangeRate = rate;
        amountUSD = originalAmount / exchangeRate;
        originalArsAmount = originalAmount;
        
        const arsFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(originalAmount);
        const rateFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(exchangeRate);
        const autoDescription = `El pago se realizó en ARS - Total: ${arsFormatted} - Valor USD: ${rateFormatted}`;
        finalDescription = description ? `${description} | ${autoDescription}` : autoDescription;
    }

    const newPayment = {
        bookingId,
        amount: amountUSD,
        currency: 'USD' as const,
        date,
        description: finalDescription,
        exchangeRate,
        originalArsAmount,
    };

    try {
        await dbAddPayment(newPayment as Omit<Payment, 'id'>);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
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

    let amountUSD = originalAmount;
    let finalDescription = description;
    let exchangeRate: number | undefined = undefined;
    let originalArsAmount: number | undefined = undefined;

    if (currency === 'ARS') {
        const rate = parseFloat(exchangeRateStr);
        if (!rate || rate <= 0) {
            return { success: false, message: "El valor del USD es obligatorio y debe ser mayor a cero para pagos en ARS." };
        }
        exchangeRate = rate;
        amountUSD = originalAmount / exchangeRate;
        originalArsAmount = originalAmount;

        const arsFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(originalAmount);
        const rateFormatted = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(exchangeRate);
        const autoDescription = `El pago se realizó en ARS - Total: ${arsFormatted} - Valor USD: ${rateFormatted}`;
        finalDescription = description ? `${description} | ${autoDescription}` : autoDescription;
    }

    const updatedPayment: Payment = {
        id,
        bookingId,
        amount: amountUSD,
        currency: 'USD' as const,
        date,
        description: finalDescription,
        exchangeRate,
        originalArsAmount,
    };

    try {
        await dbUpdatePayment(updatedPayment);
        revalidatePath(`/bookings`);
        revalidatePath(`/properties/*`);
        revalidatePath(`/reports`);
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
