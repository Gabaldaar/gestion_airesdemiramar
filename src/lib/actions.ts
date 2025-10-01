
'use server';

import { revalidatePath } from 'next/cache';
import {
  addTenant as dbAddTenant,
  updateTenant as dbUpdateTenant,
  deleteTenant as dbDeleteTenant,
  addBooking as dbAddBooking,
  dbUpdateBooking,
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
} from './data';
import {
  addEventToCalendar,
  deleteEventFromCalendar,
  updateEventInCalendar,
} from './google-calendar';

export async function addProperty(previousState: any, formData: FormData) {
  const newPropertyData = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    googleCalendarId: formData.get('googleCalendarId') as string,
    imageUrl: formData.get('imageUrl') as string,
    notes: (formData.get('notes') as string) || '',
    contractTemplate: (formData.get('contractTemplate') as string) || '',
    customField1Label: formData.get('customField1Label') as string,
    customField1Value: formData.get('customField1Value') as string,
    customField2Label: formData.get('customField2Label') as string,
    customField2Value: formData.get('customField2Value') as string,
    customField3Label: formData.get('customField3Label') as string,
    customField3Value: formData.get('customField3Value') as string,
    customField4Label: formData.get('customField4Label') as string,
    customField4Value: formData.get('customField4Value') as string,
    customField5Label: formData.get('customField5Label') as string,
    customField5Value: formData.get('customField5Value') as string,
    customField6Label: formData.get('customField6Label') as string,
    customField6Value: formData.get('customField6Value') as string,
  };

  if (!newPropertyData.name || !newPropertyData.address) {
    return {
      success: false,
      message: 'El nombre y la dirección son obligatorios.',
    };
  }

  try {
    await dbAddProperty(newPropertyData);
    revalidatePath('/settings');
    revalidatePath('/properties');
    revalidatePath('/');
    return { success: true, message: 'Propiedad añadida correctamente.' };
  } catch (error) {
    console.error('Error adding property:', error);
    return { success: false, message: 'Error al añadir la propiedad.' };
  }
}

export async function updateProperty(previousState: any, formData: FormData) {
  const propertyData: Property = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    googleCalendarId: formData.get('googleCalendarId') as string,
    imageUrl: formData.get('imageUrl') as string,
    notes: formData.get('notes') as string,
    contractTemplate: formData.get('contractTemplate') as string,
    customField1Label: formData.get('customField1Label') as string,
    customField1Value: formData.get('customField1Value') as string,
    customField2Label: formData.get('customField2Label') as string,
    customField2Value: formData.get('customField2Value') as string,
    customField3Label: formData.get('customField3Label') as string,
    customField3Value: formData.get('customField3Value') as string,
    customField4Label: formData.get('customField4Label') as string,
    customField4Value: formData.get('customField4Value') as string,
    customField5Label: formData.get('customField5Label') as string,
    customField5Value: formData.get('customField5Value') as string,
    customField6Label: formData.get('customField6Label') as string,
    customField6Value: formData.get('customField6Value') as string,
  };

  if (!propertyData.id || !propertyData.name || !propertyData.address) {
    return {
      success: false,
      message: 'Faltan datos para actualizar la propiedad.',
    };
  }

  try {
    await dbUpdateProperty(propertyData);
    revalidatePath('/settings');
    revalidatePath('/properties');
    revalidatePath(`/properties/${propertyData.id}`);
    revalidatePath('/');
    revalidatePath('/bookings');
    revalidatePath('/expenses');
    revalidatePath('/payments');
    revalidatePath('/reports');
    return { success: true, message: 'Propiedad actualizada.' };
  } catch (error) {
    console.error('Error updating property:', error);
    return { success: false, message: 'Error al actualizar la propiedad.' };
  }
}

export async function deleteProperty(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const confirmation = formData.get('confirmation') as string;

  if (!id) {
    return { success: false, message: 'ID de propiedad no válido.' };
  }

  if (confirmation !== 'Eliminar') {
    return { success: false, message: 'La confirmación no es correcta.' };
  }

  try {
    await dbDeleteProperty(id);
    revalidatePath('/settings');
    revalidatePath('/properties');
    revalidatePath('/');
    revalidatePath('/bookings');
    revalidatePath('/expenses');
    revalidatePath('/payments');
    revalidatePath('/reports');
    return { success: true, message: 'Propiedad eliminada correctamente.' };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, message: 'Error al eliminar la propiedad.' };
  }
}

