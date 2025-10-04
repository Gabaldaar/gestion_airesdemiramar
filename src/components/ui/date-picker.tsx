
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { es } from 'date-fns/locale';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date: Date | undefined;
    onDateSelect: (date: Date | undefined) => void;
    placeholder?: string;
}

export function DatePicker({ date, onDateSelect, placeholder = "Selecciona una fecha" }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateSelect(selectedDate);
    setIsOpen(false);
  }

  return (
    <div className="relative w-full sm:w-[220px]">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
            <Button
            variant={"outline"}
            className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
            )}
            >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            locale={es}
            />
        </PopoverContent>
        </Popover>
         {date && (
            <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => onDateSelect(undefined)}
            >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Limpiar fecha</span>
            </Button>
        )}
    </div>
  )
}
