
'use client';

import { useState } from 'react';
import { Property, OwnerLiquidation } from '@/lib/data';
import { OwnerLiquidationAddForm } from './owner-liquidation-add-form';
import { OwnerLiquidationHistoryList } from './owner-liquidation-history-list';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";

interface OwnerLiquidationClientProps {
    property: Property;
    liquidations: OwnerLiquidation[];
    onDataChanged: () => void;
}

export function OwnerLiquidationClient({ property, liquidations, onDataChanged }: OwnerLiquidationClientProps) {
    const { t } = useTranslation();
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setIsAddFormOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('owner_liquidations.new_liquidation')}
                </Button>
                <OwnerLiquidationAddForm 
                    property={property} 
                    isOpen={isAddFormOpen} 
                    onOpenChange={setIsAddFormOpen} 
                    onActionComplete={onDataChanged} 
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">{t('owner_liquidations.history')}</h3>
                <OwnerLiquidationHistoryList 
                    liquidations={liquidations} 
                    property={property} 
                    onActionComplete={onDataChanged} 
                />
            </div>
        </div>
    );
}
