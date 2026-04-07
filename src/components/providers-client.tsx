'use client';

import { useState, useMemo, useEffect } from 'react';
import { Provider, ProviderCategory, UserStatus, UserRole } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import ProvidersList from './providers-list';
import { ProviderEditForm } from './provider-edit-form';
import { Mail } from 'lucide-react';
import { useToast } from './ui/use-toast';

type RatingFilter = 'all' | 'none' | '1' | '2' | '3' | '4' | '5';
type StatusFilter = 'all' | UserStatus;


interface ProvidersClientProps {
  initialProviders: Provider[];
  categories: ProviderCategory[];
  onFilteredProvidersChange: (count: number) => void;
  onDataChanged: () => void;
}

export default function ProvidersClient({ initialProviders, categories, onFilteredProvidersChange, onDataChanged }: ProvidersClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // This effect can be used if we need to react to external changes to initialProviders
    // For now, it's fine as is.
  }, [initialProviders]);

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setIsEditDialogOpen(true);
  };

  const filteredProviders = useMemo(() => {
    let currentProviders = [...initialProviders];

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
    
    // Scoring function for robust sorting
    const getSortScore = (provider: Provider): number => {
        if (provider.role === 'admin') return 1;
        if (provider.status === 'active') return 2;
        if (provider.status === 'pending') return 3;
        return 4; // Failsafe
    };

    currentProviders.sort((a, b) => {
        const scoreA = getSortScore(a);
        const scoreB = getSortScore(b);

        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }

        // If scores are the same, sort by name
        return a.name.localeCompare(b.name);
    });

    return currentProviders;

  }, [initialProviders, categoryFilter, ratingFilter, statusFilter]);
  
  // Effect to update the count in the parent component
  useEffect(() => {
    onFilteredProvidersChange(filteredProviders.length);
  }, [filteredProviders, onFilteredProvidersChange]);


  const handleClearFilters = () => {
    setCategoryFilter('all');
    setRatingFilter('all');
    setStatusFilter('all');
  };
  
  const handleEmailAll = () => {
    const recipients = filteredProviders
      .map(tenant => tenant.email)
      .filter((email): email is string => !!email);
    
    const uniqueRecipients = [...new Set(recipients)];

    if (uniqueRecipients.length > 0) {
        let mailtoLink = `mailto:?bcc=${uniqueRecipients.join(',')}`;
        const params = [];
        params.push(`subject=${encodeURIComponent("Novedades Aires de Miramar")}`);
        
        mailtoLink += `&${params.join('&')}`;
        window.location.href = mailtoLink;
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No hay colaboradores con email en la selección actual.",
        });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50 sm:flex-row sm:items-end flex-wrap">
        <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="grid gap-2">
            <Label>Calificación</Label>
            <Select value={ratingFilter} onValueChange={(value) => setRatingFilter(value as RatingFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por calificación" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="none">Sin Calificar</SelectItem>
                    <SelectItem value="5">5 Estrellas</SelectItem>
                    <SelectItem value="4">4 Estrellas</SelectItem>
                    <SelectItem value="3">3 Estrellas</SelectItem>
                    <SelectItem value="2">2 Estrellas</SelectItem>
                    <SelectItem value="1">1 Estrella</SelectItem>
                </SelectContent>
            </Select>
        </div>
         <div className="grid gap-2">
            <Label>Estado</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
            <Button onClick={handleEmailAll}>
                <Mail className="mr-2 h-4 w-4"/>
                Email a Todos
            </Button>
        </div>
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
        />
      )}
    </div>
  );
}
