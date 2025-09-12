
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CircleHelp } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <CircleHelp className="h-10 w-10 text-primary" />
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Centro de Ayuda</h2>
            <p className="text-muted-foreground">Encuentra respuestas a tus preguntas sobre cómo usar la aplicación.</p>
        </div>
      </div>

        <Card>
            <CardHeader>
                <CardTitle>Preguntas Frecuentes</CardTitle>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>¿Cómo agrego una nueva propiedad?</AccordionTrigger>
                        <AccordionContent>
                        <p>1. Ve a la sección de <strong>Configuración</strong> en el menú de la izquierda.</p>
                        <p>2. Asegúrate de estar en la pestaña <strong>"Propiedades"</strong>.</p>
                        <p>3. Haz clic en el botón <strong>"+ Nueva Propiedad"</strong> en la esquina superior derecha.</p>
                        <p>4. Rellena el formulario con los detalles de la propiedad, como nombre, dirección y, si lo tienes, el ID del Calendario de Google.</p>
                        <p>5. Haz clic en <strong>"Guardar Propiedad"</strong> para añadirla.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>¿Cómo creo un nuevo inquilino?</AccordionTrigger>
                        <AccordionContent>
                        <p>1. Ve a la sección de <strong>Inquilinos</strong> en el menú de la izquierda.</p>
                        <p>2. Haz clic en el botón <strong>"+ Nuevo Inquilino"</strong> en la esquina superior derecha.</p>
                        <p>3. Completa el formulario con los datos del inquilino: nombre, DNI, email, teléfono, etc.</p>
                        <p>4. Haz clic en <strong>"Guardar Inquilino"</strong>.</p>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-3">
                        <AccordionTrigger>¿Cómo registro una nueva reserva?</AccordionTrigger>
                        <AccordionContent>
                        <p>1. Ve a <strong>Propiedades</strong> y haz clic en la propiedad que quieres reservar.</p>
                        <p>2. Asegúrate de estar en la pestaña <strong>"Reservas"</strong>.</p>
                        <p>3. Haz clic en el botón <strong>"+ Nueva Reserva"</strong>.</p>
                        <p>4. En el formulario, selecciona el inquilino, elige las fechas de check-in y check-out en el calendario e ingresa el monto y la moneda.</p>
                        <p>5. Haz clic en <strong>"Crear Reserva"</strong>.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger>¿Cómo registro un pago de una reserva?</AccordionTrigger>
                        <AccordionContent>
                        <p>1. Ve a la sección de <strong>Reservas</strong> (o encuentra la reserva en la página de la propiedad).</p>
                        <p>2. En la fila de la reserva correspondiente, haz clic en el icono de banco (<strong>Gestionar Pagos</strong>).</p>
                        <p>3. En la ventana que se abre, haz clic en <strong>"+ Añadir Pago"</strong>.</p>
                        <p>4. Ingresa la fecha, el monto, la moneda y una descripción del pago.</p>
                        <p>5. Si el pago es en ARS, deberás ingresar el valor del USD en ese momento para la conversión.</p>
                        <p>6. Haz clic en <strong>"Añadir Pago"</strong>.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-5">
                        <AccordionTrigger>¿Cómo veo el contrato de una reserva?</AccordionTrigger>
                        <AccordionContent>
                        <p>1. Encuentra la reserva que te interesa en la sección <strong>Reservas</strong>.</p>
                        <p>2. En la columna "Contrato", verás una etiqueta (ej. "S/Enviar", "Firmado"). Haz clic en esa etiqueta.</p>
                        <p>3. Se abrirá una nueva pestaña con la vista previa del contrato. Desde allí puedes imprimirlo o guardarlo como PDF.</p>
                        <p><strong>Nota:</strong> Para que el contrato se genere correctamente, la propiedad debe tener una plantilla de contrato definida. Puedes editarla en <strong>Configuración &gt; Propiedades</strong>.</p>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-6">
                        <AccordionTrigger>¿Para qué sirve el ID del Calendario de Google?</AccordionTrigger>
                        <AccordionContent>
                        <p>Si configuras el ID de un Calendario de Google para una propiedad, la aplicación sincronizará automáticamente las reservas.</p>
                        <p>Cuando creas, modificas o eliminas una reserva en la aplicación, el evento correspondiente se creará, modificará o eliminará en tu Calendario de Google.</p>
                        <p>Esto te permite tener una vista centralizada de tu disponibilidad y compartirla fácilmente.</p>
                        <p><strong>Importante:</strong> Debes compartir el calendario desde tu cuenta de Google con el email de la cuenta de servicio (`process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL`) y darle permisos de "Hacer cambios a los eventos".</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}
