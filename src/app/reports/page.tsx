
"use client";

import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { getProperties, getBookings, getPropertyExpenses } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from "recharts";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const properties = getProperties();
  const bookings = getBookings();
  const expenses = getPropertyExpenses();

  const calculateMetrics = (propertyId: number, from: Date, to: Date) => {
    const propertyBookings = bookings.filter(
      (b) =>
        b.propertyId === propertyId &&
        new Date(b.checkIn) >= from &&
        new Date(b.checkOut) <= to
    );

    const propertyExpenses = expenses.filter(
      (e) =>
        e.propertyId === propertyId &&
        new Date(e.date) >= from &&
        new Date(e.date) <= to
    );

    const rentalExpenses = propertyBookings.flatMap(b => b.rentalExpenses).reduce((sum, e) => sum + (e.currency === "ARS" ? e.amount / 1000 : e.amount), 0)

    const income = propertyBookings.reduce((sum, b) => sum + b.amountUSD, 0);
    const totalExpenses = propertyExpenses.reduce((sum, e) => sum + e.amount, 0) + rentalExpenses;

    return {
      income,
      expenses: totalExpenses,
      net: income - totalExpenses,
    };
  };

  const reportData = date?.from && date?.to ? properties.map((p) => {
    const metrics = calculateMetrics(p.id, date.from!, date.to!);
    return {
      name: p.name,
      ...metrics,
    };
  }) : [];
  
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Reportes de Rendimiento</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Selecciona un rango</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Propiedades</CardTitle>
          <CardDescription>
            Rendimiento de cada propiedad para el período seleccionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propiedad</TableHead>
                <TableHead className="text-right">Ingresos (USD)</TableHead>
                <TableHead className="text-right">Gastos (USD)</TableHead>
                <TableHead className="text-right">Neto (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((data) => (
                <TableRow key={data.name}>
                  <TableCell className="font-medium">{data.name}</TableCell>
                  <TableCell className="text-right">${data.income.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-destructive">${data.expenses.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">${data.net.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Comparativa de Ingresos Netos</CardTitle>
           <CardDescription>
            Gráfico de barras comparando el beneficio neto de cada propiedad.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="$" />
                    <Tooltip
                        formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Neto']}
                        cursor={{fill: 'hsl(var(--muted))'}}
                    />
                    <Legend />
                    <Bar dataKey="net" fill="hsl(var(--primary))" name="Ingreso Neto (USD)" />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
