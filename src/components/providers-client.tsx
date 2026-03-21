
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Provider, ProviderCategory } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import ProvidersList from './providers-list';
import { ProviderEditForm } from './provider-edit-form';

type RatingFilter = 'all' | 'none' | '1' | '2' | '3' | '4' | '5';

interface ProvidersClientProps {
  initialProviders: Provider[];
  categories: ProviderCategory[];
  onFilteredProvidersChange: (count: number) => void;
  onDataChanged: () => void;
}

export default function ProvidersClient({ initialProviders, categories, onFilteredProvidersChange, onDataChanged }: ProvidersClientProps) {
  const [providers, setProviders] = useState(initialProviders);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setIsEditDialogOpen(true);
  };

  const filteredProviders = useMemo(() => {
    let currentProviders = providers;

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
    
    return currentProviders;
  }, [providers, categoryFilter, ratingFilter]);

  // Effect to update the count in the parent component
  useMemo(() => {
    onFilteredProvidersChange(filteredProviders.length);
  }, [filteredProviders, onFilteredProvidersChange]);


  const handleClearFilters = () => {
    setCategoryFilter('all');
    setRatingFilter('all');
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
        <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleClearFilters}>Limpiar Filtros</Button>
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
