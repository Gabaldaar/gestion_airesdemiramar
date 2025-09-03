
"use server";

import { revalidatePath } from "next/cache";
import { 
    addTenant as dbAddTenant, 
    updateTenant as dbUpdateTenant, 
    addBooking as dbAddBooking, 
    addPropertyExpense as dbAddPropertyExpense,
    updatePropertyExpense as dbUpdatePropertyExpense,
    deletePropertyExpense as dbDeletePropertyExpense
} from "./data";

// Acción para actualizar una propiedad (simulada)
export async function updateProperty(previousState: any, formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const address = formData.get("address");
  const googleCalendarId = formData.get("googleCalendarId");
  const imageUrl = formData.get("imageUrl");

  console.log("Actualizando propiedad (simulado):", {
    id,
    name,
    address,
    googleCalendarId,
    imageUrl,
  });

  // Aquí iría la lógica para actualizar la propiedad en la base de datos.
  // Por ahora, solo invalidamos la caché para que Next.js recargue los datos.
  revalidatePath("/settings");

  return { success: true, message: "Propiedad actualizada." };
}

// Acción para añadir un nuevo inquilino (simulada)
export async function addTenant(previousState: any, formData: FormData) {
  const newTenant = {
    name: formData.get("name") as string,
    dni: formData.get("dni") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    country: (formData.get("country") as string) || "Argentina",
  };

  console.log("Añadiendo nuevo inquilino (simulado):", newTenant);
  
  try {
    await dbAddTenant(newTenant);
    revalidatePath("/tenants");
    return { success: true, message: "Inquilino añadido correctamente." };
  } catch (error) {
    return { success: false, message: "Error al añadir inquilino." };
  }
}

export async function updateTenant(previousState: any, formData: FormData) {
  const updatedTenant = {
    id: parseInt(formData.get("id") as string, 10),
    name: formData.get("name") as string,
    dni: formData.get("dni") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    address: formData.get("address") as string,
    city: formData.get("city") as string,
    country: formData.get("country") as string,
  };

  console.log("Actualizando inquilino (simulado):", updatedTenant);

  try {
    await dbUpdateTenant(updatedTenant);
    revalidatePath("/tenants");
    return { success: true, message: "Inquilino actualizado correctamente." };
  } catch (error) {
    return { success: false, message: "Error al actualizar inquilino." };
  }
}

export async function addBooking(previousState: any, formData: FormData) {
    const propertyId = parseInt(formData.get("propertyId") as string, 10);
    const tenantId = parseInt(formData.get("tenantId") as string, 10);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as 'USD' | 'ARS';

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
    };

    console.log("Creando nueva reserva (simulado):", newBooking);

    try {
        await dbAddBooking(newBooking);
        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/bookings');
        return { success: true, message: "Reserva creada correctamente." };
    } catch (error) {
        return { success: false, message: "Error al crear la reserva." };
    }
}

export async function addPropertyExpense(previousState: any, formData: FormData) {
    const propertyId = parseInt(formData.get("propertyId") as string, 10);
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const date = formData.get("date") as string;

    if (!propertyId || !description || !amount || !date) {
        return { success: false, message: "La descripción, el monto y la fecha son obligatorios." };
    }

    const newExpense = {
        propertyId,
        description,
        amount,
        date,
    };

    console.log("Añadiendo nuevo gasto (simulado):", newExpense);

    try {
        await dbAddPropertyExpense(newExpense);
        revalidatePath(`/properties/${propertyId}`);
        return { success: true, message: "Gasto añadido correctamente." };
    } catch (error) {
        return { success: false, message: "Error al añadir el gasto." };
    }
}

export async function updatePropertyExpense(previousState: any, formData: FormData) {
    const id = parseInt(formData.get("id") as string, 10);
    const propertyId = parseInt(formData.get("propertyId") as string, 10);
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const date = formData.get("date") as string;

    if (!id || !propertyId || !description || !amount || !date) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }

    const updatedExpense = {
        id,
        propertyId,
        description,
        amount,
        date,
    };

    try {
        await dbUpdatePropertyExpense(updatedExpense);
        revalidatePath(`/properties/${propertyId}`);
        return { success: true, message: "Gasto actualizado correctamente." };
    } catch (error) {
        return { success: false, message: "Error al actualizar el gasto." };
    }
}

export async function deletePropertyExpense(previousState: any, formData: FormData) {
    const id = parseInt(formData.get("id") as string, 10);
    const propertyId = parseInt(formData.get("propertyId") as string, 10);

     if (!id || !propertyId) {
        return { success: false, message: "ID de gasto o propiedad no válido." };
    }

    try {
        await dbDeletePropertyExpense(id);
        revalidatePath(`/properties/${propertyId}`);
        return { success: true, message: "Gasto eliminado correctamente." };
    } catch (error) {
        return { success: false, message: "Error al eliminar el gasto." };
    }
}
