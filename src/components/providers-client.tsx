
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Provider, ProviderCategory, UserStatus, UserRole } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import ProvidersList from './providers-list';
import { ProviderEditForm } from './provider-edit-form';
import { Mail, Search, X, ListFilter, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useTranslation } from '@/i18n/useTranslation';
import { Input } from './ui/input';
import useWindowSize from '@/hooks/use-window-size';

type RatingFilter = 'all' | 'none' | '1' | '2' | '3' | '4' | '5';
type StatusFilter = 'all' | UserStatus;


interface ProvidersClientProps {
  initialProviders: Provider[];
  categories: ProviderCategory[];
  onFilteredProvidersChange: (count: number) => void;
  onDataChanged: () => void;
}

export default function ProvidersClient({ initialProviders, categories, onFilteredProvidersChange, onDataChanged }: ProvidersClientProps) {
  const { t } = useTranslation();
  const { width } = useWindowSize();
  const isMobile = typeof width === 'number' ? width < 768 : false;

  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const lastCountRef = useRef<number | null>(null);

  // Set initial filter state based on device
  useEffect(() => {
    if (width !== undefined) {
      setIsFilterExpanded(!isMobile);
    }
  }, [isMobile, width]);

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setIsEditDialogOpen(true);
  };

  const filteredProviders = useMemo(() => {
    // FILTRO ESTRICTO: Solo proveedores (personal externo)
    let currentProviders = initialProviders.filter(p => p.role === 'provider');

    // Filter by Search Term
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        currentProviders = currentProviders.filter(p => 
            p.name.toLowerCase().includes(lowerTerm) ||
            (p.email && p.email.toLowerCase().includes(lowerTerm)) ||
            (p.phone && p.phone.includes(lowerTerm))
        );
    }

    // Filter by Category
    if (categoryFilter !== 'all') {
      currentProviders = currentProviders.filter(provider => provider.categoryId === categoryFilter);
    }

    // Filter by Rating
    if (ratingFilter !== 'all') {
      if (ratingFilter === 'none') {
        currentProviders = currentProviders.filter(provider => !provider.rating || provider.rating === 0);
      } else {
        const rating = parseInt(ratingFilter, 10);
        currentProviders = currentProviders.filter(provider => provider.rating === rating);
      }
    }

    // Filter by Status
    if (statusFilter !== 'all') {
        currentProviders = currentProviders.filter(provider => provider.status === statusFilter);
    }
    
    return currentProviders.sort((a, b) => a.name.localeCompare(b.name));

  }, [initialProviders, searchTerm, categoryFilter, ratingFilter, statusFilter]);
  
  useEffect(() => {
    const currentLength = filteredProviders.length;
    if (lastCountRef.current !== currentLength) {
        lastCountRef.current = currentLength;
        onFilteredProvidersChange(currentLength);
    }
  }, [filteredProviders.length, onFilteredProvidersChange]);


  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setRatingFilter('all');
    setStatusFilter('all');
  };
  
  const handleEmailAll = () => {
    const recipients = filteredProviders
      .map(p => p.email)
      .filter((email): email is string => !!email);
    
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length > 0) {
        let mailtoLink = `mailto:?bcc=${uniqueRecipients.join(',')}`;
        const params = [];
        params.push(`subject=${encodeURIComponent("Novedades de Gestión")}`);
        
        mailtoLink += `&${params.join('&')}`;
        window.location.href = mailtoLink;
    } else {
        toast({
            variant: "destructive",
            title: t('common.error'),
            description: "No hay destinatarios con email en la selección actual.",
        });
    }
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
                {filteredProviders.length} / {initialProviders.length}
            </span>
        </div>
        
        {isFilterExpanded && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end flex-wrap animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid gap-2 flex-1 min-w-[200px]">
                    <Label htmlFor="provider-search">{t('common.search')}</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="provider-search"
                            placeholder={t('providers.filters.placeholder_search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label>{t('providers.filters.category')}</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder={t('providers.filters.category')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>{t('providers.filters.rating')}</Label>
                    <Select value={ratingFilter} onValueChange={(value) => setRatingFilter(value as RatingFilter)}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder={t('providers.filters.rating')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="none">{t('tenants.filters.rating_options.none')}</SelectItem>
                            <SelectItem value="5">5 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="4">4 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="3">3 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="2">2 {t('tenants.filters.rating_options.stars')}</SelectItem>
                            <SelectItem value="1">1 {t('tenants.filters.rating_options.star')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label>{t('providers.filters.status')}</Label>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                        <SelectTrigger className="w-full sm:w-[180px] bg-background">
                            <SelectValue placeholder={t('providers.filters.status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            <SelectItem value="active">{t('providers.status.active')}</SelectItem>
                            <SelectItem value="pending">{t('providers.status.pending')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-9 px-2 text-muted-foreground hover:bg-background/50">
                        <X className="h-4 w-4 mr-1" /> {t('common.clean')}
                    </Button>
                    <Button onClick={handleEmailAll}>
                        <Mail className="mr-2 h-4 w-4"/>
                        {t('common.email_all')}
                    </Button>
                </div>
            </div>
        )}
      </div>
      <ProvidersList 
        providers={filteredProviders} 
        categories={categories} 
        onDataChanged={onDataChanged} 
        onEditProvider={handleEditProvider}
      />
      {editingProvider && (
        <ProviderEditForm
            provider={editingProvider}
            categories={categories}
            onProviderUpdated={onDataChanged}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            allowedRoles={['provider']}
        />
      )}
    </div>
  );
}
