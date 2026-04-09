

'use server';

import { revalidatePath } from 'next/cache';
import {
  addTenantDb,
  updateTenantDb,
  deleteTenantDb,
  addBookingDb,
  updateBookingDb,
  deleteBookingDb,
  addExpenseDb,
  updateExpenseDb,
  deleteExpenseDb,
  addPaymentDb,
  updatePaymentDb,
  deletePaymentDb,
  addPropertyDb,
  updatePropertyDb,
  deletePropertyDb,
  addExpenseCategoryDb,
  updateExpenseCategoryDb,
  deleteExpenseCategoryDb,
  addEmailTemplateDb,
  updateEmailTemplateDb,
  deleteEmailTemplateDb,
  updateEmailSettingsDb,
  updateAlertSettingsDb,
  addOriginDb,
  updateOriginDb,
  deleteOriginDb,
  savePushSubscriptionDb,
  addTaskDb,
  updateTaskDb,
  deleteTaskDb,
  addTaskCategoryDb,
  updateTaskCategoryDb,
  deleteTaskCategoryDb,
  addProviderDb,
  updateProviderDb,
  deleteProviderDb,
  addProviderCategoryDb,
  updateProviderCategoryDb,
  deleteProviderCategoryDb,
  getBookingById,
  getPropertyById,
  getTenantById,
  updateTenantPartial,
  updateProviderPartial,
  getProviderById,
  // New scope functions
  addTaskScopeDb,
  updateTaskScopeDb,
  deleteTaskScopeDb,
  reassignTaskExpenses,
  addDateBlockDb,
  updateDateBlockDb,
  deleteDateBlockDb,
  // New liquidation functions
  addWorkLogDb,
  addManualAdjustmentDb,
  getLiquidationById,
  updateLiquidationDb,
  updateWorkLogDb,
  deleteWorkLogDb,
  updateManualAdjustmentDb,
  deleteManualAdjustmentDb,
  revertLiquidationDb,
  addLiquidationPaymentDb,
  getProviderByEmail,
  addAdjustmentCategoryDb,
  updateAdjustmentCategoryDb,
  deleteAdjustmentCategoryDb,
  getAdjustmentCategories,
  Tenant,
  Booking,
  Expense,
  Payment,
  Property,
  ContractStatus,
  ExpenseCategory,
  GuaranteeStatus,
  EmailTemplate,
  BookingStatus,
  Task,
  TaskCategory,
  TaskStatus,
  TaskPriority,
  Provider,
  ProviderCategory,
  ProviderManagementType,
  ProviderBillingType,
  TaskAssignment,
  DateBlock,
  WorkLog,
  ManualAdjustment,
  Liquidation,
  UserStatus,
  UserRole,
} from './data';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, setDoc, addDoc, Timestamp, documentId } from 'firebase/firestore';

// Define the payload for the finance API registration
export interface RegistrarCobroPayload {
    fecha: string;                   // ISO 8601
    monto: number;
    moneda: 'ARS' | 'USD';
    monto_usd?: number;              // Optional for ARS payments
    tasa_cambio?: number;            // Optional for ARS payments
    categoria_id: string;
    cuenta_id: string;
    billetera_id: string;
    descripcion: string;
    id_externo?: string;
}


const revalidatePathsAfterAction = (propertyId?: string | null) => {
  revalidatePath('/bookings');
  revalidatePath('/'); // Revalidate dashboard
  revalidatePath('/reports');
  revalidatePath('/informes');
  revalidatePath('/payments');
  revalidatePath('/expenses');
  revalidatePath('/tasks');
  revalidatePath('/providers');
  revalidatePath('/liquidations');
  if (propertyId) {
      revalidatePath(`/properties/${propertyId}`);
      revalidatePath(`/api/ical/${propertyId}`);
  }
};


export async function registrarCobro(payload: RegistrarCobroPayload) {
  // This is the API Key for the external finance app
  const FINANCE_API_KEY = 'x9TlCh8316O6lFtc2QAUstoszhMi5ngW'; 
  const API_BASE_URL = 'https://gestionomiscuentas.netlify.app';
  const apiUrl = `${API_BASE_URL}/api/registrar-cobro`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FINANCE_API_KEY}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        responseData.error || `Error ${response.status} al registrar el pago.`
      );
    }

    return responseData;
  } catch (error) {
    console.error('[API Error - registrarCobro]:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'Un error desconocido ocurrió al registrar el pago.',
    };
  }
}

export async function addProperty(previousState: any, formData: FormData) {
  const visitRates: { [key: string]: number } = {};
  for (const [key, value] of formData.entries()) {
      if (key.startsWith('visitRate_') && value) {
          const providerId = key.replace('visitRate_', '');
          const rate = parseFloat(value as string);
          if (!isNaN(rate) && rate > 0) {
              visitRates[providerId] = rate;
          }
      }
  }

  const newPropertyData = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    imageUrl: formData.get('imageUrl') as string,
    propertyUrl: formData.get('propertyUrl') as string,
    priceSheetName: formData.get('priceSheetName') as string,
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
    visitRates,
  };

  if (!newPropertyData.name || !newPropertyData.address) {
    return {
      success: false,
      message: 'El nombre y la dirección son obligatorios.',
    };
  }

  try {
    await addPropertyDb(newPropertyData);
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
  const visitRates: { [key: string]: number } = {};
  for (const [key, value] of formData.entries()) {
      if (key.startsWith('visitRate_') && value) {
          const providerId = key.replace('visitRate_', '');
          const rate = parseFloat(value as string);
          if (!isNaN(rate) && rate >= 0) { // Allow 0 to unset
              visitRates[providerId] = rate;
          }
      }
  }

  const propertyData: Omit<Property, 'googleCalendarId'> = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    imageUrl: formData.get('imageUrl') as string,
    propertyUrl: formData.get('propertyUrl') as string,
    priceSheetName: formData.get('priceSheetName') as string,
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
    visitRates,
  };

  if (!propertyData.id || !propertyData.name || !propertyData.address) {
    return {
      success: false,
      message: 'Faltan datos para actualizar la propiedad.',
    };
  }

  try {
    await updatePropertyDb(propertyData);
    revalidatePath('/settings');
    revalidatePath('/properties');
    revalidatePath(`/properties/${propertyData.id}`);
    revalidatePath(`/api/ical/${propertyData.id}`);
    revalidatePath('/');
    revalidatePath('/bookings');
    revalidatePath('/expenses');
    revalidatePath('/payments');
    revalidatePath('/reports');
    revalidatePath('/informes');
    return { success: true, message: 'Propiedad actualizada.' };
  } catch (error) {
    console.error('Error updating property:', error);
    return { success: false, message: 'Error al actualizar la propiedad.' };
  }
}

export async function deleteProperty(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID de propiedad no válido.' };
  }

  try {
    await deletePropertyDb(id);
    revalidatePath('/settings');
    revalidatePath('/properties');
    revalidatePath('/');
    revalidatePath('/bookings');
    revalidatePath('/expenses');
    revalidatePath('/payments');
    revalidatePath('/reports');
    revalidatePath('/informes');
    return { success: true, message: 'Propiedad eliminada correctamente.' };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, message: 'Error al eliminar la propiedad.' };
  }
}

