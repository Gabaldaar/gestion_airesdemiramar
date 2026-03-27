
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateBlock } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateBlockDeleteForm } from './date-block-delete-form';
import { parseDateSafely } from "@/lib/utils";

interface DateBlocksListProps {
  blocks: DateBlock[];
  onDataChanged: () => void;
}

export default function DateBlocksList({ blocks, onDataChanged }: DateBlocksListProps) {
    if (blocks.length === 0) {
        return <p className="text-sm text-center text-muted-foreground p-8">No hay fechas bloqueadas para esta propiedad.</p>;
    }

    const formatDate = (dateString: string) => {
        const date = parseDateSafely(dateString);
        return date ? format(date, "dd 'de' LLL, yyyy", { locale: es }) : 'Fecha inválida';
    };

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Desde</TableHead>
                        <TableHead>Hasta</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="text-right w-[50px]">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {blocks.map((block) => (
                        <TableRow key={block.id}>
                            <TableCell>{formatDate(block.startDate)}</TableCell>
                            <TableCell>{formatDate(block.endDate)}</TableCell>
                            <TableCell className="font-medium">{block.reason || '-'}</TableCell>
                            <TableCell className="text-right">
                                <DateBlockDeleteForm
                                    blockId={block.id}
                                    propertyId={block.propertyId}
                                    onBlockDeleted={onDataChanged}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