export async function addTenant(previousState: any, formData: FormData) {
  const newTenant: Omit<Tenant, 'id'> = {
    name: formData.get('name') as string,
    dni: formData.get('dni') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    country: (formData.get('country') as string) || 'Argentina',
    notes: (formData.get('notes') as string) || '',
    originId:
      formData.get('originId') === 'none'
        ? undefined
        : (formData.get('originId') as string),
  };

  try {
    await dbAddTenant(newTenant);
    revalidatePath('/tenants');
    return { success: true, message: 'Inquilino añadido correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al añadir inquilino.' };
  }
}

export async function updateTenant(previousState: any, formData: FormData) {
  const updatedTenant: Tenant = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    dni: formData.get('dni') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    country: formData.get('country') as string,
    notes: formData.get('notes') as string,
    originId:
      formData.get('originId') === 'none'
        ? undefined
        : (formData.get('originId') as string),
  };

  try {
    await dbUpdateTenant(updatedTenant);
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/');
    return { success: true, message: 'Inquilino actualizado correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar inquilino.' };
  }
}

export async function deleteTenant(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID de inquilino no válido.' };
  }

  try {
    await dbDeleteTenant(id);
    revalidatePath('/tenants');
    return { success: true, message: 'Inquilino eliminado correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el inquilino.' };
  }
}

export async function addBooking(previousState: any, formData: FormData) {
  const amountStr = formData.get('amount') as string;
  const bookingData: Omit<Booking, 'id' | 'googleCalendarEventId'> = {
    propertyId: formData.get('propertyId') as string,
    tenantId: formData.get('tenantId') as string,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
    amount: amountStr ? parseFloat(amountStr) : 0,
    currency: (formData.get('currency') as 'USD' | 'ARS') || 'USD',
    notes: (formData.get('notes') as string) || '',
    originId:
      formData.get('originId') === 'none'
        ? undefined
        : (formData.get('originId') as string),
    contractStatus: 'not_sent',
    guaranteeStatus: 'not_solicited',
  };

  if (
    !bookingData.propertyId ||
    !bookingData.tenantId ||
    !bookingData.startDate ||
    !bookingData.endDate ||
    isNaN(bookingData.amount)
  ) {
    return {
      success: false,
      message: 'Datos de la reserva incompletos o inválidos.',
    };
  }

  try {
    const newBooking = await dbAddBooking(bookingData);

    const [property, tenant] = await Promise.all([
      getPropertyById(newBooking.propertyId),
      getTenantById(newBooking.tenantId),
    ]);

    if (property?.googleCalendarId && tenant) {
        const eventDetails = {
          startDate: newBooking.startDate,
          endDate: newBooking.endDate,
          tenantName: tenant.name,
          propertyName: property.name,
          notes: newBooking.notes,
        };
        const eventId = await addEventToCalendar(
          property.googleCalendarId,
          eventDetails
        );
        if (eventId) {
          await dbUpdateBooking({ id: newBooking.id, googleCalendarEventId: eventId });
        }
    }

    revalidatePath(`/properties/${newBooking.propertyId}`);
    revalidatePath('/bookings');
    revalidatePath('/');
    return { success: true, message: 'Reserva creada correctamente.' };
  } catch (dbError) {
    console.error('Error creating booking in DB:', dbError);
    return {
      success: false,
      message: 'Error al guardar la reserva en la base de datos.',
    };
  }
}