export async function addTenant(previousState: any, formData: FormData) {
  const originIdValue = formData.get('originId') as string;
  const ratingStr = formData.get('rating') as string;
  const rating = ratingStr ? parseInt(ratingStr, 10) : 0;

  const newTenant: Omit<Tenant, 'id'> = {
    name: formData.get('name') as string,
    dni: formData.get('dni') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    countryCode: formData.get('countryCode') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    country: (formData.get('country') as string) || 'Argentina',
    notes: (formData.get('notes') as string) || '',
    originId: originIdValue === 'none' ? undefined : originIdValue,
    rating: !isNaN(rating) ? rating : 0,
  };

  try {
    await addTenantDb(newTenant);
    revalidatePath('/tenants');
    revalidatePath('/reports');
    revalidatePath('/informes');
    return { success: true, message: 'Inquilino añadido correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateTenant(previousState: any, formData: FormData) {
  const originIdValue = formData.get('originId') as string;
  const ratingStr = formData.get('rating') as string;
  const rating = ratingStr ? parseInt(ratingStr, 10) : 0;
  
  const updatedTenant: Tenant = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    dni: formData.get('dni') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    countryCode: formData.get('countryCode') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    country: formData.get('country') as string,
    notes: formData.get('notes') as string,
    originId: originIdValue === 'none' ? null : originIdValue,
    rating: !isNaN(rating) ? rating : 0,
  };

  try {
    await updateTenantDb(updatedTenant);
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/');
    revalidatePath('/reports');
    revalidatePath('/informes');
    return { success: true, message: 'Inquilino actualizado correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteTenant(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID de inquilino no válido.' };
  }

  try {
    await deleteTenantDb(id);
    revalidatePath('/tenants');
    revalidatePath('/reports');
    revalidatePath('/informes');
    return { success: true, message: 'Inquilino eliminado correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function addBooking(previousState: any, formData: FormData) {
  const originIdValue = formData.get('originId') as string;
  const bookingData = {
    propertyId: formData.get('propertyId') as string,
    tenantId: formData.get('tenantId') as string,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: formData.get('currency') as 'USD' | 'ARS',
    notes: (formData.get('notes') as string) || '',
    originId: originIdValue === 'none' ? undefined : originIdValue,
    contractStatus: 'not_sent' as ContractStatus,
    guaranteeStatus: 'not_solicited' as GuaranteeStatus,
    status: 'active' as BookingStatus,
  };

  if (
    !bookingData.propertyId ||
    !bookingData.tenantId ||
    !bookingData.startDate ||
    !bookingData.endDate ||
    !bookingData.amount ||
    !bookingData.currency
  ) {
    return { success: false, message: 'Todos los campos son obligatorios.' };
  }

  // Explicitly remove originId if it's undefined to prevent Firestore error
  if (bookingData.originId === undefined) {
    delete (bookingData as Partial<typeof bookingData>).originId;
  }

  try {
    await addBookingDb(bookingData);
    revalidatePathsAfterAction(bookingData.propertyId);
    return { success: true, message: 'Reserva creada correctamente.' };
  } catch (dbError: any) {
    console.error('Error creating booking in DB:', dbError);
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}

export async function updateBooking(
  previousState: any,
  formData: FormData
): Promise<{ success: boolean; message: string; updatedBooking?: Booking }> {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de reserva no proporcionado.' };
  }

  try {
    const oldBooking = await getBookingById(id);
    if (!oldBooking) {
      return {
        success: false,
        message: 'No se encontró la reserva para actualizar.',
      };
    }

    const originIdValue = formData.get('originId') as string;
    const updatedBookingData: Partial<Booking> = {
      id,
      propertyId: formData.get('propertyId') as string,
      tenantId: formData.get('tenantId') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      amount: parseFloat(formData.get('amount') as string),
      currency: formData.get('currency') as 'USD' | 'ARS',
      notes: formData.get('notes') as string,
      contractStatus: formData.get('contractStatus') as ContractStatus,
      originId: originIdValue === 'none' ? null : originIdValue,
      guaranteeStatus: formData.get('guaranteeStatus') as GuaranteeStatus,
      guaranteeCurrency: formData.get('guaranteeCurrency') as 'USD' | 'ARS',
      status: formData.get('status') as BookingStatus,
    };

    const guaranteeAmountStr = formData.get('guaranteeAmount') as string;
    updatedBookingData.guaranteeAmount =
      guaranteeAmountStr && guaranteeAmountStr !== ''
        ? parseFloat(guaranteeAmountStr)
        : 0;

    const guaranteeReceivedDateStr = formData.get(
      'guaranteeReceivedDate'
    ) as string;
    updatedBookingData.guaranteeReceivedDate =
      guaranteeReceivedDateStr && guaranteeReceivedDateStr !== ''
        ? guaranteeReceivedDateStr
        : null;

    const guaranteeReturnedDateStr = formData.get(
      'guaranteeReturnedDate'
    ) as string;
    updatedBookingData.guaranteeReturnedDate =
      guaranteeReturnedDateStr && guaranteeReturnedDateStr !== ''
        ? guaranteeReturnedDateStr
        : null;

    if (
      (updatedBookingData.guaranteeStatus === 'solicited' ||
        updatedBookingData.guaranteeStatus === 'received' ||
        updatedBookingData.guaranteeStatus === 'returned') &&
      (!updatedBookingData.guaranteeAmount ||
        updatedBookingData.guaranteeAmount <= 0)
    ) {
      return {
        success: false,
        message:
          "El 'Monto' de la garantía es obligatorio para este estado y debe ser mayor que cero.",
      };
    }
    if (
      updatedBookingData.guaranteeStatus === 'received' &&
      !updatedBookingData.guaranteeReceivedDate
    ) {
      return {
        success: false,
        message:
          "La 'Fecha Recibida' es obligatoria para el estado 'Recibida'.",
      };
    }
    if (
      updatedBookingData.guaranteeStatus === 'returned' &&
      !updatedBookingData.guaranteeReturnedDate
    ) {
      return {
        success: false,
        message:
          "La 'Fecha Devuelta' es obligatoria para el estado 'Devuelta'.",
      };
    }

    const finalBookingState = { ...oldBooking, ...updatedBookingData };

    // Explicitly handle null for originId to avoid 'undefined'
    if (finalBookingState.originId === null) {
      finalBookingState.originId = null;
    } else if (finalBookingState.originId === undefined) {
      delete (finalBookingState as Partial<Booking>).originId;
    }

    const updatedBookingFromDb = await updateBookingDb(finalBookingState);

    revalidatePathsAfterAction(finalBookingState.propertyId);
    return {
      success: true,
      message: 'Reserva actualizada correctamente.',
      updatedBooking: updatedBookingFromDb,
    };
  } catch (dbError: any) {
    console.error('Error updating booking in DB:', dbError);
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}

export async function deleteBooking(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const propertyId = formData.get('propertyId') as string;

  if (!id || !propertyId) {
    return { success: false, message: 'ID de reserva o propiedad no válido.' };
  }

  try {
    await deleteBookingDb(id);
    revalidatePathsAfterAction(propertyId);
    return { success: true, message: 'Reserva eliminada correctamente.' };
  } catch (dbError: any) {
    console.error('Error deleting booking from DB:', dbError);
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}

const handleExpenseData = (formData: FormData) => {
  const originalAmount = parseFloat(formData.get('amount') as string);
  const currency = formData.get('currency') as 'USD' | 'ARS';
  const description = formData.get('description') as string;
  const exchangeRateStr = formData.get('exchangeRate') as string;
  const categoryIdValue = formData.get('categoryId') as string;
  const providerIdValue = formData.get('providerId') as string;

  const expensePayload: {
    amount: number;
    description: string;
    exchangeRate?: number;
    originalUsdAmount?: number;
    categoryId?: string | null;
    providerId?: string | null;
  } = {
    amount: originalAmount,
    description: description,
  };

  if (currency === 'USD') {
    const rate = parseFloat(exchangeRateStr);
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

  expensePayload.categoryId = categoryIdValue === 'none' ? null : categoryIdValue;
  if (providerIdValue && providerIdValue !== 'none') {
    expensePayload.providerId = providerIdValue;
  } else {
    expensePayload.providerId = null;
  }

  if (expensePayload.exchangeRate === undefined) delete expensePayload.exchangeRate;
  if (expensePayload.originalUsdAmount === undefined)
    delete expensePayload.originalUsdAmount;

  return expensePayload;
};

export async function addExpense(previousState: any, formData: FormData) {
  try {
    const assignmentType = formData.get('assignmentType') as 'property' | 'scope';
    const assignmentId = formData.get('assignmentId') as string;
    const date = formData.get('date') as string;
    const taskId = formData.get('taskId') as string | null;

    if (!assignmentType || !assignmentId || !date) {
      return {
        success: false,
        message: 'La asignación y la fecha son obligatorias.',
      };
    }

    const expenseData = handleExpenseData(formData);
    const newExpense: Omit<Expense, 'id'> = {
      assignment: { type: assignmentType, id: assignmentId },
      date,
      ...expenseData,
      taskId: taskId || null,
      currency: 'ARS',
    };
    
    // Explicitly set providerId to null if it's not provided or is 'none'
    if (!newExpense.providerId) {
        newExpense.providerId = null;
    }

    await addExpenseDb(newExpense);
    revalidatePathsAfterAction(assignmentType === 'property' ? assignmentId : null);
    return { success: true, message: 'Gasto añadido correctamente.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al añadir el gasto.' };
  }
}

export async function updateExpense(
  previousState: any,
  formData: FormData
) {
  try {
    const id = formData.get('id') as string;
    const assignmentType = formData.get('assignmentType') as 'property' | 'scope';
    const assignmentId = formData.get('assignmentId') as string;
    const date = formData.get('date') as string;

    if (!id || !assignmentType || !assignmentId || !date) {
      return { success: false, message: 'Faltan datos para actualizar el gasto.' };
    }

    const expenseData = handleExpenseData(formData);
    const updatedExpense: Expense = {
      id,
      assignment: { type: assignmentType, id: assignmentId },
      date,
      ...expenseData,
      currency: 'ARS',
    };

    await updateExpenseDb(updatedExpense);
    revalidatePathsAfterAction(assignmentType === 'property' ? assignmentId : null);
    return { success: true, message: 'Gasto actualizado correctamente.' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al actualizar el gasto.',
    };
  }
}

export async function deleteExpense(
  previousState: any,
  formData: FormData
) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de gasto no válido.' };
  }

  try {
    const expenseDocRef = doc(db, 'expenses', id);
    const expenseDoc = await getDoc(expenseDocRef);
    if (!expenseDoc.exists()) {
      return { success: false, message: 'No se encontró el gasto para eliminar.' };
    }
    const assignment = expenseDoc.data()?.assignment as TaskAssignment;

    await deleteExpenseDb(id);

    revalidatePathsAfterAction(assignment?.type === 'property' ? assignment.id : null);
    return { success: true, message: 'Gasto eliminado correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function addPayment(previousState: any, formData: FormData) {
  const bookingId = formData.get('bookingId') as string;
  const originalAmount = parseFloat(formData.get('amount') as string);
  const currency = formData.get('currency') as 'USD' | 'ARS';
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;
  const exchangeRateStr = formData.get('exchangeRate') as string;

  // Finance API fields
  const categoria_id = formData.get('categoria_id') as string;
  const cuenta_id = formData.get('cuenta_id') as string;
  const billetera_id = formData.get('billetera_id') as string;

  if (
    !bookingId ||
    !originalAmount ||
    !currency ||
    !date
  ) {
    return {
      success: false,
      message:
        'Faltan campos obligatorios para el pago.',
    };
  }
  
  const hasFinanceFields = categoria_id && cuenta_id && billetera_id;
  if (!hasFinanceFields) {
      console.warn("Faltan campos de finanzas, el pago no será sincronizado.");
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

  let monto_usd: number | undefined;

  if (currency === 'ARS') {
    const rate = parseFloat(exchangeRateStr);
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

    monto_usd = paymentPayload.amount;

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

  if (paymentPayload.exchangeRate === undefined) delete paymentPayload.exchangeRate;
  if (paymentPayload.originalArsAmount === undefined)
    delete paymentPayload.originalArsAmount;

  try {
    const newPayment = await addPaymentDb(paymentPayload as Omit<Payment, 'id'>);
    const booking = await getBookingById(bookingId);

    let financeApiResult;
    if (booking && hasFinanceFields) {
      const tenant = await getTenantById(booking.tenantId);
      const property = await getPropertyById(booking.propertyId);

      // Register payment in the finance app
      const cobroPayload: RegistrarCobroPayload = {
        fecha: date,
        monto: originalAmount,
        moneda: currency,
        monto_usd: monto_usd,
        tasa_cambio:
          currency === 'ARS' ? paymentPayload.exchangeRate : undefined,
        categoria_id: categoria_id,
        cuenta_id: cuenta_id,
        billetera_id: billetera_id,
        descripcion: `Pago reserva ${property?.name || ''} - ${
          tenant?.name || ''
        }`,
      };
      financeApiResult = await registrarCobro(cobroPayload);
    }

    if (booking) {
      revalidatePathsAfterAction(booking.propertyId);
    }
    
    if (hasFinanceFields && financeApiResult) {
        if (!financeApiResult.success) {
             return {
                success: true, // The payment was saved locally
                message: `Pago guardado, pero falló la sincronización: ${financeApiResult.error || 'Error desconocido'}.`,
             };
        }
        return {
            success: true,
            message: "Pago guardado y sincronizado con la app de finanzas.",
        };
    }

    return { 
        success: true, 
        message: 'Pago guardado localmente. No se sincronizó con finanzas por falta de datos.' 
    };

  } catch (error: any) {
    console.error(error);
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updatePayment(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const bookingId = formData.get('bookingId') as string;
  const originalAmount = parseFloat(formData.get('amount') as string);
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
    const rate = parseFloat(exchangeRateStr);
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

  if (paymentPayload.exchangeRate === undefined) delete paymentPayload.exchangeRate;
  if (paymentPayload.originalArsAmount === undefined)
    delete paymentPayload.originalArsAmount;

  try {
    await updatePaymentDb(paymentPayload as Payment);
    const booking = await getBookingById(bookingId);
    if (booking) {
      revalidatePathsAfterAction(booking.propertyId);
    }
    return { success: true, message: 'Pago actualizado correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deletePayment(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de pago no válido.' };
  }

  try {
    const paymentDocRef = doc(db, 'payments', id);
    const paymentDoc = await getDoc(paymentDocRef);

    if (!paymentDoc.exists()) {
      return { success: false, message: 'No se encontró el pago para eliminar.' };
    }
    const bookingId = paymentDoc.data()?.bookingId;

    await deletePaymentDb(id);

    if (bookingId) {
      const booking = await getBookingById(bookingId);
      if (booking) {
        revalidatePathsAfterAction(booking.propertyId);
      }
    }

    return { success: true, message: 'Pago eliminado correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
    await addExpenseCategoryDb({ name });
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
    await updateExpenseCategoryDb({ id, name });
    revalidatePath('/settings');
    revalidatePath('/expenses');
    return { success: true, message: 'Categoría actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
    await deleteExpenseCategoryDb(id);
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
    await addEmailTemplateDb({ name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
    return { success: false, message: 'Faltan datos para actualizar la plantilla.' };
  }
  try {
    await updateEmailTemplateDb({ id, name, subject, body });
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
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
    await deleteEmailTemplateDb(id);
    revalidatePath('/templates');
    return { success: true, message: 'Plantilla eliminada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateEmailSettings(previousState: any, formData: FormData) {
  const replyToEmail = formData.get('replyToEmail') as string;

  if (replyToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyToEmail)) {
    return {
      success: false,
      message: 'Por favor, introduce una dirección de email válida.',
    };
  }

  try {
    await updateEmailSettingsDb({ replyToEmail });
    revalidatePath('/settings');
    return { success: true, message: 'Configuración de email guardada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateAlertSettings(previousState: any, formData: FormData) {
  const checkInDaysStr = formData.get('checkInDays') as string;
  const checkOutDaysStr = formData.get('checkOutDays') as string;

  const checkInDays = parseInt(checkInDaysStr, 10);
  const checkOutDays = parseInt(checkOutDaysStr, 10);

  if (
    isNaN(checkInDays) ||
    isNaN(checkOutDays) ||
    checkInDays < 0 ||
    checkOutDays < 0
  ) {
    return {
      success: false,
      message: 'Por favor, introduce números válidos y positivos.',
    };
  }

  try {
    await updateAlertSettingsDb({ checkInDays, checkOutDays });
    revalidatePath('/settings');
    revalidatePath('/');
    return { success: true, message: 'Configuración de alertas guardada.' };
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
    await addOriginDb({ name, color });
    revalidatePath('/settings');
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/reports');
    revalidatePath('/informes');
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
    await updateOriginDb({ id, name, color });
    revalidatePath('/settings');
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/reports');
    revalidatePath('/informes');
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
    await deleteOriginDb(id);
    revalidatePath('/settings');
    revalidatePath('/tenants');
    revalidatePath('/bookings');
    revalidatePath('/reports');
    revalidatePath('/informes');
    return { success: true, message: 'Origen eliminado.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

// --- PUSH NOTIFICATIONS ---
export async function savePushSubscription(subscription: any) {
  try {
    // The endpoint is a URL, which can be long and contain invalid characters for a Firestore document ID.
    // Encoding it in base64 makes it a safe and unique ID.
    const safeId = Buffer.from(subscription.endpoint).toString('base64');
    await savePushSubscriptionDb(subscription, safeId);
    return { success: true, message: 'Suscripción guardada.' };
  } catch (error: any) {
    console.error('Error saving push subscription:', error);
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

// --- Task Management Actions ---

export async function addTaskCategory(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) {
    return { success: false, message: 'El nombre de la categoría es obligatorio.' };
  }
  try {
    await addTaskCategoryDb({ name });
    revalidatePath('/settings');
    return { success: true, message: 'Categoría de tarea añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateTaskCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  if (!id || !name) {
    return { success: false, message: 'Faltan datos para actualizar la categoría.' };
  }
  try {
    await updateTaskCategoryDb({ id, name });
    revalidatePath('/settings');
    return { success: true, message: 'Categoría de tarea actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteTaskCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de categoría no válido.' };
  }
  try {
    await deleteTaskCategoryDb(id);
    revalidatePath('/settings');
    return { success: true, message: 'Categoría de tarea eliminada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function addTaskScope(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const color = formData.get('color') as string;
  if (!name || !color) {
    return { success: false, message: 'El nombre y el color son obligatorios.' };
  }
  try {
    await addTaskScopeDb({ name, color });
    revalidatePath('/settings');
    return { success: true, message: 'Ámbito añadido.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateTaskScope(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const color = formData.get('color') as string;
  if (!id || !name || !color) {
    return { success: false, message: 'Faltan datos para actualizar el ámbito.' };
  }
  try {
    await updateTaskScopeDb({ id, name, color });
    revalidatePath('/settings');
    return { success: true, message: 'Ámbito actualizado.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteTaskScope(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de ámbito no válido.' };
  }
  try {
    // Check if the scope is in use
    const tasksQuery = query(collection(db, 'tasks'), where('assignment.id', '==', id), where('assignment.type', '==', 'scope'));
    const tasksSnapshot = await getDocs(tasksQuery);
    if (!tasksSnapshot.empty) {
      return { success: false, message: `No se puede eliminar. El ámbito está siendo utilizado por ${tasksSnapshot.size} tarea(s).` };
    }
    
    await deleteTaskScopeDb(id);
    revalidatePath('/settings');
    return { success: true, message: 'Ámbito eliminado.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function addAdjustmentCategory(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as 'addition' | 'deduction';
  if (!name || !type) {
    return { success: false, message: 'El nombre y el tipo son obligatorios.' };
  }
  try {
    await addAdjustmentCategoryDb({ name, type });
    revalidatePath('/settings');
    return { success: true, message: 'Categoría añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateAdjustmentCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const type = formData.get('type') as 'addition' | 'deduction';
  if (!id || !name || !type) {
    return { success: false, message: 'Faltan datos para actualizar la categoría.' };
  }
  try {
    await updateAdjustmentCategoryDb({ id, name, type });
    revalidatePath('/settings');
    return { success: true, message: 'Categoría actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteAdjustmentCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de categoría no válido.' };
  }
  try {
    await deleteAdjustmentCategoryDb(id);
    revalidatePath('/settings');
    return { success: true, message: 'Categoría de ajuste eliminada.' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}


export async function addTask(previousState: any, formData: FormData) {
  const assignmentValue = formData.get('assignment') as string;
  if (!assignmentValue) {
    return { success: false, message: 'Se debe seleccionar una asignación.' };
  }
  const [assignmentType, assignmentId] = assignmentValue.split('-') as ['property' | 'scope', string];
  const assignment: TaskAssignment = {
    type: assignmentType,
    id: assignmentId,
  };

  const categoryIdValue = formData.get('categoryId') as string;
  const dueDateValue = formData.get('dueDate') as string;
  const estimatedCostValue = formData.get('estimatedCost') as string;
  const costCurrencyValue = formData.get('costCurrency') as ('ARS' | 'USD') | null;
  const providerIdValue = formData.get('providerId') as string;

  const taskData: Partial<Task> = {
    assignment,
    description: formData.get('description') as string,
    status: (formData.get('status') as TaskStatus) || 'pending',
    priority: (formData.get('priority') as TaskPriority) || 'medium',
    notes: (formData.get('notes') as string) || '',
    categoryId: categoryIdValue === 'none' ? null : categoryIdValue,
    dueDate: dueDateValue || null,
    costCurrency: costCurrencyValue || 'ARS',
    providerId: providerIdValue === 'none' ? null : providerIdValue,
  };

  const estimatedCost = estimatedCostValue ? parseFloat(estimatedCostValue) : undefined;
  if (estimatedCost !== undefined && !isNaN(estimatedCost)) {
    taskData.estimatedCost = estimatedCost;
  }
  
  const actualCost = formData.has('actualCost') ? parseFloat(formData.get('actualCost') as string) : undefined;
  if (actualCost !== undefined && !isNaN(actualCost)) {
    taskData.actualCost = actualCost;
  }

  if (!taskData.assignment || !taskData.description) {
    return { success: false, message: 'La asignación y la descripción son obligatorias.' };
  }

  try {
    await addTaskDb(taskData as Omit<Task, 'id'>);
    revalidatePathsAfterAction(taskData.assignment.type === 'property' ? taskData.assignment.id : null);
    return { success: true, message: 'Tarea añadida correctamente.' };
  } catch (dbError: any) {
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}

export async function updateTask(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de tarea no proporcionado.' };
  }

  const assignmentValue = formData.get('assignment') as string;

  const taskData: { [key: string]: any } = {};
  
  if (assignmentValue) {
    const [assignmentType, assignmentId] = assignmentValue.split('-') as ['property' | 'scope', string];
    taskData.assignment = { type: assignmentType, id: assignmentId };
  }

  if (formData.has('description')) taskData.description = formData.get('description');
  if (formData.has('status')) taskData.status = formData.get('status');
  if (formData.has('priority')) taskData.priority = formData.get('priority');
  if (formData.has('notes')) taskData.notes = formData.get('notes');
  
  if (formData.has('categoryId')) {
    const categoryIdValue = formData.get('categoryId') as string;
    taskData.categoryId = categoryIdValue === 'none' ? null : categoryIdValue;
  }
  
  if (formData.has('dueDate')) {
    const dueDateValue = formData.get('dueDate') as string;
    taskData.dueDate = dueDateValue || null;
  }
  
  if (formData.has('costCurrency')) {
    const costCurrencyValue = formData.get('costCurrency') as ('ARS' | 'USD') | null;
    taskData.costCurrency = costCurrencyValue || 'ARS';
  }
  
  if (formData.has('providerId')) {
    const providerIdValue = formData.get('providerId') as string;
    taskData.providerId = providerIdValue === 'none' ? null : providerIdValue;
  }

  if (formData.has('estimatedCost')) {
    const estimatedCostValue = formData.get('estimatedCost') as string;
    const estimatedCost = estimatedCostValue ? parseFloat(estimatedCostValue) : undefined;
    taskData.estimatedCost = (estimatedCost !== undefined && !isNaN(estimatedCost)) ? estimatedCost : null;
  }

  try {
    await updateTaskDb({ id, ...taskData });
    const propertyId = taskData.assignment?.type === 'property' ? taskData.assignment.id : null;
    revalidatePathsAfterAction(propertyId);
    return { success: true, message: 'Tarea actualizada.' };
  } catch (dbError: any) {
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}

export async function reassignTaskAndMoveCosts(previousState: any, formData: FormData) {
  const taskId = formData.get('id') as string;
  const assignmentValue = formData.get('assignment') as string;

  if (!taskId || !assignmentValue) {
    return { success: false, message: 'Faltan datos para reasignar la tarea y sus costos.' };
  }

  try {
    const [assignmentType, assignmentId] = assignmentValue.split('-') as ['property' | 'scope', string];
    const newAssignment: TaskAssignment = { type: assignmentType, id: assignmentId };
    
    // First, update the task itself
    await updateTaskDb({ id: taskId, assignment: newAssignment });

    // Then, move the associated costs
    await reassignTaskExpenses(taskId, newAssignment);

    revalidatePathsAfterAction();
    return { success: true, message: 'Tarea y todos sus costos han sido reasignados correctamente.' };

  } catch (error: any) {
    console.error('Error in reassignTaskAndMoveCosts:', error);
    return { success: false, message: `Error al reasignar: ${error.message}` };
  }
}

export async function deleteTask(previousState: any, formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) {
        return { success: false, message: 'ID de tarea no válido.' };
    }

    try {
        await deleteTaskDb(id);
        revalidatePathsAfterAction();
        return { success: true, message: 'Tarea y gastos asociados eliminados.' };
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
    }
}


// --- PROVIDER ACTIONS ---

export async function addProvider(previousState: any, formData: FormData) {
  const ratingStr = formData.get('rating') as string;
  const rating = ratingStr ? parseInt(ratingStr, 10) : 0;
  const categoryIdValue = formData.get('categoryId') as string;

  const newProvider: Omit<Provider, 'id' | 'userId'> = {
    name: formData.get('name') as string,
    categoryId: categoryIdValue === 'none' ? null : categoryIdValue,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    countryCode: formData.get('countryCode') as string,
    address: formData.get('address') as string,
    notes: (formData.get('notes') as string) || '',
    adminNote: (formData.get('adminNote') as string) || '',
    rating: !isNaN(rating) ? rating : 0,
    managementType: (formData.get('managementType') as ProviderManagementType) || 'tasks',
    billingType: (formData.get('billingType') as ProviderBillingType) || null,
    rateCurrency: (formData.get('rateCurrency') as 'ARS' | 'USD') || null,
    hourlyRate: formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null,
    perVisitRate: null, // Obsolete field, always set to null
    role: (formData.get('role') as UserRole) || 'provider',
    status: (formData.get('status') as UserStatus) || 'pending',
  };
  
  if (!newProvider.email) {
      return { success: false, message: 'El email es obligatorio para registrar un colaborador.' };
  }

  try {
    // Check if email is already in use
    const existingProvider = await getProviderByEmail(newProvider.email);
    if (existingProvider) {
        return { success: false, message: 'Este email ya está en uso por otro colaborador.' };
    }

    await addProviderDb(newProvider);
    revalidatePath('/providers');
    return { success: true, message: 'Colaborador añadido correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateProvider(previousState: any, formData: FormData) {
  const providerId = formData.get('id') as string;
  if (!providerId) {
    return { success: false, message: 'ID de colaborador no proporcionado.' };
  }
  
  const newEmail = formData.get('email') as string;
  if (!newEmail) {
      return { success: false, message: 'El email es un campo obligatorio.' };
  }

  try {
    // 1. Get original provider
    const originalProvider = await getProviderById(providerId);
    if (!originalProvider) {
        return { success: false, message: 'No se encontró el colaborador a actualizar.' };
    }

    // 2. Check if email is being changed
    const emailChanged = newEmail.toLowerCase() !== originalProvider.email.toLowerCase();

    // Data for update, will be modified if email changes
    const dataToUpdate: Partial<Omit<Provider, 'id'>> = {};

    if (emailChanged) {
        // 2a. Check for email conflict
        const existingProvider = await getProviderByEmail(newEmail);
        if (existingProvider && existingProvider.id !== providerId) {
            return { success: false, message: 'El nuevo email ya está en uso por otro colaborador.' };
        }
        // 2c. Reset userId to force re-linking on next login
        dataToUpdate.userId = null;
    }

    // 3. Construct the rest of the update object
    const ratingStr = formData.get('rating') as string;
    const rating = ratingStr ? parseInt(ratingStr, 10) : 0;
    const categoryIdValue = formData.get('categoryId') as string;

    dataToUpdate.name = formData.get('name') as string;
    dataToUpdate.email = newEmail;
    dataToUpdate.categoryId = categoryIdValue === 'none' ? null : categoryIdValue;
    dataToUpdate.phone = formData.get('phone') as string;
    dataToUpdate.countryCode = formData.get('countryCode') as string;
    dataToUpdate.address = formData.get('address') as string;
    dataToUpdate.notes = formData.get('notes') as string;
    dataToUpdate.adminNote = formData.get('adminNote') as string;
    dataToUpdate.rating = !isNaN(rating) ? rating : 0;
    dataToUpdate.managementType = (formData.get('managementType') as ProviderManagementType) || 'tasks';
    dataToUpdate.billingType = (formData.get('billingType') as ProviderBillingType) || null;
    dataToUpdate.rateCurrency = (formData.get('rateCurrency') as 'ARS' | 'USD') || null;
    dataToUpdate.hourlyRate = formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : null;
    dataToUpdate.perVisitRate = null; // Obsolete field
    dataToUpdate.role = (formData.get('role') as UserRole) || 'provider';
    dataToUpdate.status = (formData.get('status') as UserStatus) || 'pending';

    // 4. Perform the update
    await updateProviderPartial(providerId, dataToUpdate);

    revalidatePath('/providers');
    revalidatePath('/tasks');
    return { success: true, message: 'Colaborador actualizado correctamente.' };

  } catch (error: any) {
    console.error("Error updating provider:", error);
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteProvider(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de proveedor no válido.' };
  }

  const providerToDelete = await getProviderById(id);
  if (providerToDelete?.role === 'admin') {
      const q = query(collection(db, 'providers'), where('role', '==', 'admin'));
      const adminSnapshot = await getDocs(q);
      if (adminSnapshot.size <= 1) {
          return { success: false, message: 'No se puede eliminar al único administrador.' };
      }
  }

  try {
    await deleteProviderDb(id);
    revalidatePath('/providers');
    revalidatePath('/tasks');
    return { success: true, message: 'Proveedor eliminado correctamente.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}


export async function addProviderCategory(previousState: any, formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) {
    return { success: false, message: 'El nombre de la categoría es obligatorio.' };
  }
  try {
    await addProviderCategoryDb({ name });
    revalidatePath('/settings');
    revalidatePath('/providers');
    return { success: true, message: 'Categoría de proveedor añadida.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateProviderCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  if (!id || !name) {
    return { success: false, message: 'Faltan datos para actualizar la categoría.' };
  }
  try {
    await updateProviderCategoryDb({ id, name });
    revalidatePath('/settings');
    revalidatePath('/providers');
    return { success: true, message: 'Categoría de proveedor actualizada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function deleteProviderCategory(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  if (!id) {
    return { success: false, message: 'ID de categoría no válido.' };
  }
  try {
    // Unlink providers from this category
    const providersToUpdateQuery = query(collection(db, 'providers'), where('categoryId', '==', id));
    const providersSnapshot = await getDocs(providersToUpdateQuery);
    
    const batch = writeBatch(db);
    providersSnapshot.forEach(providerDoc => {
        const providerRef = doc(db, 'providers', providerDoc.id);
        batch.update(providerRef, { categoryId: null });
    });

    // Delete the category itself
    const categoryRef = doc(db, 'providerCategories', id);
    batch.delete(categoryRef);

    await batch.commit();

    revalidatePath('/settings');
    revalidatePath('/providers');
    return { success: true, message: 'Categoría de proveedor eliminada.' };
  } catch (error: any) {
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

export async function updateTenantRating(previousState: any, formData: FormData) {
    const id = formData.get('id') as string;
    const ratingStr = formData.get('rating') as string;
    const notes = formData.get('notes') as string | null;

    if (!id || !ratingStr) {
        return { success: false, message: 'Faltan datos (ID o calificación).' };
    }
    
    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating) || rating < 0 || rating > 5) {
        return { success: false, message: 'Calificación no válida.' };
    }

    try {
        const dataToUpdate: Partial<Omit<Tenant, 'id'>> = { rating };
        // Only update notes if it's passed in the form data
        if (notes !== null) {
            dataToUpdate.notes = notes;
        }
        await updateTenantPartial(id, dataToUpdate);
        revalidatePath('/tenants');
        return { success: true, message: 'Calificación actualizada.' };
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
    }
}

export async function updateProviderRating(previousState: any, formData: FormData) {
    const id = formData.get('id') as string;
    const ratingStr = formData.get('rating') as string;
    const notes = formData.get('notes') as string | null;

    if (!id || !ratingStr) {
        return { success: false, message: 'Faltan datos (ID o calificación).' };
    }

    const rating = parseInt(ratingStr, 10);
    if (isNaN(rating) || rating < 0 || rating > 5) {
        return { success: false, message: 'Calificación no válida.' };
    }

    try {
        const dataToUpdate: Partial<Omit<Provider, 'id'>> = { rating };
        if (notes !== null) {
            dataToUpdate.notes = notes;
        }
        await updateProviderPartial(id, dataToUpdate);
        revalidatePath('/providers');
        return { success: true, message: 'Calificación actualizada.' };
    } catch (error: any) {
        return { success: false, message: `Error de base de datos: ${error.message}` };
    }
}

export async function updateProviderAdminNote(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const adminNote = formData.get('adminNote') as string;

  if (!id) {
    return { success: false, message: 'ID de colaborador no proporcionado.' };
  }

  try {
    await updateProviderPartial(id, { adminNote });
    revalidatePath('/liquidations');
    revalidatePath('/providers');
    return { success: true, message: 'Nota actualizada correctamente.' };
  } catch (error: any) {
    console.error('Error updating provider admin note:', error);
    return { success: false, message: `Error de base de datos: ${error.message}` };
  }
}

// --- DATE BLOCKS ---

export async function addDateBlock(previousState: any, formData: FormData) {
  const blockData = {
    propertyId: formData.get('propertyId') as string,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
    reason: formData.get('reason') as string,
  };

  if (!blockData.propertyId || !blockData.startDate || !blockData.endDate) {
    return { success: false, message: 'La propiedad y las fechas son obligatorias.' };
  }

  try {
    await addDateBlockDb(blockData as Omit<DateBlock, 'id'>);
    revalidatePathsAfterAction(blockData.propertyId);
    return { success: true, message: 'Fechas bloqueadas correctamente.' };
  } catch (dbError: any) {
    console.error('Error creating date block in DB:', dbError);
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}

export async function updateDateBlock(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;

  if (!id) {
    return { success: false, message: 'ID de bloqueo no proporcionado.' };
  }

  const blockData = {
    id,
    propertyId: formData.get('propertyId') as string,
    startDate: formData.get('startDate') as string,
    endDate: formData.get('endDate') as string,
    reason: formData.get('reason') as string,
  };

  if (!blockData.propertyId || !blockData.startDate || !blockData.endDate) {
    return { success: false, message: 'La propiedad y las fechas son obligatorias.' };
  }

  try {
    await updateDateBlockDb(blockData as DateBlock);
    revalidatePathsAfterAction(blockData.propertyId);
    return { success: true, message: 'Bloqueo actualizado correctamente.' };
  } catch (dbError: any) {
    console.error('Error updating date block in DB:', dbError);
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}


export async function deleteDateBlock(previousState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const propertyId = formData.get('propertyId') as string;

  if (!id || !propertyId) {
    return { success: false, message: 'ID de bloqueo o propiedad no válido.' };
  }

  try {
    await deleteDateBlockDb(id);
    revalidatePathsAfterAction(propertyId);
    return { success: true, message: 'Bloqueo eliminado correctamente.' };
  } catch (dbError: any) {
    console.error('Error deleting date block from DB:', dbError);
    return { success: false, message: `Error de base de datos: ${dbError.message}` };
  }
}

// --- LIQUIDATIONS ---
export async function addWorkLog(previousState: any, formData: FormData) {
    try {
        const assignmentValue = formData.get('assignment') as string;
        if (!assignmentValue) {
            return { success: false, message: 'Debe seleccionar una propiedad o ámbito.' };
        }
        const [assignmentType, assignmentId] = assignmentValue.split('-') as ['property' | 'scope', string];

        const providerId = formData.get('providerId') as string;
        const quantity = parseFloat(formData.get('quantity') as string);
        const rate = parseFloat(formData.get('rate') as string);
        const date = formData.get('date') as string;

        if (isNaN(quantity) || quantity <= 0) return { success: false, message: 'La cantidad debe ser un número mayor a cero.' };
        if (isNaN(rate) || rate < 0) return { success: false, message: 'La tarifa debe ser un número válido.' };
        if (!date) return { success: false, message: 'La fecha es obligatoria.' };

        const provider = await getProviderById(providerId);
        if (!provider) throw new Error("Proveedor no encontrado.");

        const calculatedCost = quantity * rate;
        const costCurrency = provider.rateCurrency || 'ARS';

        const workLogData: Omit<WorkLog, 'id' | 'status'> = {
            providerId,
            assignment: { type: assignmentType, id: assignmentId },
            date: date,
            activityType: formData.get('activityType') as 'hourly' | 'per_visit',
            quantity,
            description: formData.get('description') as string,
            rateApplied: rate,
            costCurrency,
            calculatedCost,
        };

        await addWorkLogDb(workLogData);
        revalidatePath('/liquidations');
        return { success: true, message: 'Actividad registrada correctamente.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function addManualAdjustment(previousState: any, formData: FormData) {
    try {
        const assignmentValue = formData.get('assignment') as string;
        if (!assignmentValue) {
            return { success: false, message: 'Debe seleccionar una propiedad o ámbito.' };
        }
        const [assignmentType, assignmentId] = assignmentValue.split('-') as ['property' | 'scope', string];
        
        const categoryId = formData.get('categoryId') as string;
        if (!categoryId) {
             return { success: false, message: 'Debe seleccionar una categoría de ajuste.' };
        }

        const categories = await getAdjustmentCategories();
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
             return { success: false, message: 'La categoría seleccionada no es válida.' };
        }

        let amount = parseFloat(formData.get('amount') as string);
        if (category.type === 'deduction') {
            amount = -Math.abs(amount);
        } else {
            amount = Math.abs(amount);
        }

        const adjustmentData: Omit<ManualAdjustment, 'id' | 'status'> = {
            providerId: formData.get('providerId') as string,
            date: formData.get('date') as string,
            amount: amount,
            currency: formData.get('currency') as 'ARS' | 'USD',
            categoryId: categoryId,
            notes: formData.get('notes') as string,
            assignment: { type: assignmentType, id: assignmentId },
        };
        await addManualAdjustmentDb(adjustmentData);
        revalidatePath('/liquidations');
        return { success: true, message: 'Ajuste registrado correctamente.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function generateLiquidation(previousState: any, formData: FormData) {
  const providerId = formData.get('providerId') as string;
  const workLogIds = formData.getAll('workLogIds') as string[];
  const adjustmentIds = formData.getAll('adjustmentIds') as string[];
  const currency = formData.get('currency') as 'ARS' | 'USD';

  if (!providerId || !currency || (workLogIds.length === 0 && adjustmentIds.length === 0)) {
    return { success: false, message: 'Faltan datos para generar la liquidación.' };
  }

  const batch = writeBatch(db);

  try {
    let totalAmount = 0;
    const workLogsToUpdate: WorkLog[] = [];
    const adjustmentsToUpdate: ManualAdjustment[] = [];

    // Process Work Logs
    if (workLogIds.length > 0) {
        const workLogsQuery = query(collection(db, 'workLogs'), where(documentId(), 'in', workLogIds));
        const workLogsSnap = await getDocs(workLogsQuery);
        for (const doc of workLogsSnap.docs) {
            const log = { id: doc.id, ...doc.data() } as WorkLog;
            if (log.status !== 'pending_liquidation') throw new Error(`La actividad ${log.description} ya ha sido liquidada.`);
            if (log.costCurrency !== currency) throw new Error('No se pueden mezclar monedas en una liquidación.');
            totalAmount += log.calculatedCost;
            workLogsToUpdate.push(log);
        }
    }

    // Process Manual Adjustments
    if (adjustmentIds.length > 0) {
        const adjustmentsQuery = query(collection(db, 'manualAdjustments'), where(documentId(), 'in', adjustmentIds));
        const adjustmentsSnap = await getDocs(adjustmentsQuery);
        for (const doc of adjustmentsSnap.docs) {
            const adj = { id: doc.id, ...doc.data() } as ManualAdjustment;
            if (adj.status !== 'pending_liquidation') throw new Error(`El ajuste ${adj.notes} ya ha sido liquidado.`);
            if (adj.currency !== currency) throw new Error('No se pueden mezclar monedas en una liquidación.');
            totalAmount += adj.amount;
            adjustmentsToUpdate.push(adj);
        }
    }

    // 1. Create the Liquidation document
    const liquidationRef = doc(collection(db, 'liquidations'));
    const newLiquidation: Omit<Liquidation, 'id'> = {
        providerId,
        dateGenerated: new Date().toISOString().split('T')[0],
        totalAmount,
        currency,
        status: 'pending_payment',
        amountPaid: 0,
        balance: totalAmount,
    };
    batch.set(liquidationRef, newLiquidation);
    const liquidationId = liquidationRef.id;

    // 2. Create an Expense for each group
    const expensesByAssignment = new Map<string, { amount: number, assignment: TaskAssignment, descriptions: string[] }>();
    
    workLogsToUpdate.forEach(log => {
        const key = `${log.assignment.type}-${log.assignment.id}`;
        const existing = expensesByAssignment.get(key) || { amount: 0, assignment: log.assignment, descriptions: [] };
        existing.amount += log.calculatedCost;
        existing.descriptions.push(log.description);
        expensesByAssignment.set(key, existing);
    });

    adjustmentsToUpdate.forEach(adj => {
        const key = `${adj.assignment.type}-${adj.assignment.id}`;
        const existing = expensesByAssignment.get(key) || { amount: 0, assignment: adj.assignment, descriptions: [] };
        existing.amount += adj.amount;
        existing.descriptions.push(adj.notes || `Ajuste del ${adj.date}`);
        expensesByAssignment.set(key, existing);
    });
    
    for (const [, group] of expensesByAssignment.entries()) {
        const expenseRef = doc(collection(db, 'expenses'));
        const expense: Omit<Expense, 'id'> = {
            assignment: group.assignment,
            date: new Date().toISOString().split('T')[0],
            amount: currency === 'ARS' ? group.amount : 0,
            currency: 'ARS',
            description: `Liquidación: ${group.descriptions.join(', ')}`,
            providerId,
            liquidationId,
            ...(currency === 'USD' && { originalUsdAmount: group.amount, exchangeRate: 1 }) // Placeholder rate
        };
        batch.set(expenseRef, expense);
    }
    
    // 3. Update status of worklogs and adjustments
    workLogsToUpdate.forEach(log => {
        batch.update(doc(db, 'workLogs', log.id), { status: 'liquidated', liquidationId });
    });
    adjustmentsToUpdate.forEach(adj => {
        batch.update(doc(db, 'manualAdjustments', adj.id), { status: 'liquidated', liquidationId });
    });
    
    await batch.commit();

    revalidatePath('/liquidations');
    return { success: true, message: 'Liquidación generada con éxito.' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message };
  }
}

export async function addLiquidationPayment(previousState: any, formData: FormData) {
  const liquidationId = formData.get('liquidationId') as string;
  const paymentAmount = parseFloat(formData.get('paymentAmount') as string);
  const paymentDate = formData.get('paymentDate') as string;
  const expenseDescription = formData.get('expenseDescription') as string;
  const expenseCategoryId = formData.get('expenseCategoryId') as string;

  if (!liquidationId || isNaN(paymentAmount) || !paymentDate) {
    return { success: false, message: 'Faltan datos obligatorios para registrar el pago.' };
  }
   if (paymentAmount <= 0) {
    return { success: false, message: 'El monto del pago debe ser mayor a cero.' };
  }

  try {
    await addLiquidationPaymentDb(liquidationId, paymentAmount, paymentDate, expenseDescription, expenseCategoryId);
    revalidatePathsAfterAction();
    return { success: true, message: 'Pago registrado y gasto asociado creado.' };
  } catch (error: any) {
    console.error('Error adding liquidation payment:', error);
    return { success: false, message: `Error al registrar el pago: ${error.message}` };
  }
}

export async function revertLiquidation(previousState: any, liquidationId: string) {
  if (!liquidationId) {
    return { success: false, message: 'ID de liquidación no proporcionado.' };
  }

  try {
    await revertLiquidationDb(liquidationId);
    revalidatePath('/liquidations');
    revalidatePath('/expenses');
    return { success: true, message: 'Liquidación revertida con éxito.' };

  } catch (error: any) {
    console.error('Error reverting liquidation:', error);
    return { success: false, message: `Error al revertir: ${error.message}` };
  }
}

export async function updateWorkLog(previousState: any, formData: FormData) {
    try {
        const id = formData.get('id') as string;
        if (!id) throw new Error("ID de actividad no proporcionado.");
        
        const provider = await getProviderById(formData.get('providerId') as string);
        if (!provider) throw new Error("Proveedor no encontrado.");

        const quantity = parseFloat(formData.get('quantity') as string);
        const rate = parseFloat(formData.get('rate') as string);

        const assignmentValue = formData.get('assignment') as string;
        const [assignmentType, assignmentId] = assignmentValue.split('-') as ['property' | 'scope', string];

        const workLogData: Partial<WorkLog> = {
            date: formData.get('date') as string,
            description: formData.get('description') as string,
            quantity,
            rateApplied: rate,
            calculatedCost: quantity * rate,
            activityType: formData.get('activityType') as 'hourly' | 'per_visit',
            assignment: {
                type: assignmentType,
                id: assignmentId,
            }
        };

        await updateWorkLogDb({ id, ...workLogData });
        revalidatePath('/liquidations');
        return { success: true, message: 'Actividad actualizada.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteWorkLog(previousState: any, formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) return { success: false, message: 'ID no válido.' };
    try {
        await deleteWorkLogDb(id);
        revalidatePath('/liquidations');
        return { success: true, message: 'Actividad eliminada.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

export async function updateManualAdjustment(previousState: any, formData: FormData) {
    try {
        const id = formData.get('id') as string;
        if (!id) throw new Error("ID de ajuste no proporcionado.");
        
        const assignmentValue = formData.get('assignment') as string;
        const [assignmentType, assignmentId] = assignmentValue.split('-') as ['property' | 'scope', string];

        const categoryId = formData.get('categoryId') as string;
        if (!categoryId) {
            return { success: false, message: 'Debe seleccionar una categoría de ajuste.' };
        }

        const categories = await getAdjustmentCategories();
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
            return { success: false, message: 'La categoría seleccionada no es válida.' };
        }

        let amount = parseFloat(formData.get('amount') as string);
        if (category.type === 'deduction') {
            amount = -Math.abs(amount);
        } else {
            amount = Math.abs(amount);
        }

        const adjustmentData: Partial<Omit<ManualAdjustment, 'id'>> = {
            date: formData.get('date') as string,
            notes: formData.get('notes') as string,
            amount: amount,
            currency: formData.get('currency') as 'ARS' | 'USD',
            categoryId: categoryId,
            assignment: {
                type: assignmentType,
                id: assignmentId,
            }
        };

        await updateManualAdjustmentDb({ id, ...adjustmentData });
        revalidatePath('/liquidations');
        return { success: true, message: 'Ajuste actualizado.' };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteManualAdjustment(previousState: any, formData: FormData) {
    const id = formData.get('id') as string;
    if (!id) return { success: false, message: 'ID no válido.' };
    try {
        await deleteManualAdjustmentDb(id);
        revalidatePath('/liquidations');
        return { success: true, message: 'Ajuste eliminado.' };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}


