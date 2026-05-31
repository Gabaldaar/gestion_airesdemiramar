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
import { es, enUS, ptBR } from 'date-fns/locale';
import { DateBlockDeleteForm } from './date-block-delete-form';
import { parseDateSafely } from "@/lib/utils";
import { useState } from "react";
import { DateBlockEditForm } from "./date-block-edit-form";
import { Button } from "./ui/button";
import { Pencil, CalendarX } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

const locales: Record<string, any> = { es, en: enUS, pt: ptBR };

interface DateBlocksListProps {
  blocks: DateBlock[];
  allBookings: Booking[];
  allBlocks: DateBlock[];
  onDataChanged: () => void;
}

export default function DateBlocksList({ blocks, allBookings, allBlocks, onDataChanged }: DateBlocksListProps) {
    const { t, language } = useTranslation();
    const currentLocale = locales[language] || es;
    const [editingBlock, setEditingBlock] = useState<DateBlock | undefined>(undefined);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    if (blocks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <CalendarX className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-muted-foreground">{t('bookings.no_blocks')}</h3>
            </div>
        );
    }

    const handleEditClick = (block: DateBlock) => {
        setEditingBlock(block);
        setIsEditDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        const date = parseDateSafely(dateString);
        return date ? format(date, "dd 'de' LLL, yyyy", { locale: currentLocale }) : 'Fecha inválida';
    };

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('common.from')}</TableHead>
                            <TableHead>{t('common.to')}</TableHead>
                            <TableHead>{t('common.reason')}</TableHead>
                            <TableHead className="text-right w-[100px]">{t('common.actions')}</TableHead>
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
