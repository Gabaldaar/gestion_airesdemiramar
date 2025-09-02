
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { type Property, updateProperty } from "@/lib/data"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  googleCalendarId: z.string().email({
    message: "Por favor, introduce un ID de calendario de Google válido (email).",
  }),
  imageUrl: z.string().url({
      message: "Por favor, introduce una URL de imagen válida."
  })
})

export function PropertySettingsForm({ property }: { property: Property }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: property.name,
      googleCalendarId: property.googleCalendarId,
      imageUrl: property.imageUrl
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    
    updateProperty(property.id, values)
    toast({
      title: "Propiedad actualizada",
      description: `Los datos de "${values.name}" se han guardado.`,
    })
    setIsSaving(false)
    router.refresh() // Recarga la página para mostrar los nuevos datos
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre de la Propiedad</FormLabel>
                <FormControl>
                    <Input placeholder="Ej. Depto. Centauro" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="googleCalendarId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>ID de Google Calendar</FormLabel>
                <FormControl>
                    <Input placeholder="ejemplo@group.calendar.google.com" {...field} />
                </FormControl>
                <FormDescription>
                    El ID del calendario para la verificación de disponibilidad.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>URL de la Imagen</FormLabel>
                <FormControl>
                    <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                </FormControl>
                <FormDescription>
                    La imagen principal que se mostrará para la propiedad.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  )
}