export async function updateBooking(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de reserva no proporcionado.' };
  }

  const oldBooking = await getBookingById(id);
  if (!oldBooking) {
    return {
      success: false,
      message: 'No se encontró la reserva para actualizar.',
    };
  }
  
  const amountStr = formData.get('amount') as string;
  const guaranteeAmountStr = formData.get('guaranteeAmount') as string;

  const dataToUpdate: Partial<Booking> = { id };

  // Explicitly check and add each field from formData
  if (formData.has('propertyId')) dataToUpdate.propertyId = formData.get('propertyId') as string;
  if (formData.has('tenantId')) dataToUpdate.tenantId = formData.get('tenantId') as string;
  if (formData.has('startDate')) dataToUpdate.startDate = formData.get('startDate') as string;
  if (formData.has('endDate')) dataToUpdate.endDate = formData.get('endDate') as string;
  if (amountStr) dataToUpdate.amount = parseFloat(amountStr);
  if (formData.has('currency')) dataToUpdate.currency = formData.get('currency') as 'USD' | 'ARS';
  if (formData.has('notes')) dataToUpdate.notes = formData.get('notes') as string;
  if (formData.has('contractStatus')) dataToUpdate.contractStatus = formData.get('contractStatus') as ContractStatus;
  if (formData.has('googleCalendarEventId')) dataToUpdate.googleCalendarEventId = formData.get('googleCalendarEventId') as string;
  
  const originId = formData.get('originId');
  dataToUpdate.originId = originId === 'none' ? null : originId as string;
  
  if (formData.has('guaranteeStatus')) dataToUpdate.guaranteeStatus = formData.get('guaranteeStatus') as GuaranteeStatus;
  if (guaranteeAmountStr) dataToUpdate.guaranteeAmount = parseFloat(guaranteeAmountStr);
  if (formData.has('guaranteeCurrency')) dataToUpdate.guaranteeCurrency = formData.get('guaranteeCurrency') as 'USD' | 'ARS';
  
  const receivedDate = formData.get('guaranteeReceivedDate');
  dataToUpdate.guaranteeReceivedDate = receivedDate ? receivedDate as string : null;

  const returnedDate = formData.get('guaranteeReturnedDate');
  dataToUpdate.guaranteeReturnedDate = returnedDate ? returnedDate as string : null;


  try {
    const updatedBooking = await dbUpdateBooking(dataToUpdate);
    if (!updatedBooking) {
      throw new Error('Database update returned null');
    }

    // --- Calendar Synchronization ---
    const [newProperty, oldProperty, tenant] = await Promise.all([
        getPropertyById(updatedBooking.propertyId),
        getPropertyById(oldBooking.propertyId),
        getTenantById(updatedBooking.tenantId)
    ]);
    
    const eventDetails = {
        startDate: updatedBooking.startDate,
        endDate: updatedBooking.endDate,
        tenantName: tenant?.name || 'N/A',
        propertyName: newProperty?.name || 'N/A',
        notes: updatedBooking.notes,
    };

    const propertyChanged = oldProperty?.id !== newProperty?.id;

    if (propertyChanged) {
        // Delete from old calendar if it exists
        if (oldProperty?.googleCalendarId && oldBooking.googleCalendarEventId) {
            await deleteEventFromCalendar(oldProperty.googleCalendarId, oldBooking.googleCalendarEventId);
        }
        // Add to new calendar if it exists
        if (newProperty?.googleCalendarId) {
            const newEventId = await addEventToCalendar(newProperty.googleCalendarId, eventDetails);
            await dbUpdateBooking({ id: updatedBooking.id, googleCalendarEventId: newEventId });
        }
    } else if (newProperty?.googleCalendarId) { // Property is the same, calendar exists
        if (updatedBooking.googleCalendarEventId) {
            // Update existing event
            await updateEventInCalendar(newProperty.googleCalendarId, updatedBooking.googleCalendarEventId, eventDetails);
        } else {
            // Event didn't exist before, create it
            const newEventId = await addEventToCalendar(newProperty.googleCalendarId, eventDetails);
            await dbUpdateBooking({ id: updatedBooking.id, googleCalendarEventId: newEventId });
        }
    } else if (oldBooking.googleCalendarEventId && oldProperty?.googleCalendarId) {
        // Calendar was removed from property, delete old event
        await deleteEventFromCalendar(oldProperty.googleCalendarId, oldBooking.googleCalendarEventId);
        await dbUpdateBooking({ id: updatedBooking.id, googleCalendarEventId: null });
    }

    revalidatePath(`/properties/${updatedBooking.propertyId}`);
    revalidatePath('/bookings');
    revalidatePath('/');
    return { success: true, message: 'Reserva actualizada correctamente.' };
  } catch (dbError) {
    console.error('Error updating booking:', dbError);
    return {
      success: false,
      message: 'Error al actualizar la reserva en la base de datos.',
    };
  }
}

