
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, AlertCircle, CheckCircle, PlusCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { calendarConflictCheck } from "@/ai/flows/calendar-conflict-check";

import { cn } from "@/lib/utils";
import type { Property, Tenant } from "@/lib/types";
import { addBooking, getTenants } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


const bookingFormSchema = z.object({
  tenantId: z.coerce.number({ required_error: "Debe seleccionar un inquilino." }).min(1, "Debe seleccionar un inquilino."),
  dateRange: z.object({
    from: z.date({ required_error: "Fecha de ingreso es requerida." }),
    to: z.date({ required_error: "Fecha de egreso es requerida." }),
  }),
  amountUSD: z.coerce.number().min(0, "El monto debe ser positivo."),
  conversionRate: z.coerce.number().min(0, "El tipo de cambio debe ser positivo."),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

type ConflictState = {
  status: 'idle' | 'checking' | 'checked';
  hasConflict?: boolean;
  message?: string;
}

export function BookingForm({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [conflictState, setConflictState] = useState<ConflictState>({ status: 'idle' });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  useEffect(() => {
    if(open) {
      setTenants(getTenants());
    }
  }, [open]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      amountUSD: 0,
      conversionRate: 0,
      dateRange: {
        from: undefined,
        to: undefined,
      },
    },
  });

  const dateRange = form.watch("dateRange");
  const debouncedDateRange = useDebounce(dateRange, 500);

  useEffect(() => {
    if (debouncedDateRange?.from && debouncedDateRange?.to) {
      const checkAvailability = async () => {
        setConflictState({ status: 'checking' });
        try {
          const result = await calendarConflictCheck({
            calendarId: property.googleCalendarId,
            startDate: debouncedDateRange.from!.toISOString(),
            endDate: debouncedDateRange.to!.toISOString(),
          });
          setConflictState({ status: 'checked', hasConflict: result.hasConflict, message: result.conflictDescription });
        } catch (error) {
          console.error("Error checking calendar:", error);
          setConflictState({ status: 'checked', hasConflict: true, message: "Error al verificar el calendario." });
        }
      };
      checkAvailability();
    } else {
        setConflictState({ status: 'idle' });
    }
  }, [debouncedDateRange, property.googleCalendarId]);

  function onSubmit(data: BookingFormValues) {
    if (!data.dateRange.from || !data.dateRange.to) {
        toast({
            title: "Error",
            description: "Por favor selecciona un rango de fechas.",
            variant: "destructive"
        });
        return;
    }
    
    addBooking({
      propertyId: property.id,
      tenantId: data.tenantId,
      checkIn: data.dateRange.from.toISOString(),
      checkOut: data.dateRange.to.toISOString(),
      amountUSD: data.amountUSD,
      amountARS: data.amountUSD * data.conversionRate,
      conversionRate: data.conversionRate,
    });
    
    const tenant = tenants.find(t => t.id === data.tenantId)

    toast({
      title: "Reserva Creada",
      description: `Se ha creado una reserva para ${tenant?.name}.`,
    });
    setOpen(false);
    form.reset();
    router.refresh();
  }

  const handleAddNewTenant = () => {
    router.push('/tenants?new=true');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Reserva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva Reserva para {property.name}</DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva reserva. La disponibilidad se verificará automáticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inquilino</FormLabel>
                   <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un inquilino" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenants.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleAddNewTenant}>
                    O agregar un nuevo inquilino
                  </Button>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fechas de Estadía</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value?.from ? (
                            field.value.to ? (
                              <>
                                {format(field.value.from, "LLL dd, y", { locale: es })} -{" "}
                                {format(field.value.to, "LLL dd, y", { locale: es })}
                              </>
                            ) : (
                              format(field.value.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Selecciona un rango de fechas</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={{ from: field.value?.from, to: field.value?.to }}
                        onSelect={field.onChange}
                        numberOfMonths={2}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {conflictState.status !== 'idle' && (
              <div className="mt-4">
                {conflictState.status === 'checking' && (
                  <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Verificando...</AlertTitle>
                    <AlertDescription>
                      Consultando disponibilidad en el calendario.
                    </AlertDescription>
                  </Alert>
                )}
                {conflictState.status === 'checked' && conflictState.hasConflict && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Conflicto de Fechas</AlertTitle>
                    <AlertDescription>
                      {conflictState.message || "Las fechas seleccionadas no están disponibles."} Se puede registrar de todas formas.
                    </AlertDescription>
                  </Alert>
                )}
                {conflictState.status === 'checked' && !conflictState.hasConflict && (
                  <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 text-green-800 dark:text-green-300">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Fechas Disponibles</AlertTitle>
                    <AlertDescription>
                      El período seleccionado está libre.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="amountUSD"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Monto (USD)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="conversionRate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tipo de Cambio (ARS por USD)</FormLabel>
                        <FormControl>
                            <Input type="number" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={conflictState.status === 'checking'}>
                Crear Reserva
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
