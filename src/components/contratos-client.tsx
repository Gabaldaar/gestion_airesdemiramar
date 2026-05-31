
'use client';

import { useState, useMemo, useEffect } from 'react';
import { ContratoWithDetails, Property, Tenant, Origin } from '@/lib/data';
import ContratosList from '@/components/contratos-list';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { X, Search, ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from "@/i18n/useTranslation";
import { parseDateSafely } from '@/lib/utils';
import useWindowSize from '@/hooks/use-window-size';

interface ContratosClientProps {
  initialContratos: ContratoWithDetails[];
  properties: Property[];
  tenants: Tenant[];
  origins: Origin[];
  onDataChanged: () => void;
}

export default function ContratosClient({ initialContratos, properties, tenants, origins, onDataChanged }: ContratosClientProps) {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyIdFilter, setPropertyIdFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Set initial filter state based on device
  useEffect(() => {
    if (width !== undefined) {
      setIsFilterExpanded(!isMobile);
    }
  }, [isMobile, width]);

  const filteredContratos = useMemo(() => {
    return initialContratos.filter(c => {
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            const match = c.tenantName.toLowerCase().includes(lowerTerm) || 
                          c.notes?.toLowerCase().includes(lowerTerm);
            if (!match) return false;
        }

        if (propertyIdFilter !== 'all' && c.propertyId !== propertyIdFilter) return false;
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;

        return true;
    }).sort((a, b) => {
        const dateA = parseDateSafely(a.fechaInicio)?.getTime() || 0;
        const dateB = parseDateSafely(b.fechaInicio)?.getTime() || 0;
        return dateB - dateA;
    });
  }, [initialContratos, searchTerm, propertyIdFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setPropertyIdFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/70 shadow-sm">
        <div className="flex items-center justify-between mb-1 w-full">
            <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:opacity-80 transition-opacity"
            >
                <ListFilter className="h-4 w-4" /> 
                {t('common.filters')}
                {isFilterExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <span className="text-[10px] font-bold bg-background/50 px-2 py-0.5 rounded-full text-primary border border-primary/20">
                {filteredContratos.length} / {initialContratos.length}
            </span>
        </div>
        
        {isFilterExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid gap-2">
                    <Label>{t('common.search')}</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Inquilino, notas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>{t('bookings.filters.property')}</Label>
                    <Select value={propertyIdFilter} onValueChange={setPropertyIdFilter}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('bookings.filters.property')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            {properties.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>{t('bookings.filters.status')}</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="draft">{t('contratos.status.draft')}</SelectItem>
                            <SelectItem value="active">{t('contratos.status.active')}</SelectItem>
                            <SelectItem value="ended">{t('contratos.status.ended')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-2 text-muted-foreground hover:bg-background/50">
                        <X className="h-4 w-4 mr-1" /> {t('common.clean')}
                    </Button>
                </div>
            </div>
        )}
      </div>
      <ContratosList 
        contratos={filteredContratos} 
        properties={properties} 
        tenants={tenants} 
        onDataChanged={onDataChanged} 
      />
    </div>
  );
}
