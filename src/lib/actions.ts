
"use server";

import { revalidatePath } from "next/cache";

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
