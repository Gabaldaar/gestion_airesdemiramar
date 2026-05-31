'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTenant } from '@/lib/actions';
import { Tenant, Origin } from '@/lib/data';
import { Loader2, Star, User, Save } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { useAuth } from './auth-provider';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/i18n/useTranslation';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
    const { t } = useTranslation();
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="font-bold uppercase tracking-widest h-11 px-8 shadow-lg">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('common.save')}
                </>
            )}
        </Button>
    )
}

interface TenantEditFormProps {
    tenant: Tenant;
    onTenantUpdated: () => void;
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function TenantEditForm({ tenant, onTenantUpdated, isOpen, onOpenChange }: TenantEditFormProps) {
  const { appUser, orgId } = useAuth();
  const { t } = useTranslation();

  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [rating, setRating] = useState(tenant.rating || 0);

  const formAction = (formData: FormData) => {
    startTransition(async () => {
        const result = await updateTenant(initialState, formData);
        setState(result);
    });
  };

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      onTenantUpdated();
    }
  }, [state, onTenantUpdated, onOpenChange]);

  const fetchOrigins = useCallback(async () => {
    if (!orgId) return;
    try {
        const q = query(collection(db, 'origins'), where('orgId', '==', orgId));
        let snap = await getDocs(q);
        setOrigins(snap.docs.map(d => ({ id: d.id, ...d.data() } as Origin)).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })));
    } catch (e) {
        console.error("Error fetching origins:", e);
    }
  }, [orgId]);

  useEffect(() => {
    if (isOpen) {
      setRating(tenant.rating || 0);
      fetchOrigins();
    }
  }, [isOpen, tenant, fetchOrigins]);

  const getStarColorClass = (currentRating: number) => {
    if (currentRating === 1) return "text-red-500 fill-red-500";
    if (currentRating === 2) return "text-orange-400 fill-orange-400";
    return "text-yellow-400 fill-yellow-400";
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border flex flex-col max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
          <DialogHeader className="p-6 bg-background border-b relative z-10 shrink-0">
          <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-primary flex items-center gap-2">
              <User className="h-6 w-6" />
              {t('tenants.edit_dialog.title')}
          </DialogTitle>
          <DialogDescription>
              {t('tenants.edit_dialog.description')}
          </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="flex-1 flex flex-col overflow-hidden bg-muted/30">
              <input type="hidden" name="id" value={tenant.id} />
              <input type="hidden" name="rating" value={rating} />
              <div className="flex-1 overflow-y-auto p-6 space-y-4 shadow-inner">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                      {t('tenants.copy_format.name')}
                      </Label>
                      <Input id="name" name="name" defaultValue={tenant.name} className="col-span-3 h-11 bg-background shadow-sm" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dni" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                      {t('tenants.card.dni')}
                      </Label>
                      <Input id="dni" name="dni" defaultValue={tenant.dni} className="col-span-3 h-11 bg-background shadow-sm" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                      {t('tenants.card.email')}
                      </Label>
                      <Input id="email" name="email" type="email" defaultValue={tenant.email} className="col-span-3 h-11 bg-background shadow-sm" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                      {t('tenants.card.phone')}
                      </Label>
                      <div className="col-span-3 flex items-center gap-2">
                          <Select name="countryCode" defaultValue={tenant.countryCode || "+54"}>
                              <SelectTrigger className="w-[100px] h-11 bg-background">
                                  <SelectValue placeholder="+54" />
                              </SelectTrigger>
                              <SelectContent>
                                  {countries.map(country => (
                                      <SelectItem key={country.code} value={country.dial_code}>
                                          {country.dial_code}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          <Input id="phone" name="phone" defaultValue={tenant.phone} className="flex-grow h-11 bg-background shadow-sm" />
                      </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="address" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                      {t('tenants.card.address')}
                      </Label>
                      <Input id="address" name="address" defaultValue={tenant.address} className="col-span-3 h-11 bg-background shadow-sm" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="city" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                      {t('tenants.card.city')}
                      </Label>
                      <Input id="city" name="city" defaultValue={tenant.city} className="col-span-3 h-11 bg-background shadow-sm" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="originId" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                          {t('tenants.filters.origin')}
                      </Label>
                      <Select name="originId" defaultValue={tenant.originId || 'none'}>
                          <SelectTrigger className="col-span-3 h-11 bg-background shadow-sm">
                              <SelectValue placeholder={t('common.all')} />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="none">{t('common.none')}</SelectItem>
                              {origins.map(origin => (
                                  <SelectItem key={origin.id} value={origin.id}>{origin.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="rating" className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                          {t('tenants.card.rating')}
                      </Label>
                      <div className="col-span-3 flex items-center gap-1.5 p-2 bg-background/50 rounded-lg border w-fit">
                          {[...Array(5)].map((_, index) => {
                              const ratingValue = index + 1;
                              return (
                              <Star
                                  key={ratingValue}
                                  className={cn(
                                  "h-6 w-6 cursor-pointer transition-all hover:scale-125",
                                  ratingValue <= rating
                                      ? getStarColorClass(rating)
                                      : "text-gray-300"
                                  )}
                                  onClick={() => !isPending && setRating(ratingValue === rating ? 0 : ratingValue)}
                              />
                              );
                          })}
                      </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                        {t('tenants.card.notes')}
                    </Label>
                    <Textarea id="notes" name="notes" defaultValue={tenant.notes} className="col-span-3 bg-background shadow-inner min-h-[100px]" />
                </div>
              </div>
              <DialogFooter className="p-6 bg-background border-t shrink-0 flex flex-row items-center justify-end gap-2">
                  <Button type="button" variant="outline" className="h-11 font-bold uppercase text-[10px] tracking-widest bg-background" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
                  <SubmitButton />
              </DialogFooter>
          </form>
          {state.message && !state.success && (
              <p className="text-red-500 text-sm mt-2 px-6 pb-6">{state.message}</p>
          )}
      </DialogContent>
    </Dialog>
  );
}
