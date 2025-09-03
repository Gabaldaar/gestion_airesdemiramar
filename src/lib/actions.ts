
"use server";

import { revalidatePath } from "next/cache";
import { addTenant as dbAddTenant } from "./data";

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