export async function deleteBooking(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const propertyId = formData.get('propertyId') as string;
  const confirmation = formData.get('confirmation') as string;

  if (!id || !propertyId) {
    return { success: false, message: 'ID de reserva o propiedad no válido.' };
  }

  if (confirmation !== 'Eliminar') {
    return { success: false, message: 'La confirmación no es correcta.' };
  }

  try {
    const bookingToDelete = await getBookingById(id);

    if (bookingToDelete && bookingToDelete.googleCalendarEventId) {
      try {
        const property = await getPropertyById(bookingToDelete.propertyId);
        if (property && property.googleCalendarId) {
          await deleteEventFromCalendar(
            property.googleCalendarId,
            bookingToDelete.googleCalendarEventId
          );
        }
      } catch (calendarError) {
        console.error(
          `Failed to delete calendar event for booking ${id}, but deleting booking from DB anyway:`,
          calendarError
        );
      }
    }

    await dbDeleteBooking(id);

    revalidatePath(`/properties/${propertyId}`);
    revalidatePath('/bookings');
    revalidatePath('/');
    return { success: true, message: 'Reserva eliminada correctamente.' };
  } catch (dbError) {
    console.error('Error deleting booking from DB:', dbError);
    return {
      success: false,
      message: 'Error al eliminar la reserva de la base de datos.',
    };
  }
}

const handleExpenseData = (formData: FormData) => {
  const originalAmountStr = formData.get('amount') as string;
  const originalAmount = originalAmountStr ? parseFloat(originalAmountStr) : 0;
  
  const currency = formData.get('currency') as 'USD' | 'ARS';
  const description = formData.get('description') as string;
  const exchangeRateStr = formData.get('exchangeRate') as string;
  const categoryId = formData.get('categoryId') as string;

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
    const rate = exchangeRateStr ? parseFloat(exchangeRateStr) : 0;
    if (!rate || rate <= 0) {
      throw new Error(
        'El valor del USD es obligatorio y debe ser mayor a cero para gastos en USD.'
      );
    }
    expensePayload.exchangeRate = rate;
    expensePayload.amount = originalAmount * expensePayload.exchangeRate; // This is now amount in ARS
    expensePayload.originalUsdAmount = originalAmount;

    const usdFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(originalAmount);
    const rateFormatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(expensePayload.exchangeRate);
    const autoDescription = `Gasto en USD - Total: ${usdFormatted} - Valor USD: ${rateFormatted}`;
    expensePayload.description = description
      ? `${description} | ${autoDescription}`
      : autoDescription;
  }

  if (categoryId && categoryId !== 'none') {
    expensePayload.categoryId = categoryId;
  } else {
    expensePayload.categoryId = null;
  }

  return expensePayload;
};

export async function addPropertyExpense(previousState: any, formData: FormData) {
  try {
    const propertyId = formData.get('propertyId') as string;
    const date = formData.get('date') as string;

    if (!propertyId || !date) {
      return {
        success: false,
        message: 'La propiedad y la fecha son obligatorias.',
      };
    }

    const expenseData = handleExpenseData(formData);
    const newExpense = {
      propertyId,
      date,
      ...expenseData,
    };

    await dbAddPropertyExpense(newExpense as Omit<PropertyExpense, 'id'>);
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath('/reports');
    revalidatePath('/expenses');
    return { success: true, message: 'Gasto añadido correctamente.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al añadir el gasto.' };
  }
}

