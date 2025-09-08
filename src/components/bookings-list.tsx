
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithDetails, Property, Tenant, ContractStatus, GuaranteeStatus } from "@/lib/data";
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { GuaranteeManager } from "./guarantee-manager";
import { EmailSender } from "./email-sender";
import { BookingActionsMenu } from "./booking-actions-menu";


interface BookingsListProps {
  bookings: BookingWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  showProperty?: boolean;
}

const contractStatusMap: Record<ContractStatus, { text: string, className: string }> = {
    not_sent: { text: 'S/Enviar', className: 'bg-gray-500 hover:bg-gray-600' },
    sent: { text: 'Enviado', className: 'bg-blue-500 hover:bg-blue-600' },
    signed: { text: 'Firmado', className: 'bg-green-600 hover:bg-green-700' },
    not_required: { text: 'N/A', className: 'bg-yellow-600 text-black hover:bg-yellow-700' }
};

const guaranteeStatusMap: Record<GuaranteeStatus, { text: string, className: string }> = {
    not_solicited: { text: 'S/Solicitar', className: 'bg-gray-400 hover:bg-gray-500' },
    solicited: { text: 'Solicitada', className: 'bg-blue-400 hover:bg-blue-500' },
    received: { text: 'Recibida', className: 'bg-green-500 hover:bg-green-600' },
    returned: { text: 'Devuelta', className: 'bg-purple-500 hover:bg-purple-600' },
    not_applicable: { text: 'N/A', className: 'bg-yellow-500 text-black hover:bg-yellow-600' }
};

export default function BookingsList({ bookings, properties, tenants, showProperty = false }: BookingsListProps) {
  if (bookings.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reservas para mostrar.</p>;
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' LLL, yyyy", { locale: es });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'ARS') => {
        if (currency === 'USD') {
             return `USD ${new Intl.NumberFormat('es-AR', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount)}`;
        }
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
  
  const getBookingColorClass = (booking: BookingWithDetails): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(booking.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(booking.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (today >= startDate && today <= endDate) {
      return "text-green-600"; // En curso
    }

    if (startDate < today) {
        return ""; // Cerrada, sin color
    }
    
    const daysUntilStart = differenceInDays(startDate, today);

    if (daysUntilStart < 7) {
      return "text-red-600";
    }
    if (daysUntilStart < 15) {
      return "text-orange-600";
    }
    if (daysUntilStart < 30) {
      return "text-blue-600";
    }
    return "";
  };


  return (
    <div>
        <div className="flex items-center space-x-4 mb-2 text-xs text-muted-foreground">
            <span className="font-semibold">Leyenda:</span>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>&lt; 30 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-600 mr-1"></div>&lt; 15 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>&lt; 7 días</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-600 mr-1"></div>En Curso</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {showProperty && <TableHead>Propiedad</TableHead>}
              <TableHead>Inquilino</TableHead>
              <TableHead>Estadía</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Garantía</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => {
              const contractInfo = contractStatusMap[booking.contractStatus || 'not_sent'];
              const guaranteeInfo = guaranteeStatusMap[booking.guaranteeStatus || 'not_solicited'];
              const nights = differenceInDays(new Date(booking.endDate), new Date(booking.startDate));
              return (
              <TableRow key={booking.id}>
                {showProperty && <TableCell className={cn("font-bold", getBookingColorClass(booking))}>{booking.property?.name || 'N/A'}</TableCell>}
                <TableCell className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <EmailSender booking={booking} asChild>
                            <button 
                              className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                              disabled={!booking.tenant?.email}
                            >
                                {booking.tenant?.name || 'N/A'}
                            </button>
                          </EmailSender>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enviar Email</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                    <div>
                        <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
                        <span className="block text-xs text-muted-foreground">{nights} noches</span>
                    </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Link href={`/contract?id=${booking.id}`} target="_blank">
                              <Badge className={cn("cursor-pointer", contractInfo.className)}>
                                  {contractInfo.text}
                              </Badge>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Ver Contrato</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                     <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                            <GuaranteeManager booking={booking} asChild>
                                  <Badge className={cn("cursor-pointer", guaranteeInfo.className)}>
                                      {guaranteeInfo.text}
                                  </Badge>
                            </GuaranteeManager>
                        </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>Gestionar Garantía</p>
                        </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary">{formatCurrency(booking.amount, booking.currency)}</Badge>
                </TableCell>
                <TableCell className={`font-bold ${booking.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(booking.balance, booking.currency)}
                </TableCell>
                <TableCell className="text-right">
                   <BookingActionsMenu booking={booking} tenants={tenants} properties={properties} allBookings={bookings} />
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
    </div>
  );
}
