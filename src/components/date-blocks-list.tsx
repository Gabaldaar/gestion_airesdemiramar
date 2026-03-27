

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateBlock, Booking } from "@/lib/data";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateBlockDeleteForm } from './date-block-delete-form';
import { parseDateSafely } from "@/lib/utils";
import { useState } from "react";
import { DateBlockEditForm } from "./date-block-edit-form";
import { Button } from "./ui/button";
import { Pencil } from "lucide-react";

interface DateBlocksListProps {
  blocks: DateBlock[];
  allBookings: Booking[];
  allBlocks: DateBlock[];
  onDataChanged: () => void;
}

export default function DateBlocksList({ blocks, allBookings, allBlocks, onDataChanged }: DateBlocksListProps) {
    const [editingBlock, setEditingBlock] = useState<DateBlock | undefined>(undefined);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    if (blocks.length === 0) {
        return <p className="text-sm text-center text-muted-foreground p-8">No hay fechas bloqueadas para esta propiedad.</p>;
    }

    const handleEditClick = (block: DateBlock) => {
        setEditingBlock(block);
        setIsEditDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        const date = parseDateSafely(dateString);
        return date ? format(date, "dd 'de' LLL, yyyy", { locale: es }) : 'Fecha inválida';
    };

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Desde</TableHead>
                            <TableHead>Hasta</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead className="text-right w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {blocks.map((block) => (
                            <TableRow key={block.id}>
                                <TableCell>{formatDate(block.startDate)}</TableCell>
                                <TableCell>{formatDate(block.endDate)}</TableCell>
                                <TableCell className="font-medium">{block.reason || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(block)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <DateBlockDeleteForm
                                            blockId={block.id}
                                            propertyId={block.propertyId}
                                            onBlockDeleted={onDataChanged}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {editingBlock && (
                <DateBlockEditForm 
                    block={editingBlock}
                    allBookings={allBookings}
                    allBlocks={allBlocks}
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onDataChanged={onDataChanged}
                />
            )}
        </>
    );
}