export async function updatePropertyExpense(
  previousState: any,
  formData: FormData
) {
  try {
    const id = formData.get('id') as string;
    const propertyId = formData.get('propertyId') as string;
    const date = formData.get('date') as string;

    if (!id || !propertyId || !date) {
      return { success: false, message: 'Faltan datos para actualizar el gasto.' };
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
    return { success: true, message: 'Gasto actualizado correctamente.' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al actualizar el gasto.',
    };
  }
}

export async function deletePropertyExpense(
  previousState: any,
  formData: FormData
) {
  const id = formData.get('id') as string;
  const propertyId = formData.get('propertyId') as string;

  if (!id || !propertyId) {
    return { success: false, message: 'ID de gasto o propiedad no válido.' };
  }

  try {
    await dbDeletePropertyExpense(id);
    revalidatePath(`/properties/${propertyId}`);
    revalidatePath('/reports');
    revalidatePath('/expenses');
    return { success: true, message: 'Gasto eliminado correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el gasto.' };
  }
}

export async function addBookingExpense(previousState: any, formData: FormData) {
  try {
    const bookingId = formData.get('bookingId') as string;
    const date = formData.get('date') as string;

    if (!bookingId || !date) {
      return {
        success: false,
        message: 'La reserva y la fecha son obligatorias.',
      };
    }

    const expenseData = handleExpenseData(formData);
    const newExpense = {
      bookingId,
      date,
      ...expenseData,
    };

    await dbAddBookingExpense(newExpense as Omit<BookingExpense, 'id'>);
    revalidatePath(`/bookings`);
    revalidatePath(`/properties/*`);
    revalidatePath('/reports');
    revalidatePath('/expenses');
    return { success: true, message: 'Gasto de reserva añadido correctamente.' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al añadir el gasto de reserva.',
    };
  }
}

export async function updateBookingExpense(
  previousState: any,
  formData: FormData
) {
  try {
    const id = formData.get('id') as string;
    const bookingId = formData.get('bookingId') as string;
    const date = formData.get('date') as string;

    if (!id || !bookingId || !date) {
      return { success: false, message: 'Faltan datos para actualizar el gasto.' };
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
    return { success: true, message: 'Gasto de reserva actualizado correctamente.' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al actualizar el gasto de reserva.',
    };
  }
}

export async function deleteBookingExpense(
  previousState: any,
  formData: FormData
) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID de gasto no válido.' };
  }

  try {
    await dbDeleteBookingExpense(id);
    revalidatePath(`/bookings`);
    revalidatePath(`/properties/*`);
    revalidatePath('/reports');
    revalidatePath('/expenses');
    return { success: true, message: 'Gasto de reserva eliminado correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el gasto de reserva.' };
  }
}

export async function addPayment(previousState: any, formData: FormData) {
  const bookingId = formData.get('bookingId') as string;
  const originalAmountStr = formData.get('amount') as string;
  const originalAmount = originalAmountStr ? parseFloat(originalAmountStr) : 0;
  
  const currency = formData.get('currency') as 'USD' | 'ARS';
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const exchangeRateStr = formData.get('exchangeRate') as string;

  if (!bookingId || !originalAmount || !currency || !date) {
    return { success: false, message: 'Todos los campos son obligatorios.' };
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
    const rate = exchangeRateStr ? parseFloat(exchangeRateStr) : 0;
    if (!rate || rate <= 0) {
      return {
        success: false,
        message:
          'El valor del USD es obligatorio y debe ser mayor a cero para pagos en ARS.',
      };
    }
    paymentPayload.exchangeRate = rate;
    paymentPayload.amount = originalAmount / paymentPayload.exchangeRate;
    paymentPayload.originalArsAmount = originalAmount;

    const arsFormatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(originalAmount);
    const rateFormatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(paymentPayload.exchangeRate);
    const autoDescription = `El pago se realizó en ARS - Total: ${arsFormatted} - Valor USD: ${rateFormatted}`;
    paymentPayload.description = description
      ? `${description} | ${autoDescription}`
      : autoDescription;
  }

  try {
    await dbAddPayment(paymentPayload as Omit<Payment, 'id'>);
    revalidatePath(`/bookings`);
    revalidatePath(`/properties/*`);
    revalidatePath(`/reports`);
    revalidatePath(`/payments`);
    return { success: true, message: 'Pago añadido correctamente.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Error al añadir el pago.' };
  }
}

