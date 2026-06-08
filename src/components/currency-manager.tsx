'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { CurrencySettings } from '@/lib/data';
import { Currency } from '@/lib/currencies';
import { updateCurrencySettings } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { useAuth } from './auth-provider';

const initialState = { success: false, message: '' };

function SubmitButton({ isPending, disabled }: { isPending: boolean; disabled: boolean }) {
    const { t } = useTranslation();
    return (
        <Button type="submit" disabled={isPending || disabled}>
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                t('common.save')
            )}
        </Button>
    );
}

interface CurrencyManagerProps {
    initialSettings: CurrencySettings | null;
    allCurrencies: Currency[];
    onSettingsChanged: () => void;
}

export default function CurrencyManager({ initialSettings, allCurrencies, onSettingsChanged }: CurrencyManagerProps) {
    const { orgId } = useAuth();
    const { t, language } = useTranslation();
    const { toast } = useToast();
    const [state, setState] = useState(initialState);
    const [isPending, startTransition] = useTransition();

    const currencyDisplay = useMemo(() => {
        try {
            return new Intl.DisplayNames([language || 'es'], { type: 'currency' });
        } catch (e) {
            return null;
        }
    }, [language]);

    const getCurrencyName = (code: string, defaultName: string) => {
        if (currencyDisplay) {
            try {
                const name = currencyDisplay.of(code);
                // Capitalize first letter
                if (name) return name.charAt(0).toUpperCase() + name.slice(1);
            } catch (e) {
                return defaultName;
            }
        }
        return defaultName;
    };

    const [baseCurrency, setBaseCurrency] = useState(initialSettings?.baseCurrency || 'USD');
    
    // Deduplicación inicial preventiva
    const [favoriteCurrencies, setFavoriteCurrencies] = useState<string[]>(() => {
        const initial = initialSettings?.favoriteCurrencies || ['USD', 'ARS', 'EUR'];
        return Array.from(new Set(initial));
    });
    
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
            const result = await updateCurrencySettings(initialState, formData);
            setState(result);
        });
    };

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? t('common.success') : t('common.error'),
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
        if (state.success) {
            onSettingsChanged();
        }
    }, [state, onSettingsChanged, toast, t]);

    const handleFavoriteChange = (code: string, checked: boolean) => {
        setFavoriteCurrencies(prev => {
            let newFavorites: string[];
            if (checked) {
                // Evitamos duplicados usando un Set
                newFavorites = Array.from(new Set([...prev, code]));
            } else {
                newFavorites = prev.filter(c => c !== code);
            }
            
            if (newFavorites.length > 0 && !newFavorites.includes(baseCurrency)) {
                setBaseCurrency(newFavorites[0]);
            }
            return newFavorites;
        });
    };
    
    const favoritesWithNames = useMemo(() => {
        return favoriteCurrencies
            .map(code => allCurrencies.find(c => c.code === code))
            .filter((c): c is Currency => c !== undefined);
    }, [favoriteCurrencies, allCurrencies]);

    const isSaveDisabled = !baseCurrency || favoriteCurrencies.length === 0 || !favoriteCurrencies.includes(baseCurrency);

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6 max-w-2xl mx-auto">
             <input type="hidden" name="orgId" value={orgId || ''} />
             <input type="hidden" name="baseCurrency" value={baseCurrency} />
             {favoriteCurrencies.map(code => <input key={code} type="hidden" name="favoriteCurrencies" value={code} />)}

            <div className="space-y-4 rounded-lg border p-4">
                 <h4 className="font-medium">{t('settings.currencies.favorites_label')}</h4>
                <p className="text-sm text-muted-foreground">
                    {t('settings.currencies.favorites_desc')}
                </p>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            {favoriteCurrencies.length > 0 ? `${favoriteCurrencies.length} ${t('common.all').toLowerCase()}` : t('common.search')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                            <CommandInput placeholder={t('common.search') + "..."} />
                            <CommandList>
                                <CommandEmpty>{t('tenants.no_tenants')}</CommandEmpty>
                                <CommandGroup>
                                    {allCurrencies.map(currency => {
                                        const isChecked = favoriteCurrencies.includes(currency.code);
                                        return (
                                            <CommandItem
                                                key={currency.code}
                                                onSelect={() => handleFavoriteChange(currency.code, !isChecked)}
                                                className="flex items-center"
                                            >
                                                <Checkbox
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => handleFavoriteChange(currency.code, !!checked)}
                                                    className="mr-2"
                                                />
                                                <span>{getCurrencyName(currency.code, currency.name)} ({currency.code})</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            
             <div className="space-y-4 rounded-lg border p-4">
                 <h4 className="font-medium">{t('settings.currencies.base_label')}</h4>
                 <p className="text-sm text-muted-foreground">
                    {t('settings.currencies.base_desc')}
                </p>
                <RadioGroup value={baseCurrency} onValueChange={setBaseCurrency} className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {favoritesWithNames.map(currency => (
                        <div key={currency.code} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/30 transition-colors">
                            <RadioGroupItem value={currency.code} id={`currency-${currency.code}`} />
                            <Label htmlFor={`currency-${currency.code}`} className="cursor-pointer flex-1">{getCurrencyName(currency.code, currency.name)} ({currency.code})</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            <div className="flex justify-end">
                <SubmitButton isPending={isPending} disabled={isSaveDisabled} />
            </div>
        </form>
    );
}