export async function updatePayment(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const bookingId = formData.get('bookingId') as string;
  const originalAmountStr = formData.get('amount') as string;
  const originalAmount = originalAmountStr ? parseFloat(originalAmountStr) : 0;
  
  const currency = formData.get('currency') as 'USD' | 'ARS';
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const exchangeRateStr = formData.get('exchangeRate') as string;

  if (!id || !bookingId || !originalAmount || !currency || !date) {
    return { success: false, message: 'Todos los campos son obligatorios.' };
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
    description,
  };

  if (currency === 'ARS') {
    const rate = exchangeRateStr ? parseFloat(exchangeRateStr) : 0;
    if (!rate || rate <= 0) {
      return {
        success: false,
        message:
          'El valor del USD es obligatorio y debe ser mayor a cero para pagos en ARS.',
      };
    }
    paymentPayload.exchangeRate = rate;
    paymentPayload.amount = originalAmount / paymentPayload.exchangeRate;
    paymentPayload.originalArsAmount = originalAmount;

    const arsFormatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(originalAmount);
    const rateFormatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(paymentPayload.exchangeRate);
    const autoDescription = `El pago se realizó en ARS - Total: ${arsFormatted} - Valor USD: ${rateFormatted}`;
    paymentPayload.description = description
      ? `${description} | ${autoDescription}`
      : autoDescription;
  }

  try {
    await dbUpdatePayment(paymentPayload as Payment);
    revalidatePath(`/bookings`);
    revalidatePath(`/properties/*`);
    revalidatePath(`/reports`);
    revalidatePath(`/payments`);
    return { success: true, message: 'Pago actualizado correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar el pago.' };
  }
}

export async function deletePayment(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID de pago no válido.' };
  }

  try {
    await dbDeletePayment(id);
    revalidatePath(`/bookings`);
    revalidatePath(`/properties/*`);
    revalidatePath(`/reports`);
    revalidatePath(`/payments`);
    return { success: true, message: 'Pago eliminado correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el pago.' };
  }
}

export async function addExpenseCategory(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) {
    return {
      success: false,
      message: 'El nombre de la categoría es obligatorio.',
    };
  }
  try {
    await dbAddExpenseCategory({ name });
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría añadida.' };
  } catch (error) {
    return { success: false, message: 'Error al añadir la categoría.' };
  }
}

export async function updateExpenseCategory(
  previousState: any,
  formData: FormData
) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  if (!id || !name) {
    return {
      success: false,
      message: 'Faltan datos para actualizar la categoría.',
    };
  }
  try {
    await dbUpdateExpenseCategory({ id, name });
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría actualizada.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar la categoría.' };
  }
}

export async function deleteExpenseCategory(
  previousState: any,
  formData: FormData
) {
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
  } catch (error) {
    return { success: false, message: 'Error al añadir la plantilla.' };
  }
}

export async function updateEmailTemplate(
  previousState: any,
  formData: FormData
) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const subject = formData.get('subject') as string;
  const body = formData.get('body') as string;

  if (!id || !name || !subject || !body) {
    return {
      success: false,
      message: 'Faltan datos para actualizar la plantilla.',
    };
  }
  try {
    await dbUpdateEmailTemplate({ id, name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla actualizada.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar la plantilla.' };
  }
}

export async function deleteEmailTemplate(
  previousState: any,
  formData: FormData
) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de plantilla no válido.' };
  }
  try {
    await dbDeleteEmailTemplate(id);
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla eliminada.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar la plantilla.' };
  }
}

export async function updateEmailSettings(
  previousState: any,
  formData: FormData
) {
  const replyToEmail = formData.get('replyToEmail') as string;

  // Basic email validation
  if (replyToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToEmail)) {
    return {
      success: false,
      message: 'Por favor, introduce una dirección de email válida.',
    };
  }

  try {
    await dbUpdateEmailSettings({ replyToEmail });
    revalidatePath('/settings');
    return { success: true, message: 'Configuración de email guardada.' };
  } catch (error) {
    return {
      success: false,
      message: 'Error al guardar la configuración de email.',
    };
  }
}

// --- Origin Actions ---

export async function addOrigin(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const color = formData.get('color') as string;
  if (!name || !color) {
    return {
      success: false,
      message: 'El nombre y el color son obligatorios.',
    };
  }
  try {
    await dbAddOrigin({ name, color });
    revalidatePath('/settings');
    revalidatePath('/tenants');
    return { success: true, message: 'Origen añadido.' };
  } catch (error) {
    return { success: false, message: 'Error al añadir el origen.' };
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
    return { success: true, message: 'Origen actualizado.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar el origen.' };
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
    return { success: true, message: 'Origen eliminado.' };
  } catch (error) {
    return { success: false, message: 'Error al eliminar el origen.' };
  }
}

    